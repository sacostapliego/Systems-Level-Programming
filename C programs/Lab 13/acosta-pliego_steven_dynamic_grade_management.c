#include <stdio.h>
#include <stdlib.h>

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

//functions used in program
void addStudent(Student **head);
void calculateTotalAndAverage(Student *student);
void displayStudents(Student *head);
//new function, calculates class statistics
void calculateClassStatistics(Student *head);

int main() {
    Student *head = NULL;  //head pointed to the linked list
    int choice;

    do {
        //prints greeting message + user options
        printf("\n=== Dynamic Student Grade Management System ===\n");
        printf("1. Add Student\n");
        printf("2. Display All Students\n");
        //new option
        printf("3. Calculate Class Statistics\n");
        printf("4. Exit\n");
        printf("Enter your choice: ");
        scanf("%d", &choice);

        //executes a function based on the user choice
        switch (choice) {
            case 1:
                addStudent(&head);
                break;
            case 2:
                displayStudents(head);
                break;
            case 3:
                calculateClassStatistics(head);
                break;
            case 4:
                printf("Exiting the program. Goodbye!\n");
                break;
            default:
                printf("Invalid choice. Please try again.\n");
        }
    //loops, until '4' is picked
    } while (choice != 4);

    return 0;
}

//add students to linked list
void addStudent(Student **head) {
    Student *newStudent = (Student *)malloc(sizeof(Student));   //memory allocation
    //base
    if (newStudent == NULL) {
        printf("Memory allocation failed!\n");
        return;
    }

    // Get student details from the user
    printf("\nEnter student details:\n");
    printf("ID: ");
    scanf("%d", &newStudent->id);   //id:numer, structure member

    printf("Name: ");
    scanf(" %s", &newStudent->name);  //name:string, structure member

    //loops until subject count
    for (int i = 0; i < SUBJECT_COUNT; i++) {
        printf("Grade for subject %d: ", i + 1);
        scanf("%f", &newStudent->grades[i]);    //scans for floats, adds using strcture memeber grades
    }  

    //calcualte function
    calculateTotalAndAverage(newStudent);

    //new student at the beginning of the list
    newStudent->next = *head;
    *head = newStudent;

    printf("Student data added successfully!\n");
}

void calculateTotalAndAverage(Student *student) {
    //init total
    student->total = 0.0;
    for (int i = 0; i < SUBJECT_COUNT; i++) {
        student->total += student->grades[i];
    }
    //calculates the average from the loop above
    student->average = student->total / SUBJECT_COUNT;
}

//function display all student information
void displayStudents(Student *head) {
    //base case
    if (head == NULL) {
        printf("No students to display.\n");
        return;
    }
    //presentes student informatino
    printf("\n=== Student Information ===\n");
     //table like structure
    printf("%-5s %-20s %-10s %-10s %-10s %-10s %-10s %-10s\n",
           "ID", "Name", "Grade1", "Grade2", "Grade3", "Grade4", "Grade5", "Average");
    
    //call structure
    Student *current = head;
    while (current != NULL) {
        //prints the current student id and name
        printf("%-5d %-20s ", current->id, current->name);
        for (int i = 0; i < SUBJECT_COUNT; i++) {
            //loop for current grades spaced out -10
            printf("%-10.2f ", current->grades[i]);
        }
        //loop for average spaced out -10
        printf("%-10.2f\n", current->average);
        //next student
        current = current->next;
    }
}

//calculatte the class statisitics
void calculateClassStatistics(Student *head) {
    //base case
    if (head == NULL) {
        printf("No students available to calculate statistics.\n");
        return;
    }
    
    //varibles to hold information for later
    float totalAverage = 0.0;
    float highestAvg = -1.0;    //higher will always be higher than -1
    float lowestAvg = 101.0; //lower will always be lower than this 101
    Student *highestStudent = NULL; //pointers
    Student *lowestStudent = NULL;  //pointers
    int studentCount = 0;

    Student *current = head;
    while (current != NULL) {   //loops for each student
        totalAverage += current->average;   //add the student average to the total sum
        //check if current student has the highest avg
        if (current->average > highestAvg) {
            highestAvg = current->average;
            highestStudent = current;
        }
        //check if current student has the lowest average
        if (current->average < lowestAvg) {
            lowestAvg = current->average;
            lowestStudent = current;
        }
        //increments
        studentCount++;
        current = current->next;
    }
    //prints if there are more than none
    if (studentCount > 0) {
        //prints the updated values
        printf("\nClass Average: %.2f\n", totalAverage / studentCount);
        printf("Highest Average: %.2f, Student: %s\n", highestAvg, highestStudent->name);
        printf("Lowest Average: %.2f, Student: %s\n", lowestAvg, lowestStudent->name);
    }
}
