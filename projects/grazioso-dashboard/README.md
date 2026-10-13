CS 499 Milestone Four - Database Enhancement
This folder begins the enhanced database layer for the Grazioso Salvare artifact.
First enhancement
MongoDB credentials come from environment variables.
Authentication fails closed; there is no automatic no-auth fallback.
Create/update data is validated.
Update/delete require non-empty filters.
Update operators are allowlisted.
Rescue-profile indexes can be created from the application.
`explain_query()` exposes MongoDB `executionStats` for performance evidence.
The original uploaded `crud.py` and dashboard notebook are preserved under
`original_source/`.
