#include <iostream>
#include <fstream>
#include <sstream>
#include <vector>
#include <algorithm>
#include <limits>

using namespace std;

// Structure to hold course information
struct Course {
    string courseNumber;
    string title;
    vector<string> prerequisites;
};

// Node structure for BST
struct Node {
    Course course;
    Node* left;
    Node* right;

    Node(Course aCourse) : course(aCourse), left(nullptr), right(nullptr) {}
};

// Binary Search Tree class
class BinarySearchTree {
private:
    Node* root;
    void addNode(Node*& node, Course course);
    void inOrder(Node* node);
    Node* search(Node* node, string courseNumber);
    void destroyTree(Node* node);

public:
    BinarySearchTree();
    ~BinarySearchTree();
    void Insert(Course course);
    void PrintInOrder();
    Course Search(string courseNumber);
};

BinarySearchTree::BinarySearchTree() {
    root = nullptr;
}

BinarySearchTree::~BinarySearchTree() {
    destroyTree(root);
}

void BinarySearchTree::destroyTree(Node* node) {
    if (node) {
        destroyTree(node->left);
        destroyTree(node->right);
        delete node;
    }
}

void BinarySearchTree::addNode(Node*& node, Course course) {
    if (!node) {
        node = new Node(course);
    }
    else if (course.courseNumber < node->course.courseNumber) {
        addNode(node->left, course);
    }
    else {
        addNode(node->right, course);
    }
}

void BinarySearchTree::Insert(Course course) {
    addNode(root, course);
}

void BinarySearchTree::inOrder(Node* node) {
    if (node) {
        inOrder(node->left);
        cout << node->course.courseNumber << ", " << node->course.title << endl;
        inOrder(node->right);
    }
}

void BinarySearchTree::PrintInOrder() {
    inOrder(root);
}

Node* BinarySearchTree::search(Node* node, string courseNumber) {
    transform(courseNumber.begin(), courseNumber.end(), courseNumber.begin(), ::toupper);
    if (!node || node->course.courseNumber == courseNumber)
        return node;
    if (courseNumber < node->course.courseNumber)
        return search(node->left, courseNumber);
    return search(node->right, courseNumber);
}

Course BinarySearchTree::Search(string courseNumber) {
    Node* result = search(root, courseNumber);
    if (result)
        return result->course;
    return { "", "", {} };
}

// Function to load courses from a hardcoded filename
void LoadCourses(BinarySearchTree& bst) {
    string filename = "courses.csv"; // Hardcoded filename
    ifstream file(filename);

    if (!file.is_open()) {
        cout << "Error: Could not open file " << filename << endl;
        return;
    }

    cout << "File opened successfully: " << filename << endl;

    string line;
    while (getline(file, line)) {
        vector<string> tokens;
        stringstream ss(line);
        string token;

        while (getline(ss, token, ',')) {
            tokens.push_back(token);
        }

        if (tokens.size() < 2) {
            cout << "Error: Invalid data format in line: " << line << endl;
            continue;
        }

        string courseNum = tokens[0];
        string courseTitle = tokens[1];
        vector<string> prereqs(tokens.begin() + 2, tokens.end());

        transform(courseNum.begin(), courseNum.end(), courseNum.begin(), ::toupper);

        Course course = { courseNum, courseTitle, prereqs };
        bst.Insert(course);
    }
    file.close();
}

// Main program menu
int main() {
    BinarySearchTree bst;
    bool dataLoaded = false;
    int choice;

    while (true) {
        cout << "\nWelcome to the course planner." << endl;
        cout << "1. Load Data Structure." << endl;
        cout << "2. Print Course List." << endl;
        cout << "3. Print Course." << endl;
        cout << "9. Exit" << endl;
        cout << "What would you like to do? ";
        cin >> choice;

        if (cin.fail()) {
            cin.clear(); // Clear error flags
            cin.ignore(numeric_limits<streamsize>::max(), '\n'); // Discard invalid input
            cout << "Invalid input. Please enter a number." << endl;
            continue;
        }

        if (choice == 1) {
            LoadCourses(bst);
            dataLoaded = true;
            cout << "Courses loaded successfully.\n";
        }
        else if (choice == 2) {
            if (dataLoaded) {
                cout << "Here is a sample schedule:" << endl;
                bst.PrintInOrder();
            }
            else {
                cout << "Error: Load data first." << endl;
            }
        }
        else if (choice == 3) {
            if (dataLoaded) {
                string courseNumber;
                cout << "What course do you want to know about? ";
                cin >> courseNumber;
                transform(courseNumber.begin(), courseNumber.end(), courseNumber.begin(), ::toupper);
                Course course = bst.Search(courseNumber);
                if (!course.courseNumber.empty()) {
                    cout << course.courseNumber << ", " << course.title << endl;
                    cout << "Prerequisites: ";
                    for (size_t i = 0; i < course.prerequisites.size(); ++i) {
                        cout << course.prerequisites[i];
                        if (i < course.prerequisites.size() - 1) {
                            cout << ", ";
                        }
                    }
                    cout << endl;
                }
                else {
                    cout << "Course not found." << endl;
                }
            }
            else {
                cout << "Error: Load data first." << endl;
            }
        }
        else if (choice == 9) {
            cout << "Thank you for using the course planner!" << endl;
            break;
        }
        else {
            cout << choice << " is not a valid option." << endl;
        }
    }
    return 0;
}
