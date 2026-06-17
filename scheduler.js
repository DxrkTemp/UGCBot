const cron = require("node-cron");

const {
    FashionRelease,
    ScavengerHunt,
    PaidLimited
} = require("./db");

module.exports = (client) => {

    const EMOJI = {
        premium: "<:premium:1457551517476327627>",
        collection: "<:customer_av:1456642788568469525>",
        gold: "<:Gold_Avrenzi:1469558139119734930>"
    };

    const COLORS = {
        green: 0x2ECC71,
        blue: 0x3498DB,
        yellow: 0xF1C40F,
        red: 0xE74C3C,
        purple: 0x9B59B6
    };

    const formatTimeRemaining = (ms) => {
        if (ms <= 0) return "Ended";
        const h = Math.floor(ms / 3600000);
        const m = Math.floor((ms % 3600000) / 60000);
        return `${h}h ${m}m`;
    };

    const HUNT_LINK = "https://www.roblox.com/games/12568359319/Avrenzi-Homestore";

    cron.schedule("* * * * *", async () => {
        try {
            const now = new Date();

            const huntChannel = await client.channels.fetch(process.env.HUNT_CHANNEL_ID).catch(() => null);

            const hunts = await ScavengerHunt.find({ active: true });

            for (const h of hunts) {
                if (!huntChannel) continue;

                const diffStart = h.startDate - now;
                const diffEnd = h.endDate - now;

                const d72 = 72 * 60 * 60 * 1000;
                const d24 = 24 * 60 * 60 * 1000;

                // ================= UPCOMING =================
                if (!h.sent72Hour && diffStart <= d72 && diffStart > d24) {

                    await huntChannel.send({
                        content: `<@&${process.env.EVENTS_ROLE_ID}>`,
                        embeds: [{
                            title: `${EMOJI.premium} UPCOMING SCAVENGER HUNT`,
                            description:
`A new **Avrenzi Scavenger Hunt** is scheduled to take place on:

Date: <t:${Math.floor(h.startDate / 1000)}:D>
Time: <t:${Math.floor(h.startDate / 1000)}:t> EST
Location: Avrenzi Homestore

The UGC reward will be revealed at the start of the event.
Stay prepared and ensure you are a member of the Avrenzi group to participate. More details will be announced soon.`,
                            color: COLORS.blue,
                            timestamp: new Date()
                        }]
                    });

                    h.sent72Hour = true;
                }

                // ================= STARTING SOON =================
                if (!h.sent24Hour && diffStart <= d24 && diffStart > 0) {

                    await huntChannel.send({
                        content: `<@&${process.env.EVENTS_ROLE_ID}>`,
                        embeds: [{
                            title: `${EMOJI.premium} SCAVENGER HUNT — STARTING SOON`,
                            description:
`The **Avrenzi Scavenger Hunt** will begin soon.

Prepare yourself and head to Avrenzi Homestore.`,
                            color: COLORS.yellow,
                            timestamp: new Date()
                        }]
                    });

                    h.sent24Hour = true;
                }

                // ================= LIVE =================
                if (!h.liveSent && h.startDate <= now && h.endDate > now) {

                    const timeRemaining = formatTimeRemaining(diffEnd);

                    await huntChannel.send({
                        content: `<@&${process.env.EVENTS_ROLE_ID}>`,
                        embeds: [{
                            title: `${EMOJI.premium} SCAVENGER HUNT — LIVE NOW`,
                            description:
`The **Avrenzi Scavenger Hunt** is now active at the Avrenzi Homestore.

Reward: **${h.ugcName}**
Copies Available: **${h.remainingCopies}/${h.copies}**
Time Remaining: **${timeRemaining}**

Exploiting or bypassing will result in a blacklist.

Begin your hunt now!
${HUNT_LINK}`,
                            color: COLORS.green,
                            timestamp: new Date()
                        }]
                    });

                    h.liveSent = true;
                }

                // ================= END =================
                if (!h.endSent && h.endDate <= now) {

                    await huntChannel.send({
                        content: `<@&${process.env.EVENTS_ROLE_ID}>`,
                        embeds: [{
                            title: `${EMOJI.premium} SCAVENGER HUNT — EVENT ENDED`,
                            description:
`The **Avrenzi Scavenger Hunt** has officially concluded.

Reward: **${h.ugcName}**

Thank you for participating.`,
                            color: COLORS.red,
                            timestamp: new Date()
                        }]
                    });

                    h.endSent = true;
                    h.active = false;
                }

                await h.save();
            }

        } catch (err) {
            console.error(err);
        }
    });
};
