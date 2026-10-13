CS-499 Milestone Three — Algorithms and Data Structures
Artifact: CS-300 Project Two Course Planner (original created in 2025)
Contents
`original_source/ProjectTwo.cpp` — unchanged uploaded original BST implementation.
`enhanced_source/CoursePlanner.cpp` — enhanced C++17 AVL course planner.
`enhanced_source/tests.cpp` — automated assertion tests for balancing and input validation.
`test_data/courses.csv` — newly created illustrative test data (not the original CS-300 CSV, which was unavailable).
`test_data/invalid_courses.csv` — newly created negative-test data.
Build and run (Windows with g++, from this directory)
```
g++ -std=c++17 -Wall -Wextra -Wpedantic enhanced_source/CoursePlanner.cpp -o CoursePlanner.exe
.\CoursePlanner.exe test_data/courses.csv
```
Select 1 to load, 2 to print sorted courses, 3 to search, and 9 to exit. The optional filename argument defaults to `courses.csv`.
Automated tests
```
g++ -std=c++17 -Wall -Wextra -Wpedantic enhanced_source/tests.cpp -o tests.exe
.\tests.exe
```
The tests require running from the project directory so relative paths resolve.
Enhancement summary
AVL insertion with LL, RR, LR and RL rotations, tracked node heights and checked tree invariants.
Worst-case O(log n) insertion/search for unique course IDs; in-order O(n) sorted listing.
Case-insensitive IDs, duplicate detection, whitespace trimming, safe node ownership via `std::unique_ptr`.
Two-phase loading: read all courses, then check missing prerequisites, self-dependencies and cycles using DFS.
Invalid files are rejected as a whole; the interactive program preserves the previously loaded valid tree.
Clear error messages and optional command-line CSV path.
CSV format: `COURSE_ID,Title[,PREREQUISITE_ID...]`; fields are comma-delimited without quoted commas. The program rejects blank or repeated prerequisite fields. File errors and validation errors do not replace the existing valid catalog.
Design trade-off: AVL nodes store an extra height integer and rotations add insertion work, in exchange for a logarithmic worst-case search bound. Parsing uses a deliberately simple CSV dialect consistent with the original assignment; quoted fields containing commas are not supported.
