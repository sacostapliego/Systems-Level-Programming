// Description: Inventory program, adds or removes items. Updates prices and quantity.
// Refactored for single-input processing in Emscripten.

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <ctype.h> // For isdigit

#ifdef __EMSCRIPTEN__
#include <emscripten.h>
#endif

// Define the Product structure
typedef struct {
    char name[50];
    int quantity;
    float price;
    int hasDimensions; // 0: description provided, 1: dimensions provided
    union {
        struct {
            int length, width, height;
        } dimensions;
        char description[100];
    } details;
} Product;

// Node structure for linked list
typedef struct Node {
    Product product;
    struct Node* next;
} Node;

Node* head = NULL; // Global pointer for the linked list

// --- State Management for Emscripten Interface ---
static int inventory_active = 1; // 1 if active, 0 if user exited

// Operations
#define OP_MAIN_MENU 0
#define OP_ADD_PRODUCT 1
#define OP_UPDATE_QUANTITY 2
#define OP_UPDATE_PRICE 3
#define OP_DELETE_PRODUCT 4

static int current_operation = OP_MAIN_MENU;
static int current_step = 0;
static Product temp_product_buffer; // Buffer for adding/updating products
static char name_buffer[50];       // Buffer for name lookups (update/delete)

// --- Helper Functions ---

void print_main_menu() {
    printf("\nInventory Management System\n");
    printf("1. Add product\n");
    printf("2. Display products\n");
    printf("3. Update product quantity\n");
    printf("4. Update product price\n");
    printf("5. Delete product\n");
    printf("6. Exit\n");
    printf("Enter your choice:\n");
    fflush(stdout);
}

void reset_to_main_menu() {
    current_operation = OP_MAIN_MENU;
    current_step = 0;
    if (inventory_active) {
        print_main_menu();
    }
}

// --- Core Logic Functions (modified or new) ---

void displayProducts_internal() { // Renamed to avoid conflict if we export original
    if (!head) {
        printf("Cannot display any products. Inventory is empty.\n");
        fflush(stdout);
        return;
    }
    Node* temp = head;
    printf("\n--- Current Inventory ---\n");
    printf("Name                Quantity    Price       Details\n");
    printf("----------------------------------------------------------\n");
    while (temp) {
        printf("%-20s%-12d%-10.2f", temp->product.name, temp->product.quantity, temp->product.price);
        if (temp->product.hasDimensions) {
            printf("%dx%dx%d\n",
                   temp->product.details.dimensions.length,
                   temp->product.details.dimensions.width,
                   temp->product.details.dimensions.height);
        } else {
            printf("%s\n", temp->product.details.description);
        }
        temp = temp->next;
    }
    printf("----------------------------------------------------------\n");
    fflush(stdout);
}

void finalize_add_product() {
    Node* newNode = (Node*)malloc(sizeof(Node));
    if (!newNode) {
        printf("Memory allocation failed for new product.\n");
        fflush(stdout);
        return;
    }
    newNode->product = temp_product_buffer; // Copy from buffer
    newNode->next = head;
    head = newNode;
    printf("Product '%s' added successfully!\n", temp_product_buffer.name);
    fflush(stdout);
}

void handle_add_product_step(const char* input) {
    switch (current_step) {
        case 0: // Expecting product name
            strncpy(temp_product_buffer.name, input, 49);
            temp_product_buffer.name[49] = '\0';
            current_step++;
            printf("Enter quantity for '%s': \n", temp_product_buffer.name);
            break;
        case 1: // Expecting quantity
            temp_product_buffer.quantity = atoi(input);
            current_step++;
            printf("Enter price for '%s': \n", temp_product_buffer.name);
            break;
        case 2: // Expecting price
            temp_product_buffer.price = atof(input);
            current_step++;
            printf("Does '%s' have dimensions (0 - No, 1 - Yes): \n", temp_product_buffer.name);
            break;
        case 3: // Expecting hasDimensions
            temp_product_buffer.hasDimensions = atoi(input);
            if (temp_product_buffer.hasDimensions != 0 && temp_product_buffer.hasDimensions != 1) {
                 printf("Invalid choice for dimensions. Assuming No (0).\n");
                 temp_product_buffer.hasDimensions = 0;
            }
            if (temp_product_buffer.hasDimensions) {
                current_step++; // Move to step 4 for length
                printf("Enter length for '%s': \n", temp_product_buffer.name);
            } else {
                current_step = 7; // Skip to step 7 for description
                printf("Enter product description for '%s': \n", temp_product_buffer.name);
            }
            break;
        case 4: // Expecting length
            temp_product_buffer.details.dimensions.length = atoi(input);
            current_step++;
            printf("Enter width for '%s': \n", temp_product_buffer.name);
            break;
        case 5: // Expecting width
            temp_product_buffer.details.dimensions.width = atoi(input);
            current_step++;
            printf("Enter height for '%s': \n", temp_product_buffer.name);
            break;
        case 6: // Expecting height
            temp_product_buffer.details.dimensions.height = atoi(input);
            finalize_add_product();
            reset_to_main_menu();
            break;
        case 7: // Expecting description
            strncpy(temp_product_buffer.details.description, input, 99);
            temp_product_buffer.details.description[99] = '\0';
            finalize_add_product();
            reset_to_main_menu();
            break;
    }
    fflush(stdout);
}

