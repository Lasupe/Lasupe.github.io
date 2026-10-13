"""Automated tests for the CS 499 database enhancement.

These tests use an in-memory fake MongoDB client/collection so they do not
require the original Austin Animal Center dataset or a live MongoDB server.
"""
import os
import sys
import unittest
from copy import deepcopy
from unittest.mock import patch

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
ENHANCED = os.path.join(ROOT, "enhanced_source")
if ENHANCED not in sys.path:
    sys.path.insert(0, ENHANCED)

from crud import CRUD, MongoConfig, ValidationError


class Result:
    def __init__(self, *, inserted_id=None, modified_count=0, deleted_count=0):
        self.acknowledged = True
        self.inserted_id = inserted_id
        self.modified_count = modified_count
        self.deleted_count = deleted_count


class FakeCursor(list):
    def limit(self, count):
        return FakeCursor(self[:count])


def matches(document, query):
    for key, expected in query.items():
        actual = document.get(key)
        if isinstance(expected, dict):
            for op, value in expected.items():
                if op == "$lte" and not (actual <= value):
                    return False
                if op == "$gte" and not (actual >= value):
                    return False
                if op == "$in" and actual not in value:
                    return False
        elif actual != expected:
            return False
    return True


class FakeCollection:
    def __init__(self):
        self.documents = []
        self.indexes = []
        self.database = FakeDatabase(self)

    def insert_one(self, document):
        doc = deepcopy(document)
        doc["_id"] = len(self.documents) + 1
        self.documents.append(doc)
        return Result(inserted_id=doc["_id"])

    def find(self, query, projection=None):
        rows = [deepcopy(d) for d in self.documents if matches(d, query)]
        return FakeCursor(rows)

    def update_one(self, query, spec):
        for doc in self.documents:
            if matches(doc, query):
                changed = apply_update(doc, spec)
                return Result(modified_count=int(changed))
        return Result(modified_count=0)

    def update_many(self, query, spec):
        count = 0
        for doc in self.documents:
            if matches(doc, query) and apply_update(doc, spec):
                count += 1
        return Result(modified_count=count)

    def delete_one(self, query):
        for i, doc in enumerate(self.documents):
            if matches(doc, query):
                del self.documents[i]
                return Result(deleted_count=1)
        return Result(deleted_count=0)

    def delete_many(self, query):
        before = len(self.documents)
        self.documents = [d for d in self.documents if not matches(d, query)]
        return Result(deleted_count=before - len(self.documents))

    def create_index(self, keys, name):
        self.indexes.append((name, tuple(keys)))
        return name


def apply_update(doc, spec):
    before = deepcopy(doc)
    for field, value in spec.get("$set", {}).items():
        doc[field] = value
    for field in spec.get("$unset", {}):
        doc.pop(field, None)
    for field, amount in spec.get("$inc", {}).items():
        doc[field] = doc.get(field, 0) + amount
    return before != doc


class FakeDatabase:
    def __init__(self, collection):
        self.collection = collection

    def __getitem__(self, name):
        return self.collection

    def command(self, command):
        return {
            "queryPlanner": {"winningPlan": {"stage": "IXSCAN"}},
            "executionStats": {
                "nReturned": 1,
                "executionTimeMillis": 0,
                "totalKeysExamined": 1,
                "totalDocsExamined": 1,
            },
        }


class FakeClient:
    def __init__(self):
        self.collection = FakeCollection()
        self.database = FakeDatabase(self.collection)
        self.collection.database = self.database

    def __getitem__(self, name):
        return self.database

    def close(self):
        pass


VALID_DOG = {
    "animal_id": "A000001",
    "animal_type": "Dog",
    "breed": "Labrador Retriever Mix",
    "outcome_type": "Adoption",
    "age_upon_outcome_in_weeks": 52.0,
    "location_lat": 30.25,
    "location_long": -97.75,
}


class DatabaseEnhancementTests(unittest.TestCase):
    def setUp(self):
        self.client = FakeClient()
        cfg = MongoConfig(username="test", password="test")
        self.crud = CRUD(cfg, client=self.client)

    def test_environment_configuration_requires_credentials(self):
        with patch.dict(os.environ, {}, clear=True):
            with self.assertRaises(RuntimeError):
                MongoConfig.from_env()

        env = {
            "AAC_MONGO_USER": "aacuser",
            "AAC_MONGO_PASSWORD": "secret",
            "AAC_MONGO_HOST": "localhost",
            "AAC_MONGO_PORT": "27017",
            "AAC_MONGO_AUTH_DB": "aac",
        }
        with patch.dict(os.environ, env, clear=True):
            cfg = MongoConfig.from_env()
            self.assertEqual(cfg.username, "aacuser")
            self.assertEqual(cfg.port, 27017)

    def test_create_validates_required_fields_and_types(self):
        self.assertTrue(self.crud.create(VALID_DOG))
        with self.assertRaises(ValidationError):
            self.crud.create({"animal_type": "Dog", "breed": "Lab"})
        bad = dict(VALID_DOG)
        bad["age_upon_outcome_in_weeks"] = "one year"
        with self.assertRaises(ValidationError):
            self.crud.create(bad)

    def test_read_and_limit(self):
        self.crud.create(VALID_DOG)
        second = dict(VALID_DOG, animal_id="A000002")
        self.crud.create(second)
        self.assertEqual(len(self.crud.read({"animal_type": "Dog"}, limit=1)), 1)

    def test_safe_update_and_delete(self):
        self.crud.create(VALID_DOG)
        with self.assertRaises(ValidationError):
            self.crud.update({}, {"$set": {"outcome_type": "Transfer"}})
        with self.assertRaises(ValidationError):
            self.crud.delete({})
        with self.assertRaises(ValidationError):
            self.crud.update({"animal_id": "A000001"}, {"$rename": {"breed": "b"}})
        with self.assertRaises(ValidationError):
            self.crud.update({"animal_id": "A000001"}, {"$unset": {"animal_id": ""}})

        self.assertEqual(
            self.crud.update(
                {"animal_id": "A000001"},
                {"$set": {"outcome_type": "Transfer"}},
            ),
            1,
        )
        self.assertEqual(
            self.crud.read({"animal_id": "A000001"})[0]["outcome_type"],
            "Transfer",
        )
        self.assertEqual(self.crud.delete({"animal_id": "A000001"}), 1)

    def test_indexes_and_explain(self):
        names = self.crud.ensure_indexes()
        self.assertIn("rescue_profile_idx", names)
        self.assertIn("breed_outcome_idx", names)
        explain = self.crud.explain_query({"animal_type": "Dog"})
        stats = explain["executionStats"]
        self.assertEqual(stats["totalDocsExamined"], 1)
        self.assertEqual(
            explain["queryPlanner"]["winningPlan"]["stage"], "IXSCAN"
        )


if __name__ == "__main__":
    unittest.main(verbosity=2)
