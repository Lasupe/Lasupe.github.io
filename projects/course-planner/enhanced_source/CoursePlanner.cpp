// CS-499 Enhancement Two: AVL course planner and prerequisite validation.
// Original artifact: CS-300 Project Two (2025), Lasupe Xiong.
// C++17; no external dependencies.
#include <algorithm>
#include <cctype>
#include <fstream>
#include <iostream>
#include <memory>
#include <sstream>
#include <stdexcept>
#include <string>
#include <unordered_map>
#include <unordered_set>
#include <utility>
#include <vector>

struct Course {
    std::string courseNumber;
    std::string title;
    std::vector<std::string> prerequisites;
};

std::string trim(const std::string& s) {
    const auto begin = s.find_first_not_of(" \t\r\n");
    if (begin == std::string::npos) return "";
    const auto end = s.find_last_not_of(" \t\r\n");
    return s.substr(begin, end - begin + 1);
}

std::string normalizeId(std::string id) {
    id = trim(id);
    for (char& ch : id) ch = static_cast<char>(std::toupper(static_cast<unsigned char>(ch)));
    return id;
}

// Owns all nodes. Copying is disabled to prevent accidental duplicate ownership.
class AVLTree {
    struct Node {
        Course course;
        int height = 1;
        std::unique_ptr<Node> left, right;
        explicit Node(Course c) : course(std::move(c)) {}
    };
    std::unique_ptr<Node> root;
    std::size_t count = 0;
    static int height(const std::unique_ptr<Node>& node) { return node ? node->height : 0; }
    static void update(Node* node) {
        node->height = 1 + std::max(height(node->left), height(node->right));
    }
    static int balance(const std::unique_ptr<Node>& node) {
        return node ? height(node->left) - height(node->right) : 0;
    }
    static std::unique_ptr<Node> rotateRight(std::unique_ptr<Node> y) {
        auto x = std::move(y->left);
        y->left = std::move(x->right);
        update(y.get());
        x->right = std::move(y);
        update(x.get());
        return x;
    }
    static std::unique_ptr<Node> rotateLeft(std::unique_ptr<Node> x) {
        auto y = std::move(x->right);
        x->right = std::move(y->left);
        update(x.get());
        y->left = std::move(x);
        update(y.get());
        return y;
    }
    static std::unique_ptr<Node> insert(std::unique_ptr<Node> node, const Course& course, bool& added) {
        if (!node) { added = true; return std::make_unique<Node>(course); }
        if (course.courseNumber < node->course.courseNumber)
            node->left = insert(std::move(node->left), course, added);
        else if (course.courseNumber > node->course.courseNumber)
            node->right = insert(std::move(node->right), course, added);
        else return node; // Duplicate ID: retain the existing course.
        update(node.get());
        const int b = balance(node);
        if (b > 1) {
            if (balance(node->left) < 0) node->left = rotateLeft(std::move(node->left));
            return rotateRight(std::move(node));
        }
        if (b < -1) {
            if (balance(node->right) > 0) node->right = rotateRight(std::move(node->right));
            return rotateLeft(std::move(node));
        }
        return node;
    }
    static void inOrder(const Node* node, std::vector<Course>& out) {
        if (!node) return;
        inOrder(node->left.get(), out);
        out.push_back(node->course);
        inOrder(node->right.get(), out);
    }
    static bool valid(const Node* node, const std::string* low, const std::string* high, int& h) {
        if (!node) { h = 0; return true; }
        const auto& id = node->course.courseNumber;
        if ((low && id <= *low) || (high && id >= *high)) return false;
        int lh, rh;
        if (!valid(node->left.get(), low, &id, lh) || !valid(node->right.get(), &id, high, rh)) return false;
        h = 1 + std::max(lh, rh);
        return node->height == h && std::abs(lh - rh) <= 1;
    }
public:
    bool Insert(Course course) {
        course.courseNumber = normalizeId(course.courseNumber);
        if (course.courseNumber.empty() || trim(course.title).empty()) return false;
        bool added = false;
        root = insert(std::move(root), course, added);
        if (added) ++count;
        return added;
    }
    const Course* Search(const std::string& id) const {
        const std::string key = normalizeId(id);
        const Node* node = root.get();
        while (node) {
            if (key == node->course.courseNumber) return &node->course;
            node = key < node->course.courseNumber ? node->left.get() : node->right.get();
        }
        return nullptr;
    }
    std::vector<Course> InOrder() const {
        std::vector<Course> result;
        result.reserve(count);
        inOrder(root.get(), result);
        return result;
    }
    std::size_t Size() const { return count; }
    int Height() const { return height(root); }
    bool CheckInvariants() const { int h = 0; return valid(root.get(), nullptr, nullptr, h); }
};

struct LoadResult {
    AVLTree tree;
    std::vector<std::string> errors;
    bool opened = false;
};

