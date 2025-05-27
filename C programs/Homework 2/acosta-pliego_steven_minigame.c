#include <stdio.h>
#include <stdlib.h>
#include <time.h>
#include <ctype.h>
#include <string.h>

#ifdef __EMSCRIPTEN__
#include <emscripten.h>
#endif

//define statementes, tries, digits (how many are in the secret code), range(max value)
#define TRIES 8
#define DIGITS 3
#define RANGE 9

// Global state for the game
static int secret_code[DIGITS];
static int current_remaining_tries;
static int game_over_flag; // 0 = game on, 1 = game won, 2 = game lost

//function that generates a random secret code
void generateCode(int code[]) {
    for (int i = 0; i < DIGITS; i++) {
        //assigns random integer in to th ecurrent index of the secret code array
        code[i] = rand() % (RANGE + 1);
    }
}

//converts the secret code into an integer for comparison (too high or too low)
int codeToInt(int code_array[]) { // Renamed parameter to avoid conflict
    int number = 0;
    for (int i = 0; i < DIGITS; i++) {
        number = number * 10 + code_array[i];
    }
    return number;
}

#ifdef __EMSCRIPTEN__
EMSCRIPTEN_KEEPALIVE
#endif
void init_minigame() {
    srand(time(NULL)); // Seed random number generator
    generateCode(secret_code);
    current_remaining_tries = TRIES;
    game_over_flag = 0;
    printf("Welcome to the Code Guessing Minigame!\n");
    printf("Try to guess the %d-digit secret code. Digits are between 0 and %d.\n", DIGITS, RANGE);
    printf("%d tries remaining. Enter your guess:\n", current_remaining_tries);
    fflush(stdout);
}

#ifdef __EMSCRIPTEN__
EMSCRIPTEN_KEEPALIVE
#endif
void process_minigame_guess(const char* input_str) {
    if (game_over_flag != 0) {
        printf("Game is over. Please initialize a new game.\n");
        if (game_over_flag == 1) printf("You already won!\n");
        if (game_over_flag == 2) {
            printf("You already lost. The code was: ");
            for (int i = 0; i < DIGITS; i++) printf("%d", secret_code[i]);
            printf("\n");
        }
        fflush(stdout);
        return;
    }

    if (current_remaining_tries <= 0) {
        printf("You've run out of tries. Game over.\n");
        printf("The correct code was: ");
        for (int i = 0; i < DIGITS; i++) printf("%d", secret_code[i]);
        printf("\n");
        game_over_flag = 2; // Lost
        fflush(stdout);
        return;
    }

    printf("Processing guess: %s\n", input_str);

    int guess[DIGITS];
    int valid_input = 1;

    // Validate length (input_str includes newline if coming from some fgets-like sources, but from JS it might not)
    // strlen might be tricky if input_str is not null-terminated as expected by C.
    // Assuming JS sends a clean, null-terminated string of DIGITS length.
    size_t len = strlen(input_str);
    if (len != DIGITS) {
        printf("Invalid input length. Please enter exactly %d digits. You entered %zu.\n", DIGITS, len);
        fflush(stdout);
        return; // Don't decrement tries for clearly invalid format
    }

    for (int i = 0; i < DIGITS; i++) {
        if (!isdigit(input_str[i])) {
            valid_input = 0;
            break;
        }
        guess[i] = input_str[i] - '0';
    }

    if (!valid_input) {
        printf("Invalid input. Enter only digits.\n");
        fflush(stdout);
        return; // Don't decrement tries for clearly invalid format
    }

    current_remaining_tries--;

    int guess_number = codeToInt(guess);
    int secret_code_number_val = codeToInt(secret_code); // Renamed to avoid conflict

    int correct_position = 0;
    int correct_digit = 0;

    for (int i = 0; i < DIGITS; i++) {
        if (guess[i] == secret_code[i]) {
            correct_position++;
        } else {
            for (int j = 0; j < DIGITS; j++) {
                if (i != j && guess[i] == secret_code[j]) {
                    correct_digit++;
                    break;
                }
            }
        }
    }

    if (correct_position == DIGITS) {
        printf("You opened the vault! The code was: ");
        for (int i = 0; i < DIGITS; i++) printf("%d", secret_code[i]);
        printf("\n");
        game_over_flag = 1; // Won
    } else {
        if (guess_number > secret_code_number_val) {
            printf("Too high. ");
        } else {
            printf("Too low. ");
        }
        printf("%d correct digit(s) in the right place, %d correct digit(s) in the wrong place.\n", correct_position, correct_digit);
        if (current_remaining_tries > 0) {
            printf("%d tries remaining. Enter your guess:\n", current_remaining_tries);
        } else {
            printf("You've run out of tries. Game over.\n");
            printf("The correct code was: ");
            for (int i = 0; i < DIGITS; i++) printf("%d", secret_code[i]);
            printf("\n");
            game_over_flag = 2; // Lost
        }
    }
    fflush(stdout);
}

// Keep main for local testing if desired, but it won't be called by Emscripten in this setup
#ifndef __EMSCRIPTEN__
int main() {
    init_minigame(); // Call the new init function

    char input_buffer[100]; // Buffer for fgets

    while(game_over_flag == 0 && current_remaining_tries > 0) {
        if (fgets(input_buffer, sizeof(input_buffer), stdin) != NULL) {
            // Remove newline character if present
            input_buffer[strcspn(input_buffer, "\n")] = 0;
            if (strlen(input_buffer) == 0) continue; // Skip empty lines
            if (input_buffer[0] == 'q') {
                 printf("Game ended by user.\n");
                 break;
            }
            process_minigame_guess(input_buffer);
        } else {
            break; // EOF or error
        }
    }
    return 0;
}
#endif