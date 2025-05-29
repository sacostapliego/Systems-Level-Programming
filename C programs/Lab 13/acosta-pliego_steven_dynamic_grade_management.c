#include <stdio.h>
#include <stdlib.h>
#include <string.h> // Required for strncpy
#include <ctype.h>  // Required for isdigit (though not strictly used in this refactor, good for robustness)

#ifdef __EMSCRIPTEN__
#include <emscripten.h>
#endif

#define SUBJECT_COUNT 5

//structure
typedef struct Student {
    int id;
    char name[50];
    float grades[SUBJECT_COUNT];
    float total;
    float average;
    struct Student *next; //pointer next to student
} Student;

// Global state for Emscripten
static Student *gs_head = NULL;
static int grades_active = 1;

#define OP_GS_MAIN_MENU 0
#define OP_GS_ADD_STUDENT 1
// OP_GS_DISPLAY_STUDENTS and OP_GS_CALC_STATS are handled directly from main menu choice

static int current_operation_gs = OP_GS_MAIN_MENU;
static int current_step_gs = 0; // 0:ID, 1:Name, 2-6:Grades
static Student temp_student_buffer;


// Forward declarations for internal use
void displayStudents_internal(Student *head_node);
void calculateClassStatistics_internal(Student *head_node);
void calculateTotalAndAverage(Student *student); // Keep this as is
void print_gs_main_menu();
void reset_to_gs_main_menu();
void finalize_add_student();


void calculateTotalAndAverage(Student *student) {
    //init total
    student->total = 0.0;
    for (int i = 0; i < SUBJECT_COUNT; i++) {
        student->total += student->grades[i];
    }
    //calculates the average from the loop above
    if (SUBJECT_COUNT > 0) { // Avoid division by zero
        student->average = student->total / SUBJECT_COUNT;
    } else {
        student->average = 0.0;
    }
}

void displayStudents_internal(Student *head_node) {
    //base case
    if (head_node == NULL) {
        printf("No students to display.\n");
        fflush(stdout);
        return;
    }
    //presentes student informatino
    printf("\n=== Student Information ===\n");
     //table like structure
    printf("%-5s %-20s", "ID", "Name");
    for (int i = 0; i < SUBJECT_COUNT; i++) {
        printf(" %-7s", "Grade");
    }
    printf(" %-10s %-10s\n", "Total", "Average");
    
    Student *current = head_node;
    while (current != NULL) {
        printf("%-5d %-20s ", current->id, current->name);
        for (int i = 0; i < SUBJECT_COUNT; i++) {
            printf(" %-7.2f", current->grades[i]);
        }
        printf(" %-10.2f %-10.2f\n", current->total, current->average);
        current = current->next;
    }
    printf("===========================\n");
    fflush(stdout);
}

void calculateClassStatistics_internal(Student *head_node) {
    if (head_node == NULL) {
        printf("No students to calculate statistics for.\n");
        fflush(stdout);
        return;
    }

    int count = 0;
    float total_class_average = 0;
    float min_average = -1.0, max_average = -1.0;

    Student *current = head_node;
    while (current != NULL) {
        total_class_average += current->average;
        if (min_average == -1.0 || current->average < min_average) {
            min_average = current->average;
        }
        if (max_average == -1.0 || current->average > max_average) {
            max_average = current->average;
        }
        count++;
        current = current->next;
    }

    if (count > 0) {
        printf("\n=== Class Statistics ===\n");
        printf("Total Students: %d\n", count);
        printf("Class Average Grade: %.2f\n", total_class_average / count);
        printf("Highest Average Grade: %.2f\n", max_average);
        printf("Lowest Average Grade: %.2f\n", min_average);
        printf("========================\n");
    } else {
        printf("No student data available for statistics.\n");
    }
    fflush(stdout);
}

void print_gs_main_menu() {
    printf("\n=== Dynamic Student Grade Management System ===\n");
    printf("1. Add Student\n");
    printf("2. Display All Students\n");
    printf("3. Calculate Class Statistics\n");
    printf("4. Exit\n");
    printf("Enter your choice:\n");
    fflush(stdout);
}

void reset_to_gs_main_menu() {
    current_operation_gs = OP_GS_MAIN_MENU;
    current_step_gs = 0;
    if (grades_active) {
        print_gs_main_menu();
    }
}

void finalize_add_student() {
    Student *newStudent = (Student *)malloc(sizeof(Student));
    if (newStudent == NULL) {
        printf("Memory allocation failed!\n");
        fflush(stdout);
        return;
    }
    *newStudent = temp_student_buffer; // Copy data from buffer

    calculateTotalAndAverage(newStudent);

    newStudent->next = gs_head;
    gs_head = newStudent;

    printf("Student '%s' data added successfully!\n", newStudent->name);
    fflush(stdout);
}

