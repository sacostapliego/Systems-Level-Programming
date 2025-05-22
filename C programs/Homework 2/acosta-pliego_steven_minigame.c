//Name: Steven Acosta-Pligo
//Class: CSC3320
//Description: guessing minigame, user tries to crack the 'code' by guessing three different numbers while given three hints,
//whether it is too high or low, if any digits are correct and in the right postion, if any digits are correct but in the wrong position

#include <stdio.h>
#include <stdlib.h>
#include <time.h>
#include <ctype.h>
#include <string.h>

//define statementes, tries, digits (how many are in the secret code), range(max value)
#define TRIES 8
#define DIGITS 3
#define RANGE 9

//function that generates a random secret code
void generateCode(int code[]) {
    //random number generator
    srand(time(0));
    for (int i = 0; i < DIGITS; i++) {
        //assigns random integer in to th ecurrent index of the secret code array
        code[i] = rand() % (RANGE + 1);
    }
}

//converts the secret code into an integer for comparison (too high or too low)
int codeToInt(int code[]) {
    int number = 0;
    for (int i = 0; i < DIGITS; i++) {
        number = number * 10 + code[i];
    }
    return number;
}


int main() {
    //declares integers, charactres, and executes the code above
    int code[DIGITS];
    generateCode(code);
    int remaining_tries = TRIES;
    int correct_position, correct_digit;
    char input[10];

    int secret_code_number = codeToInt(code);

    //while the ramined tries are above 0...
    while (remaining_tries > 0) {
        //statement
        printf("%d tries remaining. What is the code?  ", remaining_tries);
        //user input
        fgets(input, sizeof(input), stdin);

        //if user quits
        if (input[0] == 'q') {
            printf("Game ended by user.\n");
            break;
        }
        
        //enters exactly the specified amount in digits (3), if not than continue and skips the rest of the loop
        int guess[DIGITS];
        int valid_input = 1;
        if (strlen(input) - 1 != DIGITS) {
            printf("Invalid input. Please enter exactly %d digits.\n", DIGITS);
            continue;
        }

        //if any character is not a digit, than it sets valid input to 0 and breaks the code
        for (int i = 0; i < DIGITS; i++) {
            if (!isdigit(input[i])) {
                valid_input = 0;
                break;
            }
        //if it is valid,  than it converts each character into an integer and puts it into the guess array
            guess[i] = input[i] - '0';
        }
        
        //if it is not a invalid input than continue and skips the rest of the loop
        if (!valid_input) {
            printf("Invalid input. Enter only digits.\n");
            continue;
        }

        int guess_number = 0;
        for (int i = 0; i < DIGITS; i++) {
            guess_number = guess_number * 10 + guess[i];
        }

        correct_position = 0;
        correct_digit = 0;
        //calcualtes poistion and digit
        for (int i = 0; i < DIGITS; i++) {
            //if correct postion
            if (guess[i] == code[i]) {
                correct_position++;
            //check for correct digit in wrong postion
            } else {
                for (int j = 0; j < DIGITS; j++) {
                    //makes sure they are not in the same postoin
                    if (i != j && guess[i] == code[j]) {
                        //increments correct digit only
                        correct_digit++;
                        break;
                    }
                }
            }
        }

        //if it is in the correct positoin
        if (correct_position == DIGITS) {
            printf("You opened the vault!\n");
            break;
        //if it not correct, than tells the user current tries, correct postions, and correct digits
        }  else {
            //gives feedback based on whether the guess is too high or too low
            if (guess_number > secret_code_number) {
                printf("Too high, %d digits are correct and in the right place, %d digits are correct but in the wrong place.\n", correct_position, correct_digit);
            } else {
                printf("Too low, %d digits are correct and in the right place, %d digits are correct but in the wrong place.\n", correct_position, correct_digit);
            }
        }

        //decrements tries
        remaining_tries--;
    }

    //if the user runs out of tries
    if (remaining_tries == 0) {
        printf("You've run out of tries. The correct code was: ");
        for (int i = 0; i < DIGITS; i++) printf("%d", code[i]);
        printf("\n");
    }

    return 0;
}
