//Description: Inventory program, adds or removes items. Updates prices and quanitity. Loops until user quits

#include <stdio.h>
#include <stdlib.h>
#include <string.h>

// Define the Product structure
typedef struct {
    char name[50];     //name of product, <50 characters
    int quantity;      //quantity = integer
    float price;       //price = float
    int hasDimensions; //0: description provided, 1: dimensions provided
    union {
        struct {
            int length, width, height; //structure and integers for dimensions
        } dimensions;
        char description[100];         // description of product, <100 characters
    } details;  //union for dimensions or desctipion
} Product;  //product structure

//node structure for linked list
typedef struct Node {
    Product product;
    struct Node* next;  //pointer
} Node;

Node* head = NULL;  //global pointer

//Function to create new product
Node* createProduct() {
    //allocate memory for new product node
    Node* newNode = (Node*)malloc(sizeof(Node));
    if (!newNode) {
        printf("Memory allocation failed.\n");
        return NULL;
    }

    //user inputs and stores it
    printf("Enter product name: ");
    scanf(" %[^\n]", newNode->product.name);
    printf("Enter quantity: ");
    scanf("%d", &newNode->product.quantity);
    printf("Enter price: ");
    scanf("%f", &newNode->product.price);

    //whether or not the product needs dimensions or description
    printf("Does this product have dimensions (0 - No, 1 - Yes): ");
    scanf("%d", &newNode->product.hasDimensions);
    if (newNode->product.hasDimensions) {
        //if it does, user enters dimesnions and stores it
        printf("Enter length, width, and height: ");
        scanf("%d %d %d", &newNode->product.details.dimensions.length,
              &newNode->product.details.dimensions.width,
              &newNode->product.details.dimensions.height);
    } else {
        //if not than a description of the product is requried by the user and stored.
        printf("Enter product description: ");
        scanf(" %[^\n]", newNode->product.details.description);
    }

    //set next pointer of the newnode to null
    newNode->next = NULL;
    return newNode;
}

//Function to add a new product
void addProduct() {
    //call create product function
    Node* newNode = createProduct();
    if (!newNode) return;
    //inset to beginning of list
    newNode->next = head;
    head = newNode;
    printf("Product added successfully!\n");
}

//Function to display all the products
void displayProducts() {
    //base case
    if (!head) {
        printf("Cannot display any products.\n");
        return;
    }
    //tranverse the lsit starting from the head
    Node* temp = head;
    printf("\nName                Quantity    Price    Details\n");
    while (temp) {
        //printer name, quanity, and price with the ui of a table
        printf("%-20s%-12d%-10.2f", temp->product.name, temp->product.quantity, temp->product.price);
        //printes either dimension of description based on the flag
        if (temp->product.hasDimensions) {
            printf("%dx%dx%d\n",
                   temp->product.details.dimensions.length,
                   temp->product.details.dimensions.width,
                   temp->product.details.dimensions.height);
        } else {
            printf("%s\n", temp->product.details.description);
        }
        //next product on the list
        temp = temp->next;
    }
}

//Function to update the product's quantity
void updateQuantity() {
    char name[50];
    int newQuantity;

    //user enters name
    printf("Enter product name to update quantity: ");
    scanf(" %[^\n]", name);

    Node* temp = head;
    //go through list...
    while (temp) {
        //if product name is found...
        if (strcmp(temp->product.name, name) == 0) {
            //ask user for new quantity
            printf("Enter new quantity: ");
            scanf("%d", &newQuantity);
            //update the product new quantity
            temp->product.quantity = newQuantity;
            printf("Product quantity updated successfully!\n");
            return;
        }
        temp = temp->next;
    }
    //if not print error message
    printf("Product not found.\n");
}

//Function to update a product's price
void updatePrice() {
    char name[50];
    float newPrice;
    
    //user enters name
    printf("Enter product name to update price: ");
    scanf(" %[^\n]", name);

    Node* temp = head;
    //go through list
    while (temp) {
        //if product name is found...
        if (strcmp(temp->product.name, name) == 0) {
            //enter new price
            printf("Enter new price: ");
            scanf("%f", &newPrice);
            //update product new price
            temp->product.price = newPrice;
            printf("Product price updated successfully!\n");
            return;
        }
        temp = temp->next;
    }
    //print error message
    printf("Product not found.\n");
}

//Function to delete a product
void deleteProduct() {
    char name[50];

    //user enters name
    printf("Enter product name to delete: ");
    scanf(" %[^\n]", name);

    Node *temp = head, *prev = NULL;
    //go through list
    while (temp) {
        //if product name is found
        if (strcmp(temp->product.name, name) == 0) {
            //if prev is not null, set the next poniter to the prev to skip temp, point to the node after
            if (prev) 
                prev->next = temp->next;
            //if prev is null, update head to point to the next node
            else 
                head = temp->next;
            //free memory
            free(temp);
            printf("Product deleted successfully!\n");
            return;
        }
        prev = temp;
        temp = temp->next;
    }
    printf("Product not found.\n");
}

//main function
int main() {
    int choice;
    do {
        //display the options
        printf("\nInventory Management System\n");
        printf("1. Add product\n");
        printf("2. Display products\n");
        printf("3. Update product quantity\n");
        printf("4. Update product price\n");
        printf("5. Delete product\n");
        printf("6. Exit\n");
        printf("Enter your choice: ");
        scanf("%d", &choice);
        //execute function based choice
        switch (choice) {
            case 1: addProduct(); break;
            case 2: displayProducts(); break;
            case 3: updateQuantity(); break;
            case 4: updatePrice(); break;
            case 5: deleteProduct(); break;
            //exit when user enters 6
            case 6: printf("Exiting program.\n"); break;
            //if user enters something else
            default: printf("Invalid choice.\n");
        }
    } while (choice != 6);

    //free allocated memory and exit program
    while (head) {
        Node* temp = head;
        head = head->next;
        free(temp);
    }
    return 0;
}
