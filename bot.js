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

/* ================= COMMANDS ================= */

const commands = [
    new SlashCommandBuilder()
        .setName("verify")
        .setDescription("Link Roblox account")
        .addStringOption(o =>
            o.setName("robloxid")
                .setDescription("Your Roblox ID")
                .setRequired(true)
        ),

    new SlashCommandBuilder()
        .setName("preparecollection")
        .setDescription("Schedule fashion release")
        .addStringOption(o =>
            o.setName("title")
                .setDescription("Collection name")
                .setRequired(true)
        )
        .addStringOption(o =>
            o.setName("date")
                .setDescription("Release date")
                .setRequired(true)
        )
        .addStringOption(o =>
            o.setName("format")
                .setDescription("Format")
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
        .setName("paidlimited")
        .setDescription("Schedule Paid Limited drop")
        .addStringOption(o =>
            o.setName("item")
                .setDescription("Item name")
                .setRequired(true)
        )
        .addStringOption(o =>
            o.setName("price")
                .setDescription("Price (e.g. 50 Robux)")
                .setRequired(true)
        )
        .addIntegerOption(o =>
            o.setName("copies")
                .setDescription("Number of copies")
                .setRequired(true)
        )
        .addStringOption(o =>
            o.setName("date")
                .setDescription("Release date")
                .setRequired(true)
        )
        .addStringOption(o =>
        o.setName("banner")
            .setDescription("Banner URL")
        ),

    new SlashCommandBuilder()
        .setName("starthunt")
        .setDescription("Create scavenger hunt")
        .addStringOption(o =>
            o.setName("title").setDescription("Hunt title").setRequired(true)
        )
        .addStringOption(o =>
            o.setName("ugc").setDescription("UGC reward").setRequired(true)
        )
        .addStringOption(o =>
            o.setName("rules").setDescription("Rules").setRequired(true)
        )
        .addStringOption(o =>
            o.setName("start").setDescription("Start date").setRequired(true)
        )
        .addStringOption(o =>
            o.setName("end").setDescription("End date").setRequired(true)
        )
        .addIntegerOption(o =>
            o.setName("copies").setDescription("Copies").setRequired(true)
        )
        .addStringOption(o =>
            o.setName("banner").setDescription("Banner URL")
        ),

    new SlashCommandBuilder()
        .setName("affiliate")
        .setDescription("Post affiliate collaboration")
        .addStringOption(o =>
            o.setName("affiliate").setDescription("Partner").setRequired(true)
        )
        .addStringOption(o =>
            o.setName("link").setDescription("Link").setRequired(true)
        )
        .addStringOption(o =>
            o.setName("banner").setDescription("Banner URL")
        )
].map(c => c.toJSON());

const rest = new REST({ version: "10" }).setToken(TOKEN);

(async () => {
    await rest.put(
        Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
        { body: commands }
    );
})();

/* ================= READY ================= */

client.once("ready", () => {
    console.log("Bot ready");
    require("./scheduler")(client);
});

/* ================= COMMAND HANDLER ================= */

client.on("interactionCreate", async (i) => {
    if (!i.isChatInputCommand()) return;

    try {
        const isVerify = i.commandName === "verify";

        // SAFE defer (prevents Unknown interaction crash)
        if (!i.deferred && !i.replied) {
            try {
                await i.deferReply({ ephemeral: true });
            } catch (err) {
                console.log("Defer failed:", err.message);
                return;
            }
        }

        if (isVerify) {
            const res = await axios.post(process.env.API_URL + "/api/verify", {
                robloxId: Number(i.options.getString("robloxid")),
                discordId: i.user.id,
                apiKey: process.env.API_KEY
            });
        
            console.log("Verify Response:", res.data);
        
            return i.editReply(res.data.message);
        }

        if (!isStaff(i.member) && i.commandName !== "verify") {
            return i.editReply("Staff only.");
        }

        if (i.commandName === "preparecollection") {
            await FashionRelease.create({
                title: i.options.getString("title"),
                releaseDate: estToUTC(i.options.getString("date")),
                format: i.options.getString("format"),
                previewUrl: i.options.getString("preview") || "",
                bannerUrl: i.options.getString("banner") || ""
            });

            return i.editReply("Fashion scheduled.");
        }

        if (i.commandName === "paidlimited") {
            await PaidLimited.create({
                itemName: i.options.getString("item"),
                price: i.options.getString("price"),
                copies: i.options.getInteger("copies"),
                releaseDate: estToUTC(i.options.getString("date")),
                bannerUrl: i.options.getString("banner") || "",
                active: true,
                announced: false
            });

            return i.editReply("Paid Limited scheduled.");
        }

        if (i.commandName === "starthunt") {
            await ScavengerHunt.create({
                title: i.options.getString("title"),
                ugcName: i.options.getString("ugc"),
                rules: i.options.getString("rules"),
                startDate: estToUTC(i.options.getString("start")),
                endDate: estToUTC(i.options.getString("end")),
                copies: i.options.getInteger("copies"),
                remainingCopies: i.options.getInteger("copies"),
                bannerUrl: i.options.getString("banner") || "",
                active: true
            });

            return i.editReply("Hunt scheduled.");
        }

        if (i.commandName === "affiliate") {
            const channel = await client.channels.fetch(process.env.AFFILIATE_CHANNEL_ID);

            await channel.send({
                content: `<@&${process.env.AFFILIATE_ROLE_ID}>`,
                embeds: [{
                    title: `COLLAB DROP — AVRENZI x ${i.options.getString("affiliate")}`,
                    description: "A new collaboration has arrived.",
                    color: 0x9B59B6,
                    fields: [
                        {
                            name: "Partner",
                            value: i.options.getString("affiliate"),
                            inline: true
                        },
                        {
                            name: "Access",
                            value: `[Click Here](${i.options.getString("link")})`
                        }
                    ],
                    image: i.options.getString("banner")
                        ? { url: i.options.getString("banner") }
                        : undefined,
                    footer: { text: "Avrenzi Collaboration Network" },
                    timestamp: new Date()
                }]
            });

            return i.editReply("Affiliate posted.");
        }

    } catch (err) {
        console.error("Interaction error:", err);

        try {
            if (i.deferred || i.replied) {
                return i.editReply("Error occurred.");
            }
        } catch {}

        return;
    }
});

/* ================= START ================= */

(async () => {
    await connectDB();
    client.login(TOKEN);
})();
