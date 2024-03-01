const { Client } = require("discord.js");
const { Permissions } = require('discord.js');
const config = require("./config.json");
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const axios = require('axios');

const client = new Client({
    intents: ['Guilds', 'GuildMessages']
});


client.login(config.BOT_TOKEN);

client.on('guildCreate', async guild => {
    try {
        console.log(`Joined a new guild: ${guild.name} (${guild.id}). Registering slash commands...`);

        await rest.put(
            Routes.applicationGuildCommands(config.CLIENT_ID, guild.id),
            { body: commands },
        );

        guild.roles.create({
            data: {
                name: 'SEARCH_ANIME_MANGA',
                color: 'BLUE',
                permissions: [
                    Permissions.FLAGS.SEND_MESSAGES,
                    Permissions.FLAGS.VIEW_CHANNEL,
                    Permissions.EMBED_LINKS
                ],
            },
        });

        console.log('Successfully registered slash commands for guild:', guild.name);
    } catch (error) {
        console.error('Error registering slash commands on guildCreate:', error);
    }
});


const commands = [
    {
        name: 'anime',
        description: 'Search for information about an anime',
        type: 1,
        options: [
            {
                name: 'name',
                type: 3,
                description: 'Name of the anime',
                required: true,
            },
            {
                name: 'number_search',
                type: 3,
                description: 'Number of the anime (all or number search)',
                required: true
            }
        ],
    },
    {
        name: 'manga',
        description: 'Search for information about a manga',
        type: 1,
        options: [
            {
                name: 'name',
                type: 3,
                description: 'Name of the manga',
                required: true,
            },
            {
                name: 'number_search',
                type: 3,
                description: 'Number of the manga ( all or number search)',
                required: true
            }
        ],
    }
];

const rest = new REST({ version: '9' }).setToken(config.BOT_TOKEN);

(async () => {
    try {
        console.log('Started refreshing application (/) commands.');

        await rest.put(
            Routes.applicationCommands(config.CLIENT_ID),
            { body: commands },
        );

        console.log('Successfully reloaded application (/) commands.');
    } catch (error) {
        console.error(error);
    }
})();

