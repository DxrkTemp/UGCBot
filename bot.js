require("dotenv").config();
const { Client, GatewayIntentBits, SlashCommandBuilder, REST, Routes } = require("discord.js");
const axios = require("axios");

const client = new Client({
    intents: [GatewayIntentBits.Guilds]
});

const TOKEN = process.env.DISCORD_BOT_TOKEN;
const CLIENT_ID = "1516389105188077618"; 
const GUILD_ID = "1516385832531922945";  

const API_URL = process.env.API_URL + "/api/verify";
const API_KEY = process.env.API_KEY;

const commands = [
    new SlashCommandBuilder()
        .setName("verify")
        .setDescription("Link your Roblox account")
        .addStringOption(option =>
            option.setName("robloxid")
                .setDescription("Your Roblox User ID")
                .setRequired(true)
        )
].map(cmd => cmd.toJSON());

const rest = new REST({ version: "10" }).setToken(TOKEN);

(async () => {
    try {
        console.log("Registering slash command...");

        await rest.put(
            Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
            { body: commands }
        );

        console.log("Slash command registered!");
    } catch (err) {
        console.error(err);
    }
})();

client.once("ready", () => {
    console.log(`Bot logged in as ${client.user.tag}`);
});


client.on("interactionCreate", async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === "verify") {
        const robloxId = interaction.options.getString("robloxid");

        if (!robloxId) {
            return interaction.reply({
                content: "Please provide your Roblox ID.",
                ephemeral: true
            });
        }

        try {
            const res = await axios.post(API_URL, {
                robloxId: Number(robloxId),
                discordId: interaction.user.id,
                apiKey: API_KEY
            });
        
            if (!res.data.success) {
                return interaction.reply({
                    content: res.data.message || "Verification failed.",
                    ephemeral: true
                });
            }
        
            return interaction.reply({
                content: "Successfully verified! You can now join the UGC quest.",
                ephemeral: true
            });
        
        } catch (err) {
            console.error(err);
        
            return interaction.reply({
                content: "Verification failed. Try again later.",
                ephemeral: true
            });
        }
    }
});

client.login(TOKEN);