void handle_add_student_step(const char* input) {
    switch (current_step_gs) {
        case 0: // Expecting ID
            temp_student_buffer.id = atoi(input);
            current_step_gs++;
            printf("Enter student Name for ID %d:\n", temp_student_buffer.id);
            break;
        case 1: // Expecting Name
            strncpy(temp_student_buffer.name, input, 49);
            temp_student_buffer.name[49] = '\0'; // Ensure null termination
            current_step_gs++;
            printf("Enter grade for subject 1 for %s:\n", temp_student_buffer.name);
            break;
        // Cases 2 through 6 for grades (SUBJECT_COUNT = 5)
        case 2: case 3: case 4: case 5: case 6: 
            temp_student_buffer.grades[current_step_gs - 2] = atof(input);
            if (current_step_gs - 2 < SUBJECT_COUNT - 1) {
                current_step_gs++;
                printf("Enter grade for subject %d for %s:\n", current_step_gs - 1, temp_student_buffer.name);
            } else {
                // All grades entered
                finalize_add_student();
                reset_to_gs_main_menu();
            }
            break;
        default:
            printf("Error in add student step.\n");
            reset_to_gs_main_menu();
            break;
    }
    fflush(stdout);
}


#ifdef __EMSCRIPTEN__
EMSCRIPTEN_KEEPALIVE
#endif
void init_grades() {
    // Free existing list if any (e.g., on re-init)
    Student *current = gs_head;
    Student *next_node;
    while (current != NULL) {
        next_node = current->next;
        free(current);
        current = next_node;
    }
    gs_head = NULL;

    grades_active = 1;
    current_operation_gs = OP_GS_MAIN_MENU;
    current_step_gs = 0;
    print_gs_main_menu();
}

#ifdef __EMSCRIPTEN__
EMSCRIPTEN_KEEPALIVE
#endif
void process_grades_input(const char* input_str) {
    if (!grades_active) {
        printf("Grade system session has ended. Please re-initialize.\n");
        fflush(stdout);
        return;
    }

    if (current_operation_gs == OP_GS_MAIN_MENU) {
        int choice = atoi(input_str);
        switch (choice) {
            case 1: // Add Student
                current_operation_gs = OP_GS_ADD_STUDENT;
                current_step_gs = 0;
                // Clear buffer for new student
                memset(&temp_student_buffer, 0, sizeof(Student));
                printf("Enter student ID:\n");
                break;
            case 2: // Display All Students
                displayStudents_internal(gs_head);
                reset_to_gs_main_menu(); // Re-prompt main menu
                break;
            case 3: // Calculate Class Statistics
                calculateClassStatistics_internal(gs_head);
                reset_to_gs_main_menu(); // Re-prompt main menu
                break;
            case 4: // Exit
                printf("Exiting the program. Goodbye!\n");
                // Free memory
                Student *current = gs_head;
                Student *next_node;
                while (current != NULL) {
                    next_node = current->next;
                    free(current);
                    current = next_node;
                }
                gs_head = NULL;
                grades_active = 0;
                break;
            default:
                printf("Invalid choice. Please try again.\n");
                reset_to_gs_main_menu(); // Re-prompt main menu
                break;
        }
    } else if (current_operation_gs == OP_GS_ADD_STUDENT) {
        handle_add_student_step(input_str);
    }
    fflush(stdout);
}


// Original main for local testing
#ifndef __EMSCRIPTEN__
// Original functions that used scanf, for reference or local testing setup
void original_addStudent(Student **head_param) { // Renamed to avoid conflict
    Student *newStudent = (Student *)malloc(sizeof(Student));   //memory allocation
    if (newStudent == NULL) {
        printf("Memory allocation failed!\n");
        return;
    }
    printf("\nEnter student details:\n");
    printf("ID: ");
    scanf("%d", &newStudent->id);
    printf("Name: ");
    scanf(" %49[^\n]", newStudent->name); // Read up to 49 chars to prevent overflow
    for (int i = 0; i < SUBJECT_COUNT; i++) {
        printf("Grade for subject %d: ", i + 1);
        scanf("%f", &newStudent->grades[i]);
    }
    calculateTotalAndAverage(newStudent);
    newStudent->next = *head_param;
    *head_param = newStudent;
    printf("Student data added successfully!\n");
}

int main() {
    // For local testing, you'd call init_grades and then simulate inputs
    // or use the original scanf-based functions.
    // This example shows how you might test the Emscripten-style functions locally.
    init_grades(); 

    char buffer[100];
    while (grades_active) {
        if (fgets(buffer, sizeof(buffer), stdin) != NULL) {
            buffer[strcspn(buffer, "\n")] = 0; // Remove newline
            if (strlen(buffer) > 0 || current_operation_gs == OP_GS_MAIN_MENU) {
                 process_grades_input(buffer);
            } else if (current_operation_gs != OP_GS_MAIN_MENU) {
                 printf("Please provide input for the current step.\n");
                 fflush(stdout);
            }
        } else {
            break; // EOF
        }
    }
    printf("Local test finished.\n");
    return 0;
}
#endif