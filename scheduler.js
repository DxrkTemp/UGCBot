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

        const getBanner = (banner) => {
            if (!banner) return null;
        
            const clean = String(banner).trim();
        
            if (
                clean.length < 10 ||
                !clean.startsWith("http")
            ) return null;
        
            return clean;
        };

    const HUNT_LINK = "https://www.roblox.com/games/12568359319/Avrenzi-Homestore";

    cron.schedule("* * * * *", async () => {
        try {
            const now = new Date();

            const fashionChannel = await client.channels.fetch(process.env.FASHION_CHANNEL_ID).catch(() => null);
            const huntChannel = await client.channels.fetch(process.env.HUNT_CHANNEL_ID).catch(() => null);
            const paidChannel = await client.channels.fetch(process.env.PAID_LIMITED_CHANNEL_ID).catch(() => null);

            if (!huntChannel) return;

            // ================= FASHION =================
            const fashion = await FashionRelease.find({ active: true, announced: false });
            
            for (const f of fashion) {
                if (!fashionChannel || f.releaseDate > now) continue;
            
                const banner = getBanner(
                    f.bannerUrl || f.banner || f.image || f.banner_image
                );
            
                await fashionChannel.send({
                    content: `<@&${process.env.FASHION_ROLE_ID}>`,
                    embeds: [{
                        title: `${EMOJI.premium} BI-WEEKLY AVRENZI COLLECTION`,
                        description:
            `The Avrenzi design team unveils this cycle’s bi-weekly release.
            Explore the newest additions to our catalog and elevate your wardrobe with refined essentials crafted for the season.
            
            Shop the collection now!`,
                        color: COLORS.purple,
            
                        fields: [
                            {
                                name: "Collection",
                                value: `**${f.title}**`,
                                inline: true
                            },
                            {
                                name: "Status",
                                value: "**Now Available**",
                                inline: true
                            },
                            {
                                name: "Store",
                                value: "[Group Store Link](https://www.roblox.com/communities/8638017/Avrenzi#!/store)"
                            }
                        ],
            
                        ...(banner ? { image: { url: banner } } : {}),
            
                        footer: { text: "Design Team" },
                        timestamp: new Date()
                    }]
                });
            
                f.announced = true;
                await f.save();
            }

            // ================= PAID LIMITED =================
            const paid = await PaidLimited.find({ active: true, announced: false });

            for (const p of paid) {
                if (!paidChannel || p.releaseDate > now) continue;

                const banner = getBanner(p.bannerUrl);

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
                                name: "Note",
                                value: "This item will not return once sold out or timer expires."
                            }
                        ],

                        ...(banner ? { image: { url: banner } } : {}), 

                        footer: { text: "Avrenzi Exclusive System" },
                        timestamp: new Date()
                    }]
                });

                p.announced = true;
                await p.save();
            }

            // ================= SCAVENGER HUNT =================
            const hunts = await ScavengerHunt.find({ active: true });

            for (const h of hunts) {

                const diffStart = h.startDate - now;
                const diffEnd = h.endDate - now;

                const d72 = 72 * 60 * 60 * 1000;
                const d24 = 24 * 60 * 60 * 1000;

                const banner = getBanner(h.bannerUrl);

                // ================= UPCOMING =================
                if (!h.sent72Hour && diffStart <= d72 && diffStart > d24) {

                    const embed = {
                        title: `${EMOJI.premium} UPCOMING SCAVENGER HUNT`,
                        description:
`A new **Avrenzi Scavenger Hunt** is scheduled to take place on:

Date: <t:${Math.floor(h.startDate / 1000)}:D>
Time: <t:${Math.floor(h.startDate / 1000)}:t> EST
Location: Avrenzi Homestore

The UGC reward will be revealed at the start of the event.
Stay prepared and ensure you are a member of the Avrenzi group to participate.

More details will be announced soon.`,
                        color: COLORS.blue,
                        timestamp: new Date()
                        
                    };

                    if (banner) embed.image = { url: banner };

                    await huntChannel.send({
                        content: `<@&${process.env.EVENTS_ROLE_ID}>`,
                        embeds: [embed]
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

                    const embed = {
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
                    };

                    if (banner) embed.image = { url: banner };

                    await huntChannel.send({
                        content: `<@&${process.env.EVENTS_ROLE_ID}>`,
                        embeds: [embed]
                    });

                    h.liveSent = true;
                }

                // ================= END =================
                if (!h.endSent && h.endDate <= now) {

                    const embed = {
                        title: `${EMOJI.premium} SCAVENGER HUNT — EVENT ENDED`,
                        description:
`The **Avrenzi Scavenger Hunt** has officially concluded.

Reward: **${h.ugcName}**

Thank you for participating.`,
                        color: COLORS.red,
                        timestamp: new Date()
                    };

                    if (banner) embed.image = { url: banner };

                    await huntChannel.send({
                        content: `<@&${process.env.EVENTS_ROLE_ID}>`,
                        embeds: [embed]
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
