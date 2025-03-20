const { Client } = require("discord.js");
const { Permissions } = require('discord.js');
const config = require("./config.json");
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const axios = require('axios');
const env = require('dotenv').config().parsed;

const client = new Client({
    intents: ['Guilds', 'GuildMessages']
});

const ALLOWED_CHANNEL_NAMES = ['bot', 'anime-manga'];


client.login(env.BOT_TOKEN);

client.on('guildCreate', async guild => {
    try {
        console.log(`Joined a new guild: ${guild.name} (${guild.id}). Registering slash commands...`);

        await rest.put(
            Routes.applicationGuildCommands(env.CLIENT_ID, guild.id),
            { body: commands },
        );

        guild.roles.create({
            data: {
            name: 'SEARCH_ANIME_MANGA',
            color: 'BLUE',
            permissions: [
                Permissions.FLAGS.SEND_MESSAGES,
                Permissions.FLAGS.VIEW_CHANNEL,
                Permissions.FLAGS.EMBED_LINKS
                ]
            }
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

const rest = new REST({ version: '9' }).setToken(env.BOT_TOKEN);

(async () => {
    try {
        console.log('Started refreshing application (/) commands.');

        await rest.put(
            Routes.applicationCommands(env.CLIENT_ID),
            { body: commands },
        );

        console.log('Successfully reloaded application (/) commands.');
    } catch (error) {
        console.error(error);
    }
})();

client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;

    const { commandName, channelId, guild } = interaction;
    // Check if the command was used in an allowed channel
    const currentChannel = interaction.channel;
    const isAllowedChannel = ALLOWED_CHANNEL_NAMES.includes(currentChannel.name);

    // Find or create a dedicated channel for responses
    let responseChannel;
    if (!isAllowedChannel) {
        // Look for existing dedicated channels
        responseChannel = guild.channels.cache.find(channel =>
            ALLOWED_CHANNEL_NAMES.includes(channel.name) &&
            channel.type === 0 // For Discord.js v14, use ChannelType.GuildText
        );

        // If no dedicated channel exists, create one
        if (!responseChannel) {
            try {
                responseChannel = await guild.channels.create({
                    name: 'anime-manga',
                    type: 0, // Text channel (use appropriate channel type constant)
                    permissionOverwrites: [
                        {
                            id: guild.id,
                            allow: ['ViewChannel', 'ReadMessageHistory']
                        }
                    ]
                });

                await responseChannel.send('This channel has been created for anime and manga search commands!');
            } catch (error) {
                console.error('Error creating channel:', error);
                await interaction.reply({ content: 'Failed to create a dedicated channel. Make sure I have the necessary permissions!', ephemeral: true });
                return;
            }
        }

        // Tell user where to find results
        await interaction.reply({
            content: `Please use this command in the #${responseChannel.name} channel! Your results will be posted there.`,
            ephemeral: true
        });
    } else {
        // We're already in an allowed channel
        responseChannel = currentChannel;
    }

    // Process commands and send responses to the dedicated channel
    if (commandName === 'anime') {
        //Get parameters
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
                                if (isAllowedChannel) {
                                    await interaction.reply(`Anime: ${animeData.title} | ${animeData.type} | source: ${animeData.source} | ${year} | ${trailer}`);
                                } else {
                                    await responseChannel.send(`Anime: ${animeData.title} | ${animeData.type} | source: ${animeData.source} | ${year} | ${trailer}`);
                                }
                            } else {
                                if (isAllowedChannel) {
                                    await interaction.followUp(`Anime: ${animeData.title} | ${animeData.type} | source: ${animeData.source} | year: ${animeData.year} | trailer: ${animeData.trailer.url}`);
                                } else {
                                    await responseChannel.send(`Anime: ${animeData.title} | ${animeData.type} | source: ${animeData.source} | year: ${animeData.year} | trailer: ${animeData.trailer.url}`);
                                }
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
                                if (isAllowedChannel) {
                                    await interaction.reply(`Anime: ${animeData.title} | ${animeData.type} | source: ${animeData.source} | ${year} | ${trailer}`);
                                } else {
                                    await responseChannel.send(`Anime: ${animeData.title} | ${animeData.type} | source: ${animeData.source} | ${year} | ${trailer}`);
                                }
                            } else {
                                if (isAllowedChannel) {
                                    await interaction.followUp(`Anime: ${animeData.title} | ${animeData.type} | source: ${animeData.source} | year: ${animeData.year} | trailer: ${animeData.trailer.url}`);
                                } else {
                                    await responseChannel.send(`Anime: ${animeData.title} | ${animeData.type} | source: ${animeData.source} | year: ${animeData.year} | trailer: ${animeData.trailer.url}`);
                                }
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
            // If we redirected, make sure the original interaction is acknowledged
            if (!isAllowedChannel && !interaction.replied) {
                await interaction.reply({
                    content: `Search results for "${mangaName}" have been posted in #${responseChannel.name}!`,
                    ephemeral: true
                });
            }
        } catch (error) {
            console.error(error);
            await interaction.reply({ content: 'An error occurred while searching for anime.', ephemeral: true });
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
                                if (isAllowedChannel) {
                                    await interaction.reply(`Manga: ${mangaData.title} | ${mangaData.type} | source: ${mangaData.source} | ${year} | ${synopsis} | ${genre}`);
                                } else {
                                    await responseChannel.send(`Manga: ${mangaData.title} | ${mangaData.type} | source: ${mangaData.source} | ${year} | ${synopsis} | ${genre}`);
                                }
                            } else {
                                if (isAllowedChannel) {
                                    await interaction.followUp(`Manga: ${mangaData.title} | ${mangaData.type} | source: ${mangaData.source} | ${year} | ${synopsis} | ${genre}`);
                                } else {
                                    await responseChannel.send(`Manga: ${mangaData.title} | ${mangaData.type} | source: ${mangaData.source} | ${year} | ${synopsis} | ${genre}`);
                                }
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
                                if (isAllowedChannel) {
                                    await interaction.reply(`Manga: ${mangaData.title} | ${mangaData.type} | source: ${mangaData.source} | ${year} | ${synopsis} | ${genre}`);
                                } else {
                                    await responseChannel.send(`Manga: ${mangaData.title} | ${mangaData.type} | source: ${mangaData.source} | ${year} | ${synopsis} | ${genre}`);
                                }
                            } else {
                                if (isAllowedChannel) {
                                    await interaction.followUp(`Manga: ${mangaData.title} | ${mangaData.type} | source: ${mangaData.source} | ${year} | ${synopsis} | ${genre}`);
                                } else {
                                    await responseChannel.send(`Manga: ${mangaData.title} | ${mangaData.type} | source: ${mangaData.source} | ${year} | ${synopsis} | ${genre}`);
                                }
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
            if (!isAllowedChannel && !interaction.replied) {
                await interaction.reply({
                    content: `Search results for "${mangaName}" have been posted in #${responseChannel.name}!`,
                    ephemeral: true
                });
            }
        } catch (error) {
            console.error(error);
            await interaction.reply({ content: 'An error occurred while searching for anime.', ephemeral: true });
        }
    }
});

