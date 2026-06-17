const cron = require("node-cron");

const {
    FashionRelease,
    ScavengerHunt,
    PaidLimited
} = require("./db");

module.exports = (client) => {

    const EMOJI = {
        hunt: "<:premium:1457551517476327627>",
        collection: "<:customer_av:1456642788568469525>",
        affiliate: "<:Gold_Avrenzi:1469558139119734930>"
    };

    const EVENTS_ROLE = `<@&${process.env.EVENTS_ROLE_ID}>`;
    const FASHION_ROLE = `<@&${process.env.FASHION_ROLE_ID}>`;

    cron.schedule("* * * * *", async () => {
        try {
            const now = new Date();

            const fashionChannel = await client.channels.fetch(process.env.FASHION_CHANNEL_ID).catch(() => null);
            const huntChannel = await client.channels.fetch(process.env.HUNT_CHANNEL_ID).catch(() => null);
            const paidChannel = await client.channels.fetch(process.env.PAID_LIMITED_CHANNEL_ID).catch(() => null);

            const fashion = await FashionRelease.find({ active: true, announced: false });

            for (const f of fashion) {
                if (!fashionChannel) continue;
                if (f.releaseDate > now) continue;

                await fashionChannel.send({
                    content: FASHION_ROLE,
                    embeds: [
                        {
                            title: `${EMOJI.collection} BI-WEEKLY AVRENZI COLLECTION`,
                            description:
                                "The Avrenzi design team unveils this cycle’s bi-weekly release.\n\n" +
                                "Explore the newest additions to our catalog and elevate your wardrobe with refined essentials crafted for the season.\n\n" +
                                `**Title:** ${f.title}\n\nShop the collection now!`,
                            color: 0x2ECC71,
                            footer: { text: "Design Team • Avrenzi" },
                            timestamp: new Date()
                        }
                    ]
                });

                f.announced = true;
                await f.save();
            }

            const paid = await PaidLimited.find({ active: true, announced: false });

            for (const p of paid) {
                if (!paidChannel) continue;
                if (p.releaseDate > now) continue;

                await paidChannel.send({
                    content: FASHION_ROLE,
                    embeds: [
                        {
                            title: `${EMOJI.collection} AVRENZI EXCLUSIVE RELEASE`,
                            description:
                                "Luxury in Motion, Style in Devotion\n\n" +
                                "An exclusive Avrenzi paid-limited item is now available.\n\n" +
                                `**Item:** ${p.itemName}\n\nThis item will not return once sold out.`,
                            color: 0xF1C40F,
                            footer: { text: "The Avrenzi Team" },
                            timestamp: new Date()
                        }
                    ]
                });

                p.announced = true;
                await p.save();
            }

            const hunts = await ScavengerHunt.find({ active: true });

            for (const h of hunts) {
                if (!huntChannel) continue;

                const diff = h.startDate - now;

                const d72 = 72 * 60 * 60 * 1000;
                const d24 = 24 * 60 * 60 * 1000;

                if (!h.sent72Hour && diff <= d72 && diff > d24) {
                    await huntChannel.send({
                        content: EVENTS_ROLE,
                        embeds: [
                            {
                                title: `${EMOJI.hunt} UPCOMING SCAVENGER HUNT`,
                                description:
                                    "A new Avrenzi Scavenger Hunt is scheduled.\n\n" +
                                    "Stay prepared and ensure you are a member of the Avrenzi group to participate.",
                                color: 0x3498DB,
                                footer: { text: "Avrenzi" },
                                timestamp: new Date()
                            }
                        ]
                    });

                    h.sent72Hour = true;
                }

                if (!h.sent24Hour && diff <= d24 && diff > 0) {
                    await huntChannel.send({
                        content: EVENTS_ROLE,
                        embeds: [
                            {
                                title: `${EMOJI.hunt} SCAVENGER HUNT — SOON`,
                                description:
                                    "The Avrenzi Scavenger Hunt begins soon at the Avrenzi Homestore.\n\nBe ready.",
                                color: 0xF1C40F,
                                footer: { text: "Avrenzi" },
                                timestamp: new Date()
                            }
                        ]
                    });

                    h.sent24Hour = true;
                }

                if (!h.liveSent && h.startDate <= now && h.endDate > now) {
                    await huntChannel.send({
                        content: EVENTS_ROLE,
                        embeds: [
                            {
                                title: `${EMOJI.hunt} SCAVENGER HUNT — LIVE NOW`,
                                description:
                                    "The Avrenzi Scavenger Hunt is now active at the Avrenzi Homestore.\n\n" +
                                    `**Reward:** ${h.ugcName}\n` +
                                    `**Location:** Avrenzi Homestore\n\nBegin your hunt now!\n` +
                                    "https://www.roblox.com/games/12568359319/Avrenzi-Homestore",
                                color: 0x2ECC71,
                                footer: { text: "Avrenzi" },
                                timestamp: new Date()
                            }
                        ]
                    });

                    h.liveSent = true;
                }

                if (!h.endSent && h.endDate <= now) {
                    await huntChannel.send({
                        content: EVENTS_ROLE,
                        embeds: [
                            {
                                title: `${EMOJI.hunt} SCAVENGER HUNT — EVENT ENDED`,
                                description:
                                    "The Avrenzi Scavenger Hunt has officially concluded.\n\n" +
                                    `**Reward:** ${h.ugcName}\n\nThank you for participating.`,
                                color: 0xE74C3C,
                                footer: { text: "Avrenzi" },
                                timestamp: new Date()
                            }
                        ]
                    });

                    h.endSent = true;
                }

                await h.save();
            }

        } catch (err) {
            console.error(err);
        }
    });
};