void handle_update_quantity_step(const char* input) {
    Node* temp = head;
    switch (current_step) {
        case 0: // Expecting product name
            strncpy(name_buffer, input, 49);
            name_buffer[49] = '\0';
            while (temp) {
                if (strcmp(temp->product.name, name_buffer) == 0) {
                    current_step++;
                    printf("Enter new quantity for '%s' (current: %d): ", name_buffer, temp->product.quantity);
                    fflush(stdout);
                    return;
                }
                temp = temp->next;
            }
            printf("Product '%s' not found.\n", name_buffer);
            fflush(stdout);
            reset_to_main_menu();
            break;
        case 1: // Expecting new quantity
            temp = head; // Re-find the product (or pass it via a static pointer)
            while (temp) {
                if (strcmp(temp->product.name, name_buffer) == 0) {
                    temp->product.quantity = atoi(input);
                    printf("Quantity for '%s' updated to %d.\n", name_buffer, temp->product.quantity);
                    fflush(stdout);
                    reset_to_main_menu();
                    return;
                }
                temp = temp->next;
            }
            // Should not happen if name was found in step 0
            printf("Error: Product '%s' lost during update.\n", name_buffer);
            fflush(stdout);
            reset_to_main_menu();
            break;
    }
}

void handle_update_price_step(const char* input) {
    Node* temp = head;
     switch (current_step) {
        case 0: // Expecting product name
            strncpy(name_buffer, input, 49);
            name_buffer[49] = '\0';
            while (temp) {
                if (strcmp(temp->product.name, name_buffer) == 0) {
                    current_step++;
                    printf("Enter new price for '%s' (current: %.2f): ", name_buffer, temp->product.price);
                    fflush(stdout);
                    return;
                }
                temp = temp->next;
            }
            printf("Product '%s' not found.\n", name_buffer);
            fflush(stdout);
            reset_to_main_menu();
            break;
        case 1: // Expecting new price
            temp = head;
            while (temp) {
                if (strcmp(temp->product.name, name_buffer) == 0) {
                    temp->product.price = atof(input);
                    printf("Price for '%s' updated to %.2f.\n", name_buffer, temp->product.price);
                    fflush(stdout);
                    reset_to_main_menu();
                    return;
                }
                temp = temp->next;
            }
            printf("Error: Product '%s' lost during update.\n", name_buffer);
            fflush(stdout);
            reset_to_main_menu();
            break;
    }
}

void handle_delete_product_step(const char* input_name) {
    Node *temp = head, *prev = NULL;
    int found = 0;
    while (temp) {
        if (strcmp(temp->product.name, input_name) == 0) {
            if (prev)
                prev->next = temp->next;
            else
                head = temp->next;
            free(temp);
            printf("Product '%s' deleted successfully!\n", input_name);
            found = 1;
            break;
        }
        prev = temp;
        temp = temp->next;
    }
    if (!found) {
        printf("Product '%s' not found for deletion.\n", input_name);
    }
    fflush(stdout);
    reset_to_main_menu(); // Always reset after attempting deletion
}


// --- Emscripten Interface Functions ---
#ifdef __EMSCRIPTEN__
EMSCRIPTEN_KEEPALIVE
#endif
void init_inventory() {
    // Free any existing list if re-initializing (e.g. component re-mount)
    while (head) {
        Node* temp = head;
        head = head->next;
        free(temp);
    }
    head = NULL; // Ensure head is NULL

    inventory_active = 1;
    current_operation = OP_MAIN_MENU;
    current_step = 0;
    print_main_menu();
}

