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
#include <time.h> //for sleep() / UNIX/snowball uses <time.h>
#ifdef __EMSCRIPTEN__
#include <emscripten.h>
#endif

//
#define MAX_SONGS 5 //helps with the size of the table
#define MAX_LINE 256 //helps when reading the content line by line

//Builds the table like structure
typedef struct {
    char artist[50];
    char songName[50];
    char album[50];
    char fileName[50];
} 
Song;

void printMenu(Song songs[], int numSongs) {
    //Spaces out the columns to best fix the example shown
    printf("%-3s%-32s%-32s%-30s\n", " ", "Artist", "Song", "Album");
    printf("---------------------------------------------------------------------------------\n");
    
    for (int i = 0; i < numSongs; i++) {
        //prints the songs using increment for loops in the form of:
        //#: name   song    album
        printf("%d: %-30s- %-30s- %-30s\n", i + 1, songs[i].artist, songs[i].songName, songs[i].album);
    }

    //Shows quit option
    printf("\n0: Quit\n\n");
}


//Displays the lyrics from song chosen
void displayLyrics(const char *fileName) {
    // Open the file for reading using open()
    int fd = open(fileName, O_RDONLY);
    
    // Check if the file opened successfully
    if (fd == -1) {
        perror("Error opening file");
        return;
    }

    char buffer[MAX_LINE];
    ssize_t bytesRead;

    //reads the contenet line by line
    while ((bytesRead = read(fd, buffer, sizeof(buffer) - 1)) > 0) {
        buffer[bytesRead] = '\0';
        printf("%s", buffer);
        fflush(stdout);
        #ifdef __EMSCRIPTEN__
        emscripten_sleep(1000); // 1000 milliseconds
        #else
        sleep(1);  // delay of 1 second
        #endif
    }

    // Check if reading was successful
    if (bytesRead == -1) {
        perror("Error reading file");
    }

    // Close the file descriptor
    close(fd);
}

int main() {
    //List of songs, lyric files kept as song[i] for simplicity purposes
    Song songs[MAX_SONGS] = {
        {"Kanye West", "Street Lights", "808s & Heartbreak", "song1.txt"},
        {"Kanye West", "Ghost Town", "ye", "song2.txt"},
        {"MIKE", "U think Maybe?", "Burning Desire", "song3.txt"},
        {"Drake", "Passionfruit", "More Life", "song4.txt"},
        {"Tyler, the Creator", "ARE WE STILL FRIENDS", "IGOR", "song5.txt"}
    };
    
    //Beginning messasge
    printf("Welcome to Steven's Lyric Jukebox!\nPlease select a track from the list below:\n\n");

    //loop
    while (1) {
        //prints the menu
        printMenu(songs, MAX_SONGS);

        //users choice
        int choice;
        printf(":> ");
        scanf("%d", &choice);

        //If the user chooses 0
        if (choice == 0) {
            printf("Exiting...\n");
            return -1;
        }
        //If the user chooses anything less or greater than the set of max songs: 5
        else if (choice < 1 || choice > MAX_SONGS) {
            printf("Invalid choice. Please select a valid track number.\n");
            return -1;
        }

        //Displays lyrics for the chosen song
        printf("\nPlaying: %s - %s - %s\n\n", songs[choice - 1].artist, songs[choice - 1].songName, songs[choice - 1].album);
        displayLyrics(songs[choice - 1].fileName);
        printf("\n\n");
    }
    
    return 0;
}