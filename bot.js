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
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers]
});

const TOKEN = process.env.DISCORD_BOT_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;

function isStaff(member) {
    return member?.roles?.cache?.has(process.env.STAFF_ROLE_ID);
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
            o.setName("title").setDescription("Title").setRequired(true)
        )
        .addStringOption(o =>
            o.setName("date").setDescription("Date").setRequired(true)
        )
        .addStringOption(o =>
            o.setName("format").setDescription("Format").setRequired(true)
        )
        .addStringOption(o =>
            o.setName("preview").setDescription("Preview URL")
        ),

    new SlashCommandBuilder()
        .setName("starthunt")
        .setDescription("Create scavenger hunt")
        .addStringOption(o =>
            o.setName("title").setDescription("Title").setRequired(true)
        )
        .addStringOption(o =>
            o.setName("ugc").setDescription("UGC").setRequired(true)
        )
        .addStringOption(o =>
            o.setName("rules").setDescription("Rules").setRequired(true)
        )
        .addStringOption(o =>
            o.setName("start").setDescription("Start date").setRequired(true)
        )
        .addStringOption(o =>
            o.setName("end").setDescription("End date").setRequired(true)
        ),

    new SlashCommandBuilder()
        .setName("editcollection")
        .setDescription("Edit scheduled event")
        .addStringOption(o =>
            o.setName("type").setDescription("type").setRequired(true)
        )
        .addStringOption(o =>
            o.setName("id").setDescription("id").setRequired(true)
        )
        .addStringOption(o =>
            o.setName("title").setDescription("title")
        )
        .addStringOption(o =>
            o.setName("date").setDescription("date")
        )
        .addStringOption(o =>
            o.setName("format").setDescription("format")
        )
        .addStringOption(o =>
            o.setName("preview").setDescription("preview")
        ),

    new SlashCommandBuilder()
        .setName("cancelrelease")
        .setDescription("Cancel scheduled event")
        .addStringOption(o =>
            o.setName("type").setDescription("type").setRequired(true)
        )
        .addStringOption(o =>
            o.setName("id").setDescription("id").setRequired(true)
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

            return i.reply({
                content: res.data.success
                    ? "Verified successfully!"
                    : (res.data.message || "Verification failed."),
                ephemeral: true
            });

        } catch {
            return i.reply({
                content: "Server error during verification.",
                ephemeral: true
            });
        }
    }

    const member = await i.guild.members.fetch(i.user.id);

    if (i.commandName !== "verify" && !isStaff(member)) {
        return i.reply({ content: "Staff only.", ephemeral: true });
    }

    if (i.commandName === "preparecollection") {
        const title = i.options.getString("title");
        const date = estToUTC(i.options.getString("date"));
        const format = i.options.getString("format");
        const preview = i.options.getString("preview") || "";

        await FashionRelease.create({ title, releaseDate: date, format, previewUrl: preview });

        return i.reply({ content: "Fashion scheduled.", ephemeral: true });
    }

    if (i.commandName === "starthunt") {
        const title = i.options.getString("title");
        const ugc = i.options.getString("ugc");
        const rules = i.options.getString("rules");

        const start = estToUTC(i.options.getString("start"));
        const end = estToUTC(i.options.getString("end"));

        await ScavengerHunt.create({ title, ugcName: ugc, rules, startDate: start, endDate: end });

        return i.reply({ content: "Hunt scheduled.", ephemeral: true });
    }

    if (i.commandName === "cancelrelease") {
        const type = i.options.getString("type");
        const id = i.options.getString("id");

        const Model =
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

        const Model =
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