#ifdef __EMSCRIPTEN__
EMSCRIPTEN_KEEPALIVE
#endif
void process_inventory_input(const char* input_str) {
    fflush(stdout);

    if (!inventory_active) {
        printf("Inventory session has ended. Please re-initialize to start a new session.\n");
        fflush(stdout);
        return;
    }

    if (current_operation == OP_MAIN_MENU) {
        int choice = atoi(input_str);
        switch (choice) {
            case 1: // Add product
                current_operation = OP_ADD_PRODUCT;
                current_step = 0;
                printf("Enter product name: \n");
                fflush(stdout);
                break;
            case 2: // Display products
                displayProducts_internal();
                reset_to_main_menu(); // Stay in main menu, just re-prompt
                break;
            case 3: // Update product quantity
                current_operation = OP_UPDATE_QUANTITY;
                current_step = 0;
                printf("Enter product name to update quantity: \n");
                fflush(stdout);
                break;
            case 4: // Update product price
                current_operation = OP_UPDATE_PRICE;
                current_step = 0;
                printf("Enter product name to update price: \n");
                fflush(stdout);
                break;
            case 5: // Delete product
                current_operation = OP_DELETE_PRODUCT;
                current_step = 0; // Step 0 will ask for name
                printf("Enter product name to delete: \n");
                fflush(stdout);
                break;
            case 6: // Exit
                printf("Exiting program. Freeing memory...\n");
                fflush(stdout);
                while (head) {
                    Node* temp_node = head;
                    head = head->next;
                    free(temp_node);
                }
                printf("All products freed. Session ended.\n");
                inventory_active = 0;
                fflush(stdout);
                break;
            default:
                printf("Invalid choice. Please try again.\n");
                fflush(stdout);
                reset_to_main_menu(); // Re-prompt main menu
                break;
        }
    } else if (current_operation == OP_ADD_PRODUCT) {
        handle_add_product_step(input_str);
    } else if (current_operation == OP_UPDATE_QUANTITY) {
        handle_update_quantity_step(input_str);
    } else if (current_operation == OP_UPDATE_PRICE) {
        handle_update_price_step(input_str);
    } else if (current_operation == OP_DELETE_PRODUCT) {
        // For delete, we get the name directly, no further steps needed from user after this input
        handle_delete_product_step(input_str);
    }
}

// --- Main function for local command-line testing ---
#ifndef __EMSCRIPTEN__
// Original functions that used scanf, for reference or local testing setup
Product original_createProduct_scanf() {
    Product p;
    printf("Enter product name: "); scanf(" %[^\n]", p.name);
    printf("Enter quantity: "); scanf("%d", &p.quantity);
    printf("Enter price: "); scanf("%f", &p.price);
    printf("Does this product have dimensions (0 - No, 1 - Yes): "); scanf("%d", &p.hasDimensions);
    if (p.hasDimensions) {
        printf("Enter length, width, and height: ");
        scanf("%d %d %d", &p.details.dimensions.length, &p.details.dimensions.width, &p.details.dimensions.height);
    } else {
        printf("Enter product description: "); scanf(" %[^\n]", p.details.description);
    }
    return p;
}

int main() {
    init_inventory(); // Start with the menu

    char buffer[100];
    while (inventory_active) {
        // The prompt is already printed by init_inventory or reset_to_main_menu or step handlers
        if (fgets(buffer, sizeof(buffer), stdin) != NULL) {
            buffer[strcspn(buffer, "\n")] = 0; // Remove newline
            if (strlen(buffer) == 0 && current_operation != OP_MAIN_MENU) {
                 printf("Empty input during operation, please provide value or cancel (not implemented yet).\n");
                 // For simplicity, we'll just re-prompt the last thing.
                 // A real CLI might need a cancel option here.
                 // Re-printing the last prompt is tricky without storing it.
                 // Let's just process it, it might be an empty string for description.
            }
             if (strlen(buffer) > 0 || current_operation == OP_MAIN_MENU) { // Process if not empty or if it's a menu choice
                process_inventory_input(buffer);
            } else if (current_operation != OP_MAIN_MENU) {
                // If in an operation and input is empty, re-issue the last prompt.
                // This is a bit simplified. The actual prompt depends on current_operation and current_step.
                // For now, let's just say:
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