client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;

    const { commandName } = interaction;

    if (commandName === 'anime') {
        const animeName = interaction.options.getString('name');
        const numberSearch = interaction.options.getString('number_search');
        const api = config.API_URL_ANIME;
        const maxRequestsPerMinute = 60; // Nombre maximal de requêtes par minute
        const delayBetweenRequests = 1000 * (60 / maxRequestsPerMinute); // Délai en millisecondes entre chaque requête

        let number;
        if (numberSearch === 'all') {
            number = 'all';
        } else if (!isNaN(numberSearch)) {
            number = parseInt(numberSearch, 10);
        } else {
            console.error('Invalid number_search value');
        }

        try {
            const response = await axios.get(`${api}?q=${animeName}&sfw`);
            const animeList = response.data.data;

            if (animeList.length > 0) {
                if (number === 'all') {
                    for (let i = 0; i < animeList.length; i++) {
                        const anime = animeList[i];
                        const animeId = anime.mal_id;
                        try {
                            const animeResponse = await axios.get(`${api}/${animeId}/full`);
                            const animeData = animeResponse.data.data;
                            const year = animeData.year !== "null" ? `year: ${animeData.year}` : 'No information about the year';
                            const trailer = animeData.trailer.url !== "null" ? `trailer: ${animeData.trailer.url}` : 'No trailer';

                            if (i === 0) {
                                await interaction.reply(`Anime: ${animeData.title} | ${animeData.type} | source: ${animeData.source} | ${year} | ${trailer}`);
                            } else {
                                await interaction.followUp(`Anime: ${animeData.title} | ${animeData.type} | source: ${animeData.source} | year: ${animeData.year} | trailer: ${animeData.trailer.url}`);
                            }

                            // Attendez un certain temps avant d'envoyer la réponse suivante
                            await new Promise(resolve => setTimeout(resolve, delayBetweenRequests));
                        } catch (error) {
                            if (error.response && error.response.status === 429) {
                                // Attendre un certain temps avant de réessayer en cas d'erreur 429
                                await new Promise(resolve => setTimeout(resolve, delayBetweenRequests));
                                i--; // Répéter la même itération
                            } else {
                                console.error(error);
                            }
                        }
                    }
                }
                else {
                    for (let i = 0; i <= number; i++) {
                        const anime = animeList[i];
                        const animeId = anime.mal_id;
                        try {
                            const animeResponse = await axios.get(`${api}/${animeId}/full`);
                            const animeData = animeResponse.data.data;
                            const year = animeData.year !== "null" ? `year: ${animeData.year}` : 'No information about the year';
                            const trailer = animeData.trailer.url !== "null" ? `trailer: ${animeData.trailer.url}` : 'No trailer';

                            if (i === 0) {
                                await interaction.reply(`Anime: ${animeData.title} | ${animeData.type} | source: ${animeData.source} | ${year} | ${trailer}`);
                            } else {
                                await interaction.followUp(`Anime: ${animeData.title} | ${animeData.type} | source: ${animeData.source} | year: ${animeData.year} | trailer: ${animeData.trailer.url}`);
                            }

                            // Attendez un certain temps avant d'envoyer la réponse suivante
                            await new Promise(resolve => setTimeout(resolve, delayBetweenRequests));
                        } catch (error) {
                            if (error.response && error.response.status === 429) {
                                // Attendre un certain temps avant de réessayer en cas d'erreur 429
                                await new Promise(resolve => setTimeout(resolve, delayBetweenRequests));
                                i--; // Répéter la même itération
                            } else {
                                console.error(error);
                            }
                        }
                    }
                }
            } else {
                await interaction.reply('No anime found.');
            }
        } catch (error) {
            console.error(error);
        }
    }
    else if (commandName === 'manga') {
        const mangaName = interaction.options.getString('name');
        const api = config.API_URL_MANGA;
        const maxRequestsPerMinute = 60; // Nombre maximal de requêtes par minute
        const delayBetweenRequests = 1000 * (60 / maxRequestsPerMinute); // Délai en millisecondes entre chaque requête
        const numberSearch = interaction.options.getString('number_search');
        let number;
        if (numberSearch === 'all') {
            number = 'all';
        } else if (!isNaN(numberSearch)) {
            number = parseInt(numberSearch, 10);
        } else {
            console.error('Invalid number_search value');
        }

        try {
            const response = await axios.get(`${api}?q=${mangaName}&sfw`);
            const mangaList = response.data.data;

            if (mangaList.length > 0) {
                if (number === 'all') {
                    for (let i = 0; i < mangaList.length; i++) {
                        const manga = mangaList[i];
                        const mangaId = manga.mal_id;
                        try {
                            const mangaResponse = await axios.get(`${api}/${mangaId}/full`);
                            const mangaData = mangaResponse.data.data;

                            const year = mangaData.year !== "null" ? `year: ${mangaData.year}` : 'No information about the year';
                            const synopsis = mangaData.synopsis ? `synopsis: ${mangaData.synopsis}` : 'No synopsis available';
                            const genre = mangaData.genre && Array.isArray(mangaData.genre) ? mangaData.genre.join(', ') : 'No genre information';

                            if (i === 0) {
                                await interaction.reply(`Manga: ${mangaData.title} | ${mangaData.type} | source: ${mangaData.source} | year: ${year} | synopsis: ${synopsis} | genre: ${genre}`);
                            } else {
                                await interaction.followUp(`Manga: ${mangaData.title} | ${mangaData.type} | source: ${mangaData.source} | year: ${mangaData.year} | synopsis: ${mangaData.synopsis} | genre: ${genre}`);
                            }

                            // Attendez un certain temps avant d'envoyer la réponse suivante
                            await new Promise(resolve => setTimeout(resolve, delayBetweenRequests));
                        } catch (error) {
                            if (error.response && error.response.status === 429) {
                                // Attendre un certain temps avant de réessayer en cas d'erreur 429
                                await new Promise(resolve => setTimeout(resolve, delayBetweenRequests));
                                i--; // Répéter la même itération
                            } else {
                                console.error(error);
                            }
                        }
                    }
                }
                else {
                    for (let i = 0; i <= number; i++) {
                        const manga = mangaList[i];
                        const mangaId = manga.mal_id;
                        try {
                            const mangaResponse = await axios.get(`${api}/${mangaId}/full`);
                            const mangaData = mangaResponse.data.data;

                            const year = mangaData.year !== "null" ? `year: ${mangaData.year}` : 'No information about the year';
                            const synopsis = mangaData.synopsis ? `synopsis: ${mangaData.synopsis}` : 'No synopsis available';
                            const genre = mangaData.genre && Array.isArray(mangaData.genre) ? mangaData.genre.join(', ') : 'No genre information';

                            if (i === 0) {
                                await interaction.reply(`Manga: ${mangaData.title} | ${mangaData.type} | source: ${mangaData.source} | year: ${year} | synopsis: ${synopsis} | genre: ${genre}`);
                            } else {
                                await interaction.followUp(`Manga: ${mangaData.title} | ${mangaData.type} | source: ${mangaData.source} | year: ${mangaData.year} | synopsis: ${mangaData.synopsis} | genre: ${genre}`);
                            }

                            // Attendez un certain temps avant d'envoyer la réponse suivante
                            await new Promise(resolve => setTimeout(resolve, delayBetweenRequests));
                        } catch (error) {
                            if (error.response && error.response.status === 429) {
                                // Attendre un certain temps avant de réessayer en cas d'erreur 429
                                await new Promise(resolve => setTimeout(resolve, delayBetweenRequests));
                                i--; // Répéter la même itération
                            } else {
                                console.error(error);
                            }
                        }
                    }
                }
            } else {
                await interaction.reply('No manga found.');
            }
        } catch (error) {
            console.error(error);
        }
    }
});

