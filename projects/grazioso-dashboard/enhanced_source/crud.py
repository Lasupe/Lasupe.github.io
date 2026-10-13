"""
Enhanced MongoDB CRUD layer for the CS 499 Grazioso Salvare database artifact.

Enhancements:
- Environment-based MongoDB configuration (no credentials embedded in source).
- Fail-closed authentication: no unauthenticated fallback.
- Application-level animal record validation.
- Safe update/delete guards to prevent accidental collection-wide writes.
- Allowlisted update operators.
- Rescue-profile indexes integrated into the database layer.
- Query-plan helper for explain("executionStats") performance evidence.
"""

from __future__ import annotations

import os
from dataclasses import dataclass
from typing import Any, Dict, List, Mapping, Optional, Sequence, Tuple

from pymongo import ASCENDING, MongoClient, errors
from pymongo.collection import Collection


class ValidationError(ValueError):
    """Raised when application data or a database operation is unsafe."""


@dataclass(frozen=True)
class MongoConfig:
    username: str
    password: str
    host: str = "localhost"
    port: int = 27017
    auth_source: str = "aac"
    tls: bool = False
    replica_set: Optional[str] = None

    @classmethod
    def from_env(cls, require_credentials: bool = True) -> "MongoConfig":
        """Load MongoDB settings from environment variables."""
        username = os.getenv("AAC_MONGO_USER", "").strip()
        password = os.getenv("AAC_MONGO_PASSWORD", "")
        if require_credentials and (not username or not password):
            raise RuntimeError(
                "MongoDB credentials are required. Set AAC_MONGO_USER and "
                "AAC_MONGO_PASSWORD in the environment."
            )

        raw_port = os.getenv("AAC_MONGO_PORT", "27017")
        try:
            port = int(raw_port)
        except ValueError as exc:
            raise RuntimeError("AAC_MONGO_PORT must be an integer.") from exc

        return cls(
            username=username,
            password=password,
            host=os.getenv("AAC_MONGO_HOST", "localhost").strip() or "localhost",
            port=port,
            auth_source=os.getenv("AAC_MONGO_AUTH_DB", "aac").strip() or "aac",
            tls=os.getenv("AAC_MONGO_TLS", "false").strip().lower()
            in {"1", "true", "yes", "on"},
            replica_set=os.getenv("AAC_MONGO_REPLICA_SET") or None,
        )


