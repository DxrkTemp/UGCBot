require("dotenv").config();

const { connectDB } = require("./db");

const {
    Client,
    GatewayIntentBits,
    SlashCommandBuilder,
    REST,
    Routes
} = require("discord.js");

const axios = require("axios");

const {
    FashionRelease,
    ScavengerHunt,
    PaidLimited
} = require("./db");

const { estToUTC } = require("./utils/time");

const client = new Client({
    intents: [GatewayIntentBits.Guilds]
});

const TOKEN = process.env.DISCORD_BOT_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;
const STAFF_ROLE_ID = process.env.STAFF_ROLE_ID;

function isStaff(member) {
    return member?.roles?.cache?.has(STAFF_ROLE_ID);
}

const commands = [
    new SlashCommandBuilder()
        .setName("verify")
        .setDescription("Link Roblox account")
        .addStringOption(o =>
            o.setName("robloxid")
                .setDescription("Roblox ID")
                .setRequired(true)
        ),

    new SlashCommandBuilder()
        .setName("preparecollection")
        .setDescription("Schedule fashion release")
        .addStringOption(o =>
            o.setName("title")
                .setDescription("Title")
                .setRequired(true)
        )
        .addStringOption(o =>
            o.setName("date")
                .setDescription("YYYY-MM-DD HH:mm")
                .setRequired(true)
        )
        .addStringOption(o =>
            o.setName("format")
                .setDescription("Format")
                .setRequired(true)
        )
        .addStringOption(o =>
            o.setName("preview")
                .setDescription("Preview URL")
        ),

    new SlashCommandBuilder()
        .setName("starthunt")
        .setDescription("Create scavenger hunt")
        .addStringOption(o =>
            o.setName("title")
                .setDescription("Title")
                .setRequired(true)
        )
        .addStringOption(o =>
            o.setName("ugc")
                .setDescription("UGC Item")
                .setRequired(true)
        )
        .addStringOption(o =>
            o.setName("rules")
                .setDescription("Rules")
                .setRequired(true)
        )
        .addStringOption(o =>
            o.setName("start")
                .setDescription("YYYY-MM-DD HH:mm")
                .setRequired(true)
        )
        .addStringOption(o =>
            o.setName("end")
                .setDescription("YYYY-MM-DD HH:mm")
                .setRequired(true)
        ),

    new SlashCommandBuilder()
        .setName("affiliate")
        .setDescription("Post affiliate collaboration instantly")
        .addStringOption(o =>
            o.setName("affiliate")
                .setDescription("Affiliate Name")
                .setRequired(true)
        )
        .addStringOption(o =>
            o.setName("link")
                .setDescription("Group Store Link")
                .setRequired(true)
        )
].map(c => c.toJSON());

const rest = new REST({ version: "10" }).setToken(TOKEN);

(async () => {
    await rest.put(
        Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
        { body: commands }
    );
})();

client.once("ready", () => {
    console.log("Bot ready");
    require("./scheduler")(client);
});

client.on("interactionCreate", async (i) => {
    if (!i.isChatInputCommand()) return;

    if (i.commandName === "verify") {
        await i.deferReply({ ephemeral: true });

        try {
            const res = await axios.post(process.env.API_URL + "/api/verify", {
                robloxId: Number(i.options.getString("robloxid")),
                discordId: i.user.id,
                apiKey: process.env.API_KEY
            });

            return i.editReply(
                res.data.success
                    ? "Verified successfully!"
                    : (res.data.message || "Verification failed.")
            );
        } catch {
            return i.editReply("Server error during verification.");
        }
    }

    if (!isStaff(i.member) && i.commandName !== "verify") {
        await i.reply({ content: "Staff only.", ephemeral: true });
        return;
    }

    if (i.commandName === "preparecollection") {
        await i.deferReply({ ephemeral: true });

        const date = estToUTC(i.options.getString("date"));
        if (!date) return i.editReply("Invalid date format.");

        await FashionRelease.create({
            title: i.options.getString("title"),
            releaseDate: date,
            format: i.options.getString("format"),
            previewUrl: i.options.getString("preview") || ""
        });

        return i.editReply("Fashion scheduled.");
    }

    if (i.commandName === "starthunt") {
        await i.deferReply({ ephemeral: true });

        const start = estToUTC(i.options.getString("start"));
        const end = estToUTC(i.options.getString("end"));

        if (!start || !end) {
            return i.editReply("Invalid date format.");
        }

        const hunt = await ScavengerHunt.create({
            title: i.options.getString("title"),
            ugcName: i.options.getString("ugc"),
            rules: i.options.getString("rules"),
            startDate: start,
            endDate: end
        });

        return i.editReply(`Hunt scheduled.\nID: ${hunt._id}`);
    }

    if (i.commandName === "affiliate") {
        await i.deferReply({ ephemeral: true });
    
        const affiliate = i.options.getString("affiliate");
        const link = i.options.getString("link");
    
        const channel = await client.channels.fetch(process.env.AFFILIATE_CHANNEL_ID).catch(() => null);
    
        if (!channel) {
            return i.editReply("Affiliate channel not found.");
        }
    
        await channel.send(
    `<@&${process.env.AFFILIATE_ROLE_ID}>
    
    <:Gold_Avrenzi:1469558139119734930> AVRENZI x ${affiliate} — COLLAB RELEASE
    "Luxury in Motion, Style in Devotion"
    
    We are excited to announce our collaboration with ${affiliate}!
    
    Explore the collaboration now.
    ${link}
    
    The Avrenzi Team
    `
        );
    
        return i.editReply("Affiliate posted.");
    }

(async () => {
    await connectDB();
    client.login(TOKEN);
})();
