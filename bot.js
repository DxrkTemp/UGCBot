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

/* ===================== COMMANDS ===================== */

const commands = [
    new SlashCommandBuilder()
        .setName("verify")
        .setDescription("Link Roblox account")
        .addStringOption(o =>
            o.setName("robloxid").setDescription("Roblox ID").setRequired(true)
        ),

    new SlashCommandBuilder()
        .setName("preparecollection")
        .setDescription("Schedule fashion release")
        .addStringOption(o => o.setName("title").setRequired(true))
        .addStringOption(o => o.setName("date").setRequired(true))
        .addStringOption(o => o.setName("format").setRequired(true))
        .addStringOption(o => o.setName("preview"))
        .addStringOption(o => o.setName("banner")),

    new SlashCommandBuilder()
        .setName("paidlimited")
        .setDescription("Schedule paid limited drop")
        .addStringOption(o => o.setName("item").setRequired(true))
        .addStringOption(o => o.setName("date").setRequired(true)),

    new SlashCommandBuilder()
        .setName("starthunt")
        .setDescription("Create scavenger hunt")
        .addStringOption(o => o.setName("title").setRequired(true))
        .addStringOption(o => o.setName("ugc").setRequired(true))
        .addStringOption(o => o.setName("rules").setRequired(true))
        .addStringOption(o => o.setName("start").setRequired(true))
        .addStringOption(o => o.setName("end").setRequired(true))
        .addIntegerOption(o => o.setName("copies").setRequired(true))
        .addStringOption(o => o.setName("banner")),

    new SlashCommandBuilder()
        .setName("affiliate")
        .setDescription("Post affiliate collaboration")
        .addStringOption(o => o.setName("affiliate").setRequired(true))
        .addStringOption(o => o.setName("link").setRequired(true))
        .addStringOption(o => o.setName("banner"))
].map(c => c.toJSON());

const rest = new REST({ version: "10" }).setToken(TOKEN);

(async () => {
    await rest.put(
        Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
        { body: commands }
    );
})();

/* ===================== READY ===================== */

client.once("ready", () => {
    console.log("Bot ready");
    require("./scheduler")(client);
});

/* ===================== INTERACTIONS ===================== */

client.on("interactionCreate", async (i) => {
    if (!i.isChatInputCommand()) return;

    try {
        await i.deferReply({ ephemeral: true });

        /* ================= VERIFY ================= */
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

        /* ================= FASHION ================= */
        if (i.commandName === "preparecollection") {
            const date = estToUTC(i.options.getString("date"));

            await FashionRelease.create({
                title: i.options.getString("title"),
                releaseDate: date,
                format: i.options.getString("format"),
                previewUrl: i.options.getString("preview") || "",
                bannerUrl: i.options.getString("banner") || ""
            });

            return i.editReply("Fashion scheduled.");
        }

        /* ================= PAID LIMITED (FIXED) ================= */
        if (i.commandName === "paidlimited") {
            const date = estToUTC(i.options.getString("date"));

            await PaidLimited.create({
                itemName: i.options.getString("item"),
                releaseDate: date,
                active: true,
                announced: false
            });

            return i.editReply("Paid Limited scheduled.");
        }

        /* ================= HUNT ================= */
        if (i.commandName === "starthunt") {
            const start = estToUTC(i.options.getString("start"));
            const end = estToUTC(i.options.getString("end"));

            await ScavengerHunt.create({
                title: i.options.getString("title"),
                ugcName: i.options.getString("ugc"),
                rules: i.options.getString("rules"),
                startDate: start,
                endDate: end,
                copies: i.options.getInteger("copies"),
                remainingCopies: i.options.getInteger("copies"),
                bannerUrl: i.options.getString("banner") || "",
                active: true
            });

            return i.editReply("Hunt scheduled.");
        }

        /* ================= AFFILIATE ================= */
        if (i.commandName === "affiliate") {
            const affiliate = i.options.getString("affiliate");
            const link = i.options.getString("link");
            const banner = i.options.getString("banner");

            const channel = await client.channels.fetch(process.env.AFFILIATE_CHANNEL_ID).catch(() => null);
            if (!channel) return i.editReply("Affiliate channel not found.");

            await channel.send({
                content: `<@&${process.env.AFFILIATE_ROLE_ID}>`,
                embeds: [{
                    title: `COLLAB DROP — AVRENZI x ${affiliate}`,
                    description: "A new collaboration has arrived.",
                    color: 0x9B59B6,
                    fields: [
                        { name: "Partner", value: affiliate, inline: true },
                        { name: "Access", value: `[Click Here](${link})` }
                    ],
                    image: banner ? { url: banner } : undefined,
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

/* ===================== START ===================== */

(async () => {
    await connectDB();
    client.login(TOKEN);
})();
