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

const EMOJI = {
    premium: "<:premium:1457551517476327627>",
    collection: "<:customer_av:1456642788568469525>",
    gold: "<:Gold_Avrenzi:1469558139119734930>"
};

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
        )
        .addIntegerOption(o =>
            o.setName("copies")
                .setDescription("UGC copies available")
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

    try {
        if (!i.replied && !i.deferred) {
            await i.deferReply({ ephemeral: true });
        }

        if (i.commandName === "verify") {
            const res = await axios.post(process.env.API_URL + "/api/verify", {
                robloxId: Number(i.options.getString("robloxid")),
                discordId: i.user.id,
                apiKey: process.env.API_KEY
            });

            return i.editReply(res.data.success ? "Verified successfully!" : "Verification failed.");
        }

        if (!isStaff(i.member) && i.commandName !== "verify") {
            return i.editReply("Staff only.");
        }

        if (i.commandName === "preparecollection") {
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
            const start = estToUTC(i.options.getString("start"));
            const end = estToUTC(i.options.getString("end"));
            const copies = i.options.getInteger("copies");

            if (!start || !end) {
                return i.editReply("Invalid date format.");
            }

            const hunt = await ScavengerHunt.create({
                title: i.options.getString("title"),
                ugcName: i.options.getString("ugc"),
                rules: i.options.getString("rules"),
                startDate: start,
                endDate: end,
                copies,
                remainingCopies: copies,
                active: true
            });

            return i.editReply(`Hunt scheduled.\nID: ${hunt._id}`);
        }

        if (i.commandName === "affiliate") {
            const affiliate = i.options.getString("affiliate");
            const link = i.options.getString("link");

            const channel = await client.channels.fetch(process.env.AFFILIATE_CHANNEL_ID).catch(() => null);
            if (!channel) return i.editReply("Affiliate channel not found.");

            await channel.send({
                content: `<@&${process.env.AFFILIATE_ROLE_ID}>`,
                embeds: [{
                    title: `${EMOJI.gold} COLLAB DROP — AVRENZI x ${affiliate}`,
                    description: "**Luxury in Motion, Style in Devotion**\n\nA new collaboration has arrived.",
                    color: 0x9B59B6,
                    fields: [
                        { name: "Partner", value: `**${affiliate}**`, inline: true },
                        { name: "Type", value: "**Affiliate Collaboration**", inline: true },
                        { name: "Access", value: `[Click to View](${link})` }
                    ],
                    footer: { text: "Avrenzi Collaboration Network" },
                    timestamp: new Date()
                }]
            });

            return i.editReply("Affiliate posted.");
        }

    } catch (err) {
        console.error(err);
        return i.editReply("Something went wrong.");
    }
});

(async () => {
    await connectDB();
    client.login(TOKEN);
})();
