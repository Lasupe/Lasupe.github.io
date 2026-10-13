#define COURSE_PLANNER_TEST
#include "CoursePlanner.cpp"
#include <cassert>
#include <cmath>
#include <iostream>

int main() {
    // Exercise all four AVL rotation patterns with sorted and mixed insertions.
    for (const std::vector<std::string>& order : {
             std::vector<std::string>{"C", "B", "A"}, {"A", "B", "C"},
             {"C", "A", "B"}, {"A", "C", "B"}}) {
        AVLTree tree;
        for (const auto& id : order) assert(tree.Insert({id, "Title", {}}));
        assert(tree.CheckInvariants() && tree.Size() == 3 && tree.Height() == 2);
        assert(tree.Search("b") && tree.Search("B") && !tree.Search("X"));
        assert(!tree.Insert({"B", "Duplicate", {}}));
        assert(tree.Search("B")->title == "Title");
    }
    std::cout << "PASS: all AVL rotations, lookup normalization, duplicates\n";
    AVLTree sorted;
    for (int i = 0; i < 1000; ++i) {
        const auto id = "CS" + std::to_string(1000 + i);
        assert(sorted.Insert({id, "Course", {}}));
    }
    assert(sorted.CheckInvariants() && sorted.Size() == 1000);
    assert(sorted.Height() <= 11); // AVL upper bound for 1000 nodes.
    auto courses = sorted.InOrder();
    assert(courses.size() == 1000);
    for (std::size_t i = 1; i < courses.size(); ++i)
        assert(courses[i-1].courseNumber < courses[i].courseNumber);
    std::cout << "PASS: 1000 sorted insertions, AVL height, in-order listing\n";
    auto valid = LoadCourses("test_data/courses.csv");
    assert(valid.opened && valid.errors.empty() && valid.tree.Size() == 6);
    assert(valid.tree.Search("cs301")->prerequisites.size() == 2);
    assert(valid.tree.CheckInvariants());
    std::cout << "PASS: valid CSV, forward references, prerequisites\n";
    auto invalid = LoadCourses("test_data/invalid_courses.csv");
    assert(invalid.opened && invalid.errors.size() >= 4);
    bool missing = false, duplicate = false, cycle = false, self = false;
    for (const auto& error : invalid.errors) {
        missing |= error.find("missing prerequisite") != std::string::npos;
        duplicate |= error.find("duplicate") != std::string::npos;
        cycle |= error.find("cycle") != std::string::npos;
        self |= error.find("cannot require itself") != std::string::npos;
    }
    assert(missing && duplicate && cycle && self);
    std::cout << "PASS: missing prerequisites, duplicates, cycles, self-reference\n";
    auto absent = LoadCourses("test_data/does_not_exist.csv");
    assert(!absent.opened && !absent.errors.empty());
    std::cout << "PASS: missing file\nALL TESTS PASSED\n";
}
