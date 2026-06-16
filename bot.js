require("dotenv").config();

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
    return member.roles.cache.has(STAFF_ROLE_ID);
}

const commands = [

    new SlashCommandBuilder()
        .setName("verify")
        .setDescription("Link Roblox account")
        .addStringOption(o =>
            o.setName("robloxid").setRequired(true)
        ),

    new SlashCommandBuilder()
        .setName("preparecollection")
        .setDescription("Schedule fashion release")
        .addStringOption(o => o.setName("title").setRequired(true))
        .addStringOption(o => o.setName("date").setRequired(true))
        .addStringOption(o => o.setName("format").setRequired(true))
        .addStringOption(o => o.setName("preview").setRequired(false)),

    new SlashCommandBuilder()
        .setName("starthunt")
        .setDescription("Create scavenger hunt")
        .addStringOption(o => o.setName("title").setRequired(true))
        .addStringOption(o => o.setName("ugc").setRequired(true))
        .addStringOption(o => o.setName("rules").setRequired(true))
        .addStringOption(o => o.setName("start").setRequired(true))
        .addStringOption(o => o.setName("end").setRequired(true)),

    new SlashCommandBuilder()
        .setName("editcollection")
        .setDescription("Edit scheduled event")
        .addStringOption(o => o.setName("type").setRequired(true))
        .addStringOption(o => o.setName("id").setRequired(true))
        .addStringOption(o => o.setName("title"))
        .addStringOption(o => o.setName("date"))
        .addStringOption(o => o.setName("format"))
        .addStringOption(o => o.setName("preview")),

    new SlashCommandBuilder()
        .setName("cancelrelease")
        .setDescription("Cancel scheduled event")
        .addStringOption(o => o.setName("type").setRequired(true))
        .addStringOption(o => o.setName("id").setRequired(true))

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
});

client.on("interactionCreate", async (i) => {
    if (!i.isChatInputCommand()) return;

    if (i.commandName === "verify") {
        const robloxId = i.options.getString("robloxid");

        try {
            const res = await axios.post(process.env.API_URL + "/api/verify", {
                robloxId: Number(robloxId),
                discordId: i.user.id,
                apiKey: process.env.API_KEY
            });

            if (res.data.success) {
                return i.reply({
                    content: "Verified successfully!",
                    ephemeral: true
                });
            }

            return i.reply({
                content: res.data.message || "Verification failed.",
                ephemeral: true
            });

        } catch (err) {
            console.error(err);

            return i.reply({
                content: "Server error during verification.",
                ephemeral: true
            });
        }
    }

    if (!isStaff(i.member) && i.commandName !== "verify") {
        return i.reply({ content: "Staff only.", ephemeral: true });
    }

    if (i.commandName === "preparecollection") {
        const title = i.options.getString("title");
        const date = estToUTC(i.options.getString("date"));
        const format = i.options.getString("format");
        const preview = i.options.getString("preview") || "";

        await FashionRelease.create({
            title,
            releaseDate: date,
            format,
            previewUrl: preview
        });

        return i.reply({ content: "Fashion scheduled.", ephemeral: true });
    }

    if (i.commandName === "starthunt") {
        const title = i.options.getString("title");
        const ugc = i.options.getString("ugc");
        const rules = i.options.getString("rules");

        const start = estToUTC(i.options.getString("start"));
        const end = estToUTC(i.options.getString("end"));

        await ScavengerHunt.create({
            title,
            ugcName: ugc,
            rules,
            startDate: start,
            endDate: end
        });

        return i.reply({ content: "Hunt scheduled.", ephemeral: true });
    }

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

    // EDIT
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

        const title = i.options.getString("title");
        const date = i.options.getString("date");
        const format = i.options.getString("format");
        const preview = i.options.getString("preview");

        if (title) event.title = title;
        if (date) event.releaseDate = new Date(date);
        if (format && event.format !== undefined) event.format = format;
        if (preview !== null && event.previewUrl !== undefined) event.previewUrl = preview;

        await event.save();

        return i.reply({ content: "Updated.", ephemeral: true });
    }
});

client.login(TOKEN);
