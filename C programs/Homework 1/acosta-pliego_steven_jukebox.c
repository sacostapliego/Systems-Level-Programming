//Description: This program allows users to select a song from a list and displays the lyrics from a seprate file.

//Song1 - Street lights
//Song2 - Ghost Town
//Song3 - U think Maybe?
//Song4 - Passionfruit
//Song5 - ARE WE STILL FRIENDS?

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <fcntl.h>   // For open()
#include <unistd.h>  // For read() and close()
// #include <time.h> // For sleep() in non-Emscripten, unistd.h provides sleep

#ifdef __EMSCRIPTEN__
#include <emscripten.h>
#endif

#define MAX_SONGS 5
#define MAX_LINE 256

typedef struct {
    char artist[50];
    char songName[50];
    char album[50];
    char fileName[50];
} Song;

// Global song data
static Song songs[MAX_SONGS] = {
    {"Kanye West", "Street Lights", "808s & Heartbreak", "song1.txt"},
    {"Kanye West", "Ghost Town", "ye", "song2.txt"},
    {"MIKE", "U think Maybe?", "Burning Desire", "song3.txt"},
    {"Drake", "Passionfruit", "More Life", "song4.txt"},
    {"Tyler, the Creator", "ARE WE STILL FRIENDS", "IGOR", "song5.txt"}
};

static int jukebox_active = 1;

// Renamed to avoid conflict if original main is used for local testing
void printMenu_internal() {
    printf("\n%-3s%-32s%-32s%-30s\n", " ", "Artist", "Song", "Album");
    printf("---------------------------------------------------------------------------------\n");
    for (int i = 0; i < MAX_SONGS; i++) {
        printf("%d: %-30s- %-30s- %-30s\n", i + 1, songs[i].artist, songs[i].songName, songs[i].album);
    }
    printf("\n0: Quit\n\n");
    printf("Enter your choice: \n"); // Prompt for next input
    fflush(stdout);
}

// Renamed to avoid conflict
void displayLyrics_internal(const char *fileName) {
    int fd = open(fileName, O_RDONLY);
    if (fd == -1) {
        printf("Error opening file: %s\n", fileName); // perror might not be ideal for web output
        fflush(stdout);
        return;
    }

    char buffer[MAX_LINE];
    ssize_t bytesRead;
    while ((bytesRead = read(fd, buffer, sizeof(buffer) - 1)) > 0) {
        buffer[bytesRead] = '\0';
        printf("%s", buffer);
        fflush(stdout);
        #ifdef __EMSCRIPTEN__
        emscripten_sleep(100); // Reduced sleep time for better web UX, adjust as needed
        #else
        // sleep(1); // For local testing
        #endif
    }

    if (bytesRead == -1) {
        printf("Error reading file: %s\n", fileName);
        fflush(stdout);
    }
    close(fd);
}

#ifdef __EMSCRIPTEN__
EMSCRIPTEN_KEEPALIVE
#endif
void init_jukebox() {
    jukebox_active = 1;
    printf("Welcome to Steven's Lyric Jukebox!\nPlease select a track from the list below:\n\n");
    fflush(stdout);
    printMenu_internal();
}

#ifdef __EMSCRIPTEN__
EMSCRIPTEN_KEEPALIVE
#endif
void process_jukebox_input(const char* input_str) {
    if (!jukebox_active) {
        printf("Jukebox session has ended. Please re-initialize.\n");
        fflush(stdout);
        return;
    }

    int choice = atoi(input_str);

    if (choice == 0) {
        printf("Exiting Jukebox...\n");
        fflush(stdout);
        jukebox_active = 0;
        // No more prompts after exiting
    } else if (choice >= 1 && choice <= MAX_SONGS) {
        printf("\nPlaying: %s - %s - %s\n\n", songs[choice - 1].artist, songs[choice - 1].songName, songs[choice - 1].album);
        fflush(stdout);
        displayLyrics_internal(songs[choice - 1].fileName);
        printf("\n\n"); // Extra newlines after lyrics
        fflush(stdout);
        if (jukebox_active) { // If not exited during lyrics (not possible with current setup)
            printMenu_internal(); // Show menu again for next choice
        }
    } else {
        printf("Invalid choice. Please select a valid track number.\n");
        fflush(stdout);
        if (jukebox_active) {
            printMenu_internal(); // Show menu again
        }
    }
}

// --- Main function for local command-line testing ---
#ifndef __EMSCRIPTEN__
int main() {
    init_jukebox(); // Start with the menu

    char buffer[100];
    while (jukebox_active) {
        // The prompt is already printed by init_jukebox or printMenu_internal
        if (fgets(buffer, sizeof(buffer), stdin) != NULL) {
            buffer[strcspn(buffer, "\n")] = 0; // Remove newline
            if (strlen(buffer) > 0) {
                process_jukebox_input(buffer);
            }
        } else {
            break; // EOF
        }
    }
    printf("Local Jukebox test finished.\n");
    return 0;
}
#endif