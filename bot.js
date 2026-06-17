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
        .addStringOption(o => o.setName("title").setDescription("Title").setRequired(true))
        .addStringOption(o => o.setName("date").setDescription("YYYY-MM-DD HH:mm").setRequired(true))
        .addStringOption(o => o.setName("format").setDescription("Format").setRequired(true))
        .addStringOption(o => o.setName("preview").setDescription("Preview URL")),

    new SlashCommandBuilder()
        .setName("starthunt")
        .setDescription("Create scavenger hunt")
        .addStringOption(o => o.setName("title").setDescription("Title").setRequired(true))
        .addStringOption(o => o.setName("ugc").setDescription("UGC item").setRequired(true))
        .addStringOption(o => o.setName("rules").setDescription("Rules").setRequired(true))
        .addStringOption(o => o.setName("start").setDescription("YYYY-MM-DD HH:mm").setRequired(true))
        .addStringOption(o => o.setName("end").setDescription("YYYY-MM-DD HH:mm").setRequired(true)),

    new SlashCommandBuilder()
        .setName("editcollection")
        .setDescription("Edit scheduled event")
        .addStringOption(o => o.setName("type").setDescription("Type").setRequired(true))
        .addStringOption(o => o.setName("id").setDescription("Event ID").setRequired(true))
        .addStringOption(o => o.setName("title").setDescription("Title"))
        .addStringOption(o => o.setName("date").setDescription("YYYY-MM-DD HH:mm"))
        .addStringOption(o => o.setName("format").setDescription("Format"))
        .addStringOption(o => o.setName("preview").setDescription("Preview URL")),

    new SlashCommandBuilder()
        .setName("cancelrelease")
        .setDescription("Cancel scheduled event")
        .addStringOption(o => o.setName("type").setDescription("Type").setRequired(true))
        .addStringOption(o => o.setName("id").setDescription("Event ID").setRequired(true))
].map(c => c.toJSON());

const rest = new REST({ version: "10" }).setToken(TOKEN);

(async () => {
    try {
        await rest.put(
            Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
            { body: commands }
        );
    } catch (err) {
        console.error(err);
    }
})();

client.once("ready", () => {
    console.log("Bot ready");
});

client.on("interactionCreate", async (i) => {
    if (!i.isChatInputCommand()) return;

    if (i.commandName === "verify") {
        try {
            const res = await axios.post(process.env.API_URL + "/api/verify", {
                robloxId: Number(i.options.getString("robloxid")),
                discordId: i.user.id,
                apiKey: process.env.API_KEY
            });

            if (res.data.success) {
                return i.reply({ content: "Verified successfully!", ephemeral: true });
            }

            return i.reply({ content: res.data.message || "Verification failed.", ephemeral: true });

        } catch {
            return i.reply({ content: "Server error during verification.", ephemeral: true });
        }
    }

    if (!isStaff(i.member) && i.commandName !== "verify") {
        return i.reply({ content: "Staff only.", ephemeral: true });
    }

    if (i.commandName === "preparecollection") {
        const date = estToUTC(i.options.getString("date"));

        if (!date) {
            return i.reply({ content: "Invalid date format. Use YYYY-MM-DD HH:mm", ephemeral: true });
        }

        await FashionRelease.create({
            title: i.options.getString("title"),
            releaseDate: date,
            format: i.options.getString("format"),
            previewUrl: i.options.getString("preview") || ""
        });

        return i.reply({ content: "Fashion scheduled.", ephemeral: true });
    }

    if (i.commandName === "starthunt") {
        const start = estToUTC(i.options.getString("start"));
        const end = estToUTC(i.options.getString("end"));

        if (!start || !end) {
            return i.reply({ content: "Invalid date format. Use YYYY-MM-DD HH:mm", ephemeral: true });
        }

        const hunt = await ScavengerHunt.create({
            title,
            ugcName: ugc,
            rules,
            startDate: start,
            endDate: end
        });
        
        return i.reply({
            content: `Hunt scheduled.\nID: ${hunt._id}`,
            ephemeral: true
        });

    if (i.commandName === "cancelrelease") {
        const type = i.options.getString("type");
        const id = i.options.getString("id");

        let Model =
            type === "fashion" ? FashionRelease :
            type === "hunt" ? ScavengerHunt :
            PaidLimited;

        const event = await Model.findById(id);

        if (!event) {
            return i.reply({ content: "Not found.", ephemeral: true });
        }

        event.active = false;
        await event.save();

        return i.reply({ content: "Cancelled.", ephemeral: true });
    }

    if (i.commandName === "editcollection") {
        const type = i.options.getString("type");
        const id = i.options.getString("id");

        let Model =
            type === "fashion" ? FashionRelease :
            type === "hunt" ? ScavengerHunt :
            PaidLimited;

        const event = await Model.findById(id);

        if (!event) {
            return i.reply({ content: "Not found.", ephemeral: true });
        }

        const date = i.options.getString("date");

        if (i.options.getString("title")) event.title = i.options.getString("title");
        if (date) {
            const parsed = estToUTC(date);
            if (!parsed) {
                return i.reply({ content: "Invalid date format. Use YYYY-MM-DD HH:mm", ephemeral: true });
            }
            event.releaseDate = parsed;
        }
        if (i.options.getString("format")) event.format = i.options.getString("format");
        if (i.options.getString("preview") !== undefined) event.previewUrl = i.options.getString("preview");

        await event.save();

        return i.reply({ content: "Updated.", ephemeral: true });
    }
});

(async () => {
    await connectDB();
    client.login(TOKEN);
})();