// A simple comma-delimited course file (no quoted commas). Parse first, validate
// references after all records are read so forward references are accepted.
LoadResult LoadCourses(const std::string& filename) {
    LoadResult result;
    std::ifstream file(filename);
    if (!file) { result.errors.push_back("Could not open: " + filename); return result; }
    result.opened = true;
    std::string line;
    std::size_t lineNumber = 0;
    while (std::getline(file, line)) {
        ++lineNumber;
        if (trim(line).empty()) continue;
        std::stringstream ss(line);
        std::vector<std::string> tokens;
        std::string token;
        while (std::getline(ss, token, ',')) tokens.push_back(trim(token));
        if (!line.empty() && line.back() == ',') tokens.emplace_back("");
        if (tokens.size() < 2 || tokens[0].empty() || tokens[1].empty()) {
            result.errors.push_back("Line " + std::to_string(lineNumber) + ": missing course ID or title");
            continue;
        }
        Course c{normalizeId(tokens[0]), tokens[1], {}};
        bool malformed = false;
        std::unordered_set<std::string> seen;
        for (std::size_t i = 2; i < tokens.size(); ++i) {
            const std::string prereq = normalizeId(tokens[i]);
            if (prereq.empty() || !seen.insert(prereq).second) { malformed = true; break; }
            c.prerequisites.push_back(prereq);
        }
        if (malformed) {
            result.errors.push_back("Line " + std::to_string(lineNumber) + ": blank or repeated prerequisite");
            continue;
        }
        if (!result.tree.Insert(c))
            result.errors.push_back("Line " + std::to_string(lineNumber) + ": duplicate or invalid course " + c.courseNumber);
    }
    const auto courses = result.tree.InOrder();
    for (const auto& c : courses) {
        for (const auto& prereq : c.prerequisites) {
            if (!result.tree.Search(prereq))
                result.errors.push_back(c.courseNumber + ": missing prerequisite " + prereq);
            if (prereq == c.courseNumber)
                result.errors.push_back(c.courseNumber + ": cannot require itself");
        }
    }
    // DFS detects cycles in prerequisite relationships, including indirect cycles.
    std::unordered_map<std::string, int> state;
    std::vector<std::string> path;
    std::unordered_set<std::string> reported;
    auto visit = [&](auto&& self, const std::string& id) -> void {
        state[id] = 1;
        path.push_back(id);
        const Course* c = result.tree.Search(id);
        if (c) for (const auto& prereq : c->prerequisites) {
            if (!result.tree.Search(prereq)) continue;
            if (state[prereq] == 0) self(self, prereq);
            else if (state[prereq] == 1 && reported.insert(prereq).second) {
                std::string message = "Prerequisite cycle: ";
                auto start = std::find(path.begin(), path.end(), prereq);
                for (auto it = start; it != path.end(); ++it) message += *it + " -> ";
                result.errors.push_back(message + prereq);
            }
        }
        path.pop_back();
        state[id] = 2;
    };
    for (const auto& c : courses) if (state[c.courseNumber] == 0) visit(visit, c.courseNumber);
    return result;
}

#ifndef COURSE_PLANNER_TEST
int main(int argc, char** argv) {
    const std::string filename = argc > 1 ? argv[1] : "courses.csv";
    AVLTree tree;
    bool loaded = false;
    while (true) {
        std::cout << "\nWelcome to the enhanced course planner.\n"
                  << "1. Load Data Structure\n2. Print Course List\n"
                  << "3. Print Course\n9. Exit\nWhat would you like to do? ";
        std::string choice;
        if (!std::getline(std::cin, choice)) break;
        choice = trim(choice);
        if (choice == "1") {
            auto result = LoadCourses(filename);
            if (!result.opened) { std::cerr << result.errors.front() << '\n'; continue; }
            for (const auto& error : result.errors) std::cerr << "Validation: " << error << '\n';
            if (!result.errors.empty()) {
                std::cout << "Load rejected; previous course data preserved. Fix the file and retry.\n";
                continue;
            }
            tree = std::move(result.tree);
            loaded = true;
            std::cout << "Loaded " << tree.Size() << " courses. AVL height: " << tree.Height() << '\n';
        } else if (choice == "2") {
            if (!loaded) { std::cout << "Load data first.\n"; continue; }
            for (const auto& c : tree.InOrder()) std::cout << c.courseNumber << ", " << c.title << '\n';
        } else if (choice == "3") {
            if (!loaded) { std::cout << "Load data first.\n"; continue; }
            std::cout << "Enter course number: ";
            std::string id;
            if (!std::getline(std::cin, id)) break;
            const Course* c = tree.Search(id);
            if (!c) { std::cout << "Course not found.\n"; continue; }
            std::cout << c->courseNumber << ", " << c->title << "\nPrerequisites: ";
            if (c->prerequisites.empty()) std::cout << "None";
            for (std::size_t i = 0; i < c->prerequisites.size(); ++i)
                std::cout << (i ? ", " : "") << c->prerequisites[i];
            std::cout << '\n';
        } else if (choice == "9") {
            std::cout << "Thank you for using the course planner!\n";
            break;
        } else std::cout << "Invalid option.\n";
    }
}
#endif
