// Require the necessary discord.js classes
require("dotenv").config()
const fs = require("fs")
const { Client, Intents, Collection } = require('discord.js');
const db = require("./db");
const logger = require("./helpers/logger");

// Create a new client instance
const client = new Client({ intents: [Intents.FLAGS.GUILDS] });

// Register commands
client.commands = new Collection();
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    // Set a new item in the Collection
    // With the key as the command name and the value as the exported module
    client.commands.set(command.data.name, command);
}

// Register events
const eventFiles = fs.readdirSync('./events').filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
    const event = require(`./events/${file}`);
    if (event.once) {
        client.once(event.name, (...args) => event.execute(...args));
    } else {
        client.on(event.name, (...args) => event.execute(...args));
    }
}

client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;

    const command = client.commands.get(interaction.commandName);

    if (!command) return;

    try {
        await command.execute(interaction);
    } catch (error) {
        console.error(error);
        await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
    }
});

(async () => {
    try {
        await db.sequelize.authenticate();
        await db.sequelize.sync();
    } catch (error) {
        logger.error('Unable to connect to the database:', error);
    }
})()

// Login to Discord with your client's token
client.login(process.env.BOT_TOKEN);