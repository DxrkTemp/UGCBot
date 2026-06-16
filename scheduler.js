const cron = require("node-cron");

const {
    FashionRelease,
    ScavengerHunt,
    PaidLimited
} = require("./db");

module.exports = (client) => {

    cron.schedule("* * * * *", async () => {
        const now = new Date();

        const fashionChannel = client.channels.cache.get(process.env.FASHION_CHANNEL_ID);
        const huntChannel = client.channels.cache.get(process.env.HUNT_CHANNEL_ID);
        const paidChannel = client.channels.cache.get(process.env.PAID_LIMITED_CHANNEL_ID);

        const fashion = await FashionRelease.find({ active: true, announced: false });

        for (const f of fashion) {
            if (f.releaseDate <= now && fashionChannel) {
                await fashionChannel.send(`👕 **${f.title} is now live!**`);
                await fashionChannel.send(f.format);
                if (f.previewUrl) await fashionChannel.send(f.previewUrl);

                f.announced = true;
                await f.save();
            }
        }

        const paid = await PaidLimited.find({ active: true, announced: false });

        for (const p of paid) {
            if (p.releaseDate <= now && paidChannel) {
                await paidChannel.send(`💰 **Paid Limited:** ${p.itemName}`);
                p.announced = true;
                await p.save();
            }
        }

        const hunts = await ScavengerHunt.find({ active: true });

        for (const h of hunts) {

            if (!huntChannel) continue;

            const diff = h.startDate - now;

            const d72 = 72 * 3600000;
            const d24 = 24 * 3600000;

            if (!h.sent72Hour && diff <= d72) {
                await huntChannel.send(`📢 72h: **${h.title}**`);
                h.sent72Hour = true;
            }

            if (!h.sent24Hour && diff <= d24) {
                await huntChannel.send(`⏳ 24h: **${h.title}**`);
                h.sent24Hour = true;
            }

            if (!h.liveSent && h.startDate <= now && h.endDate > now) {
                await huntChannel.send(`🔥 LIVE: **${h.title}**`);
                h.liveSent = true;
            }

            if (!h.endSent && h.endDate <= now) {
                await huntChannel.send(`⛔ ENDED: **${h.title}**`);
                h.endSent = true;
            }

            await h.save();
        }
    });
};