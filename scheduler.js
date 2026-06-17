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

    const getBanner = (banner) => {
        if (!banner) return null;

        const clean = String(banner).trim();
        if (!clean.startsWith("http")) return null;

        return clean;
    };

    cron.schedule("* * * * *", async () => {
        try {
            const now = new Date();

            const fashionChannel = await client.channels.fetch(process.env.FASHION_CHANNEL_ID).catch(() => null);
            const huntChannel = await client.channels.fetch(process.env.HUNT_CHANNEL_ID).catch(() => null);
            const paidChannel = await client.channels.fetch(process.env.PAID_LIMITED_CHANNEL_ID).catch(() => null);

            /* ================= FASHION ================= */
            const fashion = await FashionRelease.find({ active: true, announced: false });

            for (const f of fashion) {
                if (!fashionChannel || f.releaseDate > now) continue;

                const banner = getBanner(f.bannerUrl);

                await fashionChannel.send({
                    content: `<@&${process.env.FASHION_ROLE_ID}>`,
                    embeds: [{
                        title: `${EMOJI.collection} BI-WEEKLY AVRENZI COLLECTION`,
                        description: "New seasonal collection is now available.",
                        color: COLORS.purple,
                        fields: [
                            { name: "Collection", value: `**${f.title}**` },
                            { name: "Status", value: "**Now Available**" }
                        ],
                        ...(banner ? { image: { url: banner } } : {}),
                        timestamp: new Date()
                    }]
                });

                f.announced = true;
                await f.save();
            }

            /* ================= PAID LIMITED (FULLY FIXED + BANNER) ================= */
            const paid = await PaidLimited.find({ active: true, announced: false });

            for (const p of paid) {
                if (!paidChannel || p.releaseDate > now) continue;

                const banner = getBanner(p.bannerUrl); // ✅ FIXED HERE

                await paidChannel.send({
                    content: `<@&${process.env.FASHION_ROLE_ID}>`,
                    embeds: [{
                        title: `${EMOJI.premium} AVRENZI EXCLUSIVE RELEASE — ${p.itemName}`,
                        description:
`"Luxury in Motion, Style in Devotion"

An exclusive Avrenzi paid-limited item is now available for a limited time.`,
                        color: COLORS.purple,
                        fields: [
                            { name: "Item", value: `**${p.itemName}**`, inline: true },
                            { name: "Price", value: `**${p.price}**`, inline: true },
                            { name: "Copies", value: `**${p.copies} copies**`, inline: true },
                            { name: "Availability", value: "**Exclusive / Limited Access**" },
                            {
                                name: "Access",
                                value: "🔗 Claim the exclusive limited here",
                                inline: false
                            },
                            {
                                name: "Note",
                                value: "This item will not return once all copies are sold or the timer expires."
                            }
                        ],

                        ...(banner ? { image: { url: banner } } : {}), // ✅ BANNER SUPPORT ADDED

                        footer: { text: "The Avrenzi Team" },
                        timestamp: new Date()
                    }]
                });

                p.announced = true;
                await p.save();
            }

            /* ================= SCAVENGER HUNT (UNCHANGED) ================= */
            const hunts = await ScavengerHunt.find({ active: true });

            for (const h of hunts) {

                const diffStart = h.startDate - now;
                const diffEnd = h.endDate - now;

                const d72 = 72 * 60 * 60 * 1000;
                const d24 = 24 * 60 * 60 * 1000;

                const banner = getBanner(h.bannerUrl);

                if (!h.sent72Hour && diffStart <= d72 && diffStart > d24) {
                    await huntChannel.send({
                        content: `<@&${process.env.EVENTS_ROLE_ID}>`,
                        embeds: [{
                            title: `${EMOJI.premium} UPCOMING SCAVENGER HUNT`,
                            description: "Event announcement coming soon.",
                            color: COLORS.blue,
                            ...(banner ? { image: { url: banner } } : {})
                        }]
                    });

                    h.sent72Hour = true;
                }

                if (!h.sent24Hour && diffStart <= d24 && diffStart > 0) {
                    await huntChannel.send({
                        content: `<@&${process.env.EVENTS_ROLE_ID}>`,
                        embeds: [{
                            title: `${EMOJI.premium} STARTING SOON`,
                            description: "Prepare yourself.",
                            color: COLORS.yellow
                        }]
                    });

                    h.sent24Hour = true;
                }

                if (!h.liveSent && h.startDate <= now && h.endDate > now) {
                    await huntChannel.send({
                        content: `<@&${process.env.EVENTS_ROLE_ID}>`,
                        embeds: [{
                            title: `${EMOJI.premium} LIVE NOW`,
                            description: `Reward: **${h.ugcName}**`,
                            color: COLORS.green
                        }]
                    });

                    h.liveSent = true;
                }

                if (!h.endSent && h.endDate <= now) {
                    await huntChannel.send({
                        content: `<@&${process.env.EVENTS_ROLE_ID}>`,
                        embeds: [{
                            title: `${EMOJI.premium} EVENT ENDED`,
                            description: `Reward: **${h.ugcName}**`,
                            color: COLORS.red
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
