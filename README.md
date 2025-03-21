# Anime & Manga Search Discord Bot
A powerful Discord bot that allows users to search for anime and manga information using the MyAnimeList database via the Jikan API.

## Features
- Search for anime with details like:
  - Title, Type, Source, Year, and Trailer links
- Search for manga with details like:
  - Title, Type, Source, Year, and Synopsis
- Choose to display a single result or multiple results
- Easy-to-use Discord slash commands

Add this bot to your Discord server:
[Invite Link](https://discord.com/oauth2/authorize?client_id=473135420608348162)

## Usage
To use the bot, simply type `/anime` or `/manga` followed by the name of the anime or manga you want to search for. You can see the results in canals `#bot` or `#anime-manga`.

## Roles and Permissions
This bot requires the following roles:
- `@everyone`: To receive search results in the `#bot` or `#anime-manga` channels.
- `@everyone`: To use the slash commands `/anime` and `/manga`.
- Send Messages: To receive search results in the `#bot` or `#anime-manga` channels.
- View Channel: To receive search results in the `#bot` or `#anime-manga` channels.
- Embed Links: To receive search results in the paste trailer links to corresponding research to use commands `/anime`.

## Commands
The bot supports the following slash commands:

### Anime Search
- **Command:** `/anime`
- **Parameters:**
  - `name`: The name of the anime you want to search for
  - `number_search`: Choose "all" to display all results, or specify a number to limit the results (default is "all")

### Manga Search
- **Command:** `/manga`
- **Parameters:**
  - `name`: The name of the manga you want to search for
  - `number_search`: Choose "all" to display all results, or specify a number to limit the results

### Examples
- Searching for "Naruto" anime and displaying the first 3 results:
  ```
  /anime name:Naruto number_search:3
  ```
- Searching for "One Piece" manga and displaying all available results:
  ```
  /manga name:One Piece number_search:all
  ```

## Setup for Development
If you want to run or modify this bot locally:

### Steps:
1. Clone this repository:
   ```sh
   git clone https://github.com/your-repo-name.git
   ```
2. Install dependencies:
   ```sh
   npm install
   ```
3. Update `config.json` with your Discord bot token and client ID.
4. Run the bot:
   ```sh
   node index.js
   ```

### Requirements:
- Node.js (v14.x or newer)
- Discord.js v14
- A Discord bot token

## Credits
This bot uses the Jikan API to fetch anime and manga data from MyAnimeList.

## License
This project is licensed under the [MIT License](LICENSE).