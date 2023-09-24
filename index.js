const { Client } = require("discord.js");
const config = require("./config.json");
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');

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

        console.log('Successfully registered slash commands for guild:', guild.name);
    } catch (error) {
        console.error('Error registering slash commands on guildCreate:', error);
    }
});


const commands = [{
    name: 'anime',
    description: 'Recherche des informations sur un anime spécifique',
    type: 1,
    options: [{
        name: 'nom',
        type: 3,
        description: 'Nom de l\'anime à rechercher',
        required: true,
    }]
}];

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
        const animeName = interaction.options.getString('nom');
        // Ici, faites un appel à l'API AniList ou MyAnimeList pour obtenir les informations.
        // Convertissez les données de l'API en une réponse appropriée pour votre commande.
        await interaction.reply(`Résultats pour ${animeName}: ...`); // Modifiez cette réponse en fonction des données obtenues.
    }
});