class CRUD:
    """Validated CRUD and query-performance helper for animal records."""

    REQUIRED_CREATE_FIELDS = ("animal_id", "animal_type", "breed")
    STRING_FIELDS = {
        "animal_id", "animal_type", "breed", "color", "date_of_birth",
        "datetime", "monthyear", "name", "outcome_subtype", "outcome_type",
        "sex_upon_outcome",
    }
    NUMERIC_FIELDS = {
        "age_upon_outcome_in_weeks", "location_lat", "location_long",
    }
    ALLOWED_UPDATE_OPERATORS = {"$set", "$unset", "$inc"}

    # These indexes match the fields used by the Grazioso rescue-profile queries.
    INDEX_SPECS: Sequence[Tuple[str, Sequence[Tuple[str, int]]]] = (
        (
            "rescue_profile_idx",
            (
                ("animal_type", ASCENDING),
                ("breed", ASCENDING),
                ("age_upon_outcome_in_weeks", ASCENDING),
            ),
        ),
        (
            "breed_outcome_idx",
            (("breed", ASCENDING), ("outcome_type", ASCENDING)),
        ),
    )

    def __init__(
        self,
        config: MongoConfig,
        db_name: str = "aac",
        collection_name: str = "animals",
        client: Optional[MongoClient] = None,
    ) -> None:
        self._db_name = db_name
        self._collection_name = collection_name
        self._client: Optional[MongoClient] = None
        self._collection: Optional[Collection] = None

        if client is not None:
            self._client = client
            self._collection = client[db_name][collection_name]
        else:
            self._connect(config)

    def _connect(self, config: MongoConfig) -> None:
        """Connect using the supplied authenticated configuration."""
        client_kwargs: Dict[str, Any] = {
            "host": config.host,
            "port": config.port,
            "tls": config.tls,
            "connectTimeoutMS": 5000,
            "serverSelectionTimeoutMS": 5000,
        }
        if config.username and config.password:
            client_kwargs.update(
                {
                    "username": config.username,
                    "password": config.password,
                    "authSource": config.auth_source,
                }
            )
        if config.replica_set:
            client_kwargs["replicaSet"] = config.replica_set

        try:
            self._client = MongoClient(**client_kwargs)
            self._client.admin.command("ping")
            self._collection = self._client[self._db_name][self._collection_name]
        except errors.PyMongoError as exc:
            raise RuntimeError(f"[MongoDB] Connection failed: {exc}") from exc

    def _ensure_collection(self) -> Collection:
        if self._collection is None:
            raise RuntimeError("[MongoDB] Collection is not initialized.")
        return self._collection

    @staticmethod
    def _require_mapping(value: Any, label: str) -> Dict[str, Any]:
        if not isinstance(value, Mapping):
            raise ValidationError(f"{label} must be a dictionary.")
        return dict(value)

    @staticmethod
    def _require_nonempty_filter(query: Dict[str, Any], operation: str) -> None:
        if not query:
            raise ValidationError(
                f"{operation} requires a non-empty filter to prevent an "
                "accidental collection-wide write."
            )

    @classmethod
    def validate_animal_document(
        cls, document: Mapping[str, Any], partial: bool = False
    ) -> Dict[str, Any]:
        """Validate known animal fields before create/update operations."""
        clean = cls._require_mapping(document, "document")

        if not partial:
            missing = [
                field for field in cls.REQUIRED_CREATE_FIELDS
                if field not in clean
                or not isinstance(clean[field], str)
                or not clean[field].strip()
            ]
            if missing:
                raise ValidationError(
                    "Missing required non-empty field(s): " + ", ".join(missing)
                )

        for field, value in clean.items():
            if field == "_id":
                raise ValidationError("_id cannot be supplied or modified by this API.")

            if field in cls.STRING_FIELDS and value is not None:
                if not isinstance(value, str):
                    raise ValidationError(f"{field} must be a string.")
                if field in cls.REQUIRED_CREATE_FIELDS and not value.strip():
                    raise ValidationError(f"{field} cannot be empty.")

            if field in cls.NUMERIC_FIELDS and value is not None:
                if isinstance(value, bool) or not isinstance(value, (int, float)):
                    raise ValidationError(f"{field} must be numeric.")

        return clean

    @classmethod
    def _validate_update_spec(cls, update_spec: Mapping[str, Any]) -> Dict[str, Any]:
        spec = cls._require_mapping(update_spec, "update specification")
        if not spec:
            raise ValidationError("update specification cannot be empty.")

        unsupported = set(spec) - cls.ALLOWED_UPDATE_OPERATORS
        if unsupported:
            raise ValidationError(
                "Unsupported update operator(s): " + ", ".join(sorted(unsupported))
            )

        if "$set" in spec:
            spec["$set"] = cls.validate_animal_document(spec["$set"], partial=True)

        if "$unset" in spec:
            unset = cls._require_mapping(spec["$unset"], "$unset")
            protected = set(unset) & set(cls.REQUIRED_CREATE_FIELDS)
            if protected:
                raise ValidationError(
                    "Required field(s) cannot be unset: " + ", ".join(sorted(protected))
                )
            if "_id" in unset:
                raise ValidationError("_id cannot be unset.")
            spec["$unset"] = unset

        if "$inc" in spec:
            increments = cls._require_mapping(spec["$inc"], "$inc")
            for field, amount in increments.items():
                if field not in cls.NUMERIC_FIELDS:
                    raise ValidationError(f"$inc is not allowed for {field}.")
                if isinstance(amount, bool) or not isinstance(amount, (int, float)):
                    raise ValidationError(f"$inc value for {field} must be numeric.")
            spec["$inc"] = increments

        return spec

    def create(self, document: Mapping[str, Any]) -> bool:
        clean = self.validate_animal_document(document)
        try:
            result = self._ensure_collection().insert_one(clean)
            return bool(result.acknowledged and result.inserted_id is not None)
        except errors.PyMongoError as exc:
            raise RuntimeError(f"[MongoDB][CREATE] {exc}") from exc

    def read(
        self,
        query: Optional[Mapping[str, Any]] = None,
        projection: Optional[Mapping[str, int]] = None,
        limit: int = 0,
    ) -> List[Dict[str, Any]]:
        clean_query = self._require_mapping(query or {}, "query")
        if limit < 0:
            raise ValidationError("limit cannot be negative.")
        try:
            cursor = self._ensure_collection().find(clean_query, projection)
            if limit:
                cursor = cursor.limit(limit)
            return list(cursor)
        except errors.PyMongoError as exc:
            raise RuntimeError(f"[MongoDB][READ] {exc}") from exc

    def update(
        self,
        query: Mapping[str, Any],
        new_values: Mapping[str, Any],
        many: bool = False,
    ) -> int:
        clean_query = self._require_mapping(query, "query")
        self._require_nonempty_filter(clean_query, "update")
        update_spec = self._validate_update_spec(new_values)
        try:
            coll = self._ensure_collection()
            result = (
                coll.update_many(clean_query, update_spec)
                if many
                else coll.update_one(clean_query, update_spec)
            )
            return int(result.modified_count or 0)
        except errors.PyMongoError as exc:
            raise RuntimeError(f"[MongoDB][UPDATE] {exc}") from exc

    def delete(self, query: Mapping[str, Any], many: bool = False) -> int:
        clean_query = self._require_mapping(query, "query")
        self._require_nonempty_filter(clean_query, "delete")
        try:
            coll = self._ensure_collection()
            result = (
                coll.delete_many(clean_query)
                if many
                else coll.delete_one(clean_query)
            )
            return int(result.deleted_count or 0)
        except errors.PyMongoError as exc:
            raise RuntimeError(f"[MongoDB][DELETE] {exc}") from exc

    def ensure_indexes(self) -> List[str]:
        """Create/verify application indexes and return their names."""
        coll = self._ensure_collection()
        names: List[str] = []
        try:
            for name, keys in self.INDEX_SPECS:
                names.append(coll.create_index(list(keys), name=name))
            return names
        except errors.PyMongoError as exc:
            raise RuntimeError(f"[MongoDB][INDEX] {exc}") from exc

    def explain_query(self, query: Mapping[str, Any]) -> Dict[str, Any]:
        """Return MongoDB execution statistics for a find query."""
        clean_query = self._require_mapping(query, "query")
        command = {
            "explain": {
                "find": self._collection_name,
                "filter": clean_query,
            },
            "verbosity": "executionStats",
        }
        try:
            return self._ensure_collection().database.command(command)
        except errors.PyMongoError as exc:
            raise RuntimeError(f"[MongoDB][EXPLAIN] {exc}") from exc

    def close(self) -> None:
        if self._client is not None:
            self._client.close()
