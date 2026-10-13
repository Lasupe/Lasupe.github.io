"""Report MongoDB execution statistics for a rescue-profile query.

Run after MongoDB is populated and environment variables are configured.
Credentials are loaded from environment variables and are never stored here.
"""

from crud import MongoConfig, CRUD


QUERY = {
    "animal_type": "Dog",
    "age_upon_outcome_in_weeks": {"$lte": 104},
    "breed": {
        "$in": [
            "Labrador Retriever",
            "Labrador Retriever Mix",
            "Chesapeake Bay Retriever",
            "Chesapeake Bay Retriever Mix",
            "Newfoundland",
            "Newfoundland Mix",
        ]
    },
}


def find_index_stage(stage):
    """Recursively locate an IXSCAN stage in an explain plan."""
    if not isinstance(stage, dict):
        return None

    if stage.get("stage") == "IXSCAN":
        return stage

    for value in stage.values():
        if isinstance(value, dict):
            result = find_index_stage(value)
            if result:
                return result
        elif isinstance(value, list):
            for item in value:
                result = find_index_stage(item)
                if result:
                    return result

    return None


def summarize(explain):
    """Extract useful execution details from MongoDB explain output."""
    stats = explain.get("executionStats", {})
    winning_plan = explain.get("queryPlanner", {}).get("winningPlan", {})
    index_stage = find_index_stage(winning_plan)

    return {
        "scan_type": index_stage.get("stage") if index_stage else "COLLSCAN",
        "index_used": index_stage.get("indexName") if index_stage else "None",
        "documents_returned": stats.get("nReturned"),
        "keys_examined": stats.get("totalKeysExamined"),
        "documents_examined": stats.get("totalDocsExamined"),
        "execution_time_ms": stats.get("executionTimeMillis"),
    }


if __name__ == "__main__":
    db = CRUD(
        MongoConfig.from_env(require_credentials=True),
        db_name="aac",
        collection_name="animals",
    )

    try:
        indexes = db.ensure_indexes()
        report = summarize(db.explain_query(QUERY))

        print("MongoDB Query Performance Report")
        print("--------------------------------")
        print("Indexes available:", ", ".join(indexes))
        print("Scan type:", report["scan_type"])
        print("Index used:", report["index_used"])
        print("Documents returned:", report["documents_returned"])
        print("Keys examined:", report["keys_examined"])
        print("Documents examined:", report["documents_examined"])
        print("Execution time:", report["execution_time_ms"], "ms")
    finally:
        db.close()