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
                        description:
                            "New curated Avrenzi fashion pieces are now available in the Homestore.",
                        color: COLORS.purple,
                        fields: [
                            {
                                name: "📦 Title",
                                value: f.title
                            },
                            {
                                name: "🛍 Status",
                                value: "Now Available"
                            }
                        ],
                        footer: {
                            text: "Avrenzi Fashion Division"
                        },
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
                        title: `${EMOJI.premium} LIMITED UGC RELEASE`,
                        description:
                            "A rare paid limited item is now available in the Avrenzi Homestore.",
                        color: COLORS.yellow,
                        fields: [
                            {
                                name: "🎽 Item",
                                value: p.itemName
                            },
                            {
                                name: "⚠ Availability",
                                value: "Limited Stock"
                            }
                        ],
                        footer: {
                            text: "Avrenzi Exclusive Drop"
                        },
                        timestamp: new Date()
                    }]
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
                        content: `<@&${process.env.EVENTS_ROLE_ID}>`,
                        embeds: [{
                            title: `${EMOJI.premium} UPCOMING SCAVENGER HUNT`,
                            description:
                                "A new Avrenzi Hunt is scheduled at the Homestore.",
                            color: COLORS.blue,
                            footer: {
                                text: "Avrenzi Events"
                            },
                            timestamp: new Date()
                        }]
                    });

                    h.sent72Hour = true;
                }

                if (!h.sent24Hour && diff <= d24 && diff > 0) {
                    await huntChannel.send({
                        content: `<@&${process.env.EVENTS_ROLE_ID}>`,
                        embeds: [{
                            title: `${EMOJI.premium} HUNT STARTING SOON`,
                            description:
                                "The Avrenzi Scavenger Hunt begins soon.",
                            color: COLORS.yellow,
                            footer: {
                                text: "Prepare now"
                            },
                            timestamp: new Date()
                        }]
                    });

                    h.sent24Hour = true;
                }

                if (!h.liveSent && h.startDate <= now && h.endDate > now) {
                    await huntChannel.send({
                        content: `<@&${process.env.EVENTS_ROLE_ID}>`,
                        embeds: [{
                            title: `${EMOJI.premium} SCAVENGER HUNT LIVE`,
                            description:
                                "The hunt is now active at Avrenzi Homestore.",
                            color: COLORS.green,
                            fields: [
                                {
                                    name: "🎁 Reward",
                                    value: h.ugcName
                                },
                                {
                                    name: "📍 Location",
                                    value: "Avrenzi Homestore"
                                }
                            ],
                            footer: {
                                text: "Good luck!"
                            },
                            timestamp: new Date()
                        }]
                    });

                    h.liveSent = true;
                }

                if (!h.endSent && h.endDate <= now) {
                    await huntChannel.send({
                        content: `<@&${process.env.EVENTS_ROLE_ID}>`,
                        embeds: [{
                            title: `${EMOJI.premium} HUNT ENDED`,
                            description:
                                "The Avrenzi Scavenger Hunt has ended.",
                            color: COLORS.red,
                            footer: {
                                text: "Event Closed"
                            },
                            timestamp: new Date()
                        }]
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
