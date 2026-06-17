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
    ScavengerHunt
} = require("./db");

const { estToUTC } = require("./utils/time");

const client = new Client({
    intents: [GatewayIntentBits.Guilds]
});

const TOKEN = process.env.DISCORD_BOT_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;
const STAFF_ROLE_ID = process.env.STAFF_ROLE_ID;

// ================= STAFF CHECK =================
function isStaff(member) {
    return member?.roles?.cache?.has(STAFF_ROLE_ID);
}

// ================= SLASH COMMANDS =================
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
                .setDescription("Collection title")
                .setRequired(true)
        )
        .addStringOption(o =>
            o.setName("date")
                .setDescription("Release date (EST format)")
                .setRequired(true)
        )
        .addStringOption(o =>
            o.setName("format")
                .setDescription("Release format")
                .setRequired(true)
        )
        .addStringOption(o =>
            o.setName("preview")
                .setDescription("Preview image URL")
        )
        .addStringOption(o =>
            o.setName("banner")
                .setDescription("Banner image URL")
        ),

    new SlashCommandBuilder()
        .setName("starthunt")
        .setDescription("Create scavenger hunt")
        .addStringOption(o =>
            o.setName("title")
                .setDescription("Hunt title")
                .setRequired(true)
        )
        .addStringOption(o =>
            o.setName("ugc")
                .setDescription("UGC reward name")
                .setRequired(true)
        )
        .addStringOption(o =>
            o.setName("rules")
                .setDescription("Event rules")
                .setRequired(true)
        )
        .addStringOption(o =>
            o.setName("start")
                .setDescription("Start time (EST)")
                .setRequired(true)
        )
        .addStringOption(o =>
            o.setName("end")
                .setDescription("End time (EST)")
                .setRequired(true)
        )
        .addIntegerOption(o =>
            o.setName("copies")
                .setDescription("Number of copies")
                .setRequired(true)
        )
        .addStringOption(o =>
            o.setName("banner")
                .setDescription("Banner image URL")
        ),

    new SlashCommandBuilder()
        .setName("affiliate")
        .setDescription("Post affiliate collaboration")
        .addStringOption(o =>
            o.setName("affiliate")
                .setDescription("Affiliate name")
                .setRequired(true)
        )
        .addStringOption(o =>
            o.setName("link")
                .setDescription("Affiliate link")
                .setRequired(true)
        )
        .addStringOption(o =>
            o.setName("banner")
                .setDescription("Banner image URL")
        )
].map(c => c.toJSON());

// ================= REGISTER COMMANDS =================
const rest = new REST({ version: "10" }).setToken(TOKEN);

(async () => {
    await rest.put(
        Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
        { body: commands }
    );
})();

// ================= READY =================
client.once("ready", () => {
    console.log("Bot ready");
    require("./scheduler")(client);
});

// ================= INTERACTIONS =================
client.on("interactionCreate", async (i) => {
    if (!i.isChatInputCommand()) return;

    let replied = false;

    try {

        await i.deferReply({ ephemeral: true });
        replied = true;

        // ================= VERIFY =================
        if (i.commandName === "verify") {
            const res = await axios.post(process.env.API_URL + "/api/verify", {
                robloxId: Number(i.options.getString("robloxid")),
                discordId: i.user.id,
                apiKey: process.env.API_KEY
            });

            return await i.editReply(
                res.data.success ? "Verified successfully!" : "Verification failed."
            );
        }

        // ================= STAFF CHECK =================
        if (!isStaff(i.member)) {
            return await i.editReply("Staff only.");
        }

        // ================= FASHION =================
        if (i.commandName === "preparecollection") {
            const date = estToUTC(i.options.getString("date"));

            await FashionRelease.create({
                title: i.options.getString("title"),
                releaseDate: date,
                format: i.options.getString("format"),
                previewUrl: i.options.getString("preview") || "",
                bannerUrl: i.options.getString("banner") || "",
                announced: false,
                active: true
            });

            return await i.editReply("Fashion scheduled.");
        }

        // ================= HUNT =================
        if (i.commandName === "starthunt") {
            const start = estToUTC(i.options.getString("start"));
            const end = estToUTC(i.options.getString("end"));
            const copies = i.options.getInteger("copies");

            await ScavengerHunt.create({
                title: i.options.getString("title"),
                ugcName: i.options.getString("ugc"),
                rules: i.options.getString("rules"),
                startDate: start,
                endDate: end,
                copies,
                remainingCopies: copies,
                bannerUrl: i.options.getString("banner") || "",
                active: true,
                sent72Hour: false,
                sent24Hour: false,
                liveSent: false,
                endSent: false
            });

            return await i.editReply("Hunt scheduled.");
        }

        // ================= AFFILIATE =================
        if (i.commandName === "affiliate") {
            const affiliate = i.options.getString("affiliate");
            const link = i.options.getString("link");
            const banner = i.options.getString("banner");

            const channel = await client.channels.fetch(
                process.env.AFFILIATE_CHANNEL_ID
            ).catch(() => null);

            if (!channel) return await i.editReply("Affiliate channel not found.");

            const embed = {
                title: `COLLAB DROP — AVRENZI x ${affiliate}`,
                description: "A new collaboration has arrived.",
                color: 0x9B59B6,
                fields: [
                    { name: "Partner", value: affiliate, inline: true },
                    { name: "Access", value: `[Click Here](${link})` }
                ],
                footer: { text: "Avrenzi Collaboration Network" },
                timestamp: new Date()
            };

            if (banner && banner.startsWith("http")) {
                embed.image = { url: banner };
            }

            await channel.send({
                content: `<@&${process.env.AFFILIATE_ROLE_ID}>`,
                embeds: [embed]
            });

            return await i.editReply("Affiliate posted.");
        }

    } catch (err) {
        console.error(err);

        try {
            if (i.deferred || i.replied) {
                await i.editReply("Something went wrong.");
            } else {
                await i.reply({
                    content: "Something went wrong.",
                    ephemeral: true
                });
            }
        } catch (e) {
            console.error("Fallback reply failed:", e);
        }
    }
});

// ================= START =================
(async () => {
    await connectDB();
    client.login(TOKEN);
})();
