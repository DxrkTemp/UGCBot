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

        const totalSeconds = Math.floor(ms / 1000);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);

        return `${hours}h ${minutes}m`;
    };

    const HUNT_LINK = "https://www.roblox.com/games/12568359319/Avrenzi-Homestore";

    cron.schedule("* * * * *", async () => {
        try {
            const now = new Date();

            const fashionChannel = await client.channels.fetch(process.env.FASHION_CHANNEL_ID).catch(() => null);
            const huntChannel = await client.channels.fetch(process.env.HUNT_CHANNEL_ID).catch(() => null);
            const paidChannel = await client.channels.fetch(process.env.PAID_LIMITED_CHANNEL_ID).catch(() => null);

            const fashion = await FashionRelease.find({ active: true, announced: false });

            for (const f of fashion) {
                if (!fashionChannel || f.releaseDate > now) continue;

                await fashionChannel.send({
                    content: `<@&${process.env.FASHION_ROLE_ID}>`,
                    embeds: [{
                        title: `${EMOJI.collection} BI-WEEKLY COLLECTION DROP`,
                        description: "**Avrenzi Homestore Update**",
                        color: COLORS.purple,
                        fields: [
                            { name: "Collection", value: `**${f.title}**`, inline: true },
                            { name: "Status", value: "**Now Available**", inline: true },
                            { name: "Details", value: "New curated fashion pieces have been added to the store." }
                        ],
                        footer: { text: "Avrenzi Fashion Division" },
                        timestamp: new Date()
                    }]
                });

                f.announced = true;
                await f.save();
            }

            const paid = await PaidLimited.find({ active: true, announced: false });

            for (const p of paid) {
                if (!paidChannel || p.releaseDate > now) continue;

                await paidChannel.send({
                    content: `<@&${process.env.FASHION_ROLE_ID}>`,
                    embeds: [{
                        title: `${EMOJI.premium} LIMITED UGC DROP`,
                        description: "**Exclusive Homestore Release**",
                        color: COLORS.yellow,
                        fields: [
                            { name: "Item", value: `**${p.itemName}**`, inline: true },
                            { name: "Stock", value: "**Limited Copies**", inline: true },
                            { name: "Note", value: "This item will not return once sold out." }
                        ],
                        footer: { text: "Avrenzi Exclusive System" },
                        timestamp: new Date()
                    }]
                });

                p.announced = true;
                await p.save();
            }

            const hunts = await ScavengerHunt.find({ active: true });

            for (const h of hunts) {
                if (!huntChannel) continue;

                const diffStart = h.startDate - now;
                const diffEnd = h.endDate - now;

                const d72 = 72 * 60 * 60 * 1000;
                const d24 = 24 * 60 * 60 * 1000;

                if (!h.sent72Hour && diffStart <= d72 && diffStart > d24) {
                    await huntChannel.send({
                        content: `<@&${process.env.EVENTS_ROLE_ID}>`,
                        embeds: [{
                            title: `${EMOJI.premium} UPCOMING SCAVENGER HUNT`,
                            description:
`A new **Avrenzi Scavenger Hunt** is scheduled to take place on:

**Date:** <t:${Math.floor(h.startDate / 1000)}:F>
**Time:** <t:${Math.floor(h.startDate / 1000)}:t> EST
**Location:** Avrenzi Homestore

The UGC reward will be revealed at the start of the event.
Stay prepared and ensure you are a member of the Avrenzi group to participate.

More details will be announced soon.`,
                            color: COLORS.blue,
                            footer: { text: "Avrenzi Event System" },
                            timestamp: new Date()
                        }]
                    });

                    h.sent72Hour = true;
                }

                if (!h.sent24Hour && diffStart <= d24 && diffStart > 0) {
                    await huntChannel.send({
                        content: `<@&${process.env.EVENTS_ROLE_ID}>`,
                        embeds: [{
                            title: `${EMOJI.premium} SCAVENGER HUNT — STARTING SOON`,
                            description:
                                "The **Avrenzi Scavenger Hunt** will begin soon.\n\n" +
                                "Prepare yourself and head to **Avrenzi Homestore**.",
                            color: COLORS.yellow,
                            footer: { text: "Avrenzi Event System" },
                            timestamp: new Date()
                        }]
                    });

                    h.sent24Hour = true;
                }

                if (!h.liveSent && h.startDate <= now && h.endDate > now) {

                    const timeRemaining = formatTimeRemaining(diffEnd);

                    await huntChannel.send({
                        content: `<@&${process.env.EVENTS_ROLE_ID}>`,
                        embeds: [{
                            title: `${EMOJI.premium} SCAVENGER HUNT — LIVE NOW`,
                            description:
`The **Avrenzi Scavenger Hunt** is now active at the **Avrenzi Homestore**.

Begin your hunt now and secure the reward before stock runs out!`,
                            color: COLORS.green,
                            fields: [
                                {
                                    name: "Reward",
                                    value: `**${h.ugcName}**`,
                                    inline: true
                                },
                                {
                                    name: "Copies Available",
                                    value: `**${h.remainingCopies}/${h.copies}**`,
                                    inline: true
                                },
                                {
                                    name: "Time Remaining",
                                    value: `**${timeRemaining}**`,
                                    inline: true
                                },
                                {
                                    name: "Location",
                                    value: "Avrenzi Homestore",
                                    inline: true
                                },
                                {
                                    name: "Rules",
                                    value:
                                        "Exploiting or circumventing the event will result in an immediate blacklist.\n" +
                                        "Only legitimate participants will receive the reward."
                                }
                            ],
                            footer: { text: "Avrenzi Event System • Good luck!" },
                            timestamp: new Date(),
                            url: HUNT_LINK
                        }]
                    });

                    h.liveSent = true;
                }

                if (!h.endSent && h.endDate <= now) {

                    await huntChannel.send({
                        content: `<@&${process.env.EVENTS_ROLE_ID}>`,
                        embeds: [{
                            title: `${EMOJI.premium} SCAVENGER HUNT — EVENT ENDED`,
                            description:
`The **Avrenzi Scavenger Hunt** has officially concluded.

Thank you to everyone who participated.`,
                            color: COLORS.red,
                            fields: [
                                {
                                    name: "Reward",
                                    value: `**${h.ugcName}**`,
                                    inline: true
                                },
                                {
                                    name: "Status",
                                    value: "Further information regarding leftover copies will be announced soon."
                                }
                            ],
                            footer: { text: "Avrenzi Event System" },
                            timestamp: new Date(),
                            url: HUNT_LINK
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
