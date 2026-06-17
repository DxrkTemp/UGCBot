const cron = require("node-cron");

const {
    FashionRelease,
    ScavengerHunt,
    PaidLimited
} = require("./db");

const { EmbedBuilder } = require("discord.js");

module.exports = (client) => {

    cron.schedule("* * * * *", async () => {
        try {
            console.log("Scheduler tick:", new Date().toISOString());

            const now = new Date();

            const fashionChannel = await client.channels.fetch(process.env.FASHION_CHANNEL_ID).catch(() => null);
            const huntChannel = await client.channels.fetch(process.env.HUNT_CHANNEL_ID).catch(() => null);
            const paidChannel = await client.channels.fetch(process.env.PAID_LIMITED_CHANNEL_ID).catch(() => null);

            const fashion = await FashionRelease.find({ active: true, announced: false });

            for (const f of fashion) {
                if (!fashionChannel) continue;

                if (f.releaseDate <= now) {
                    const embed = new EmbedBuilder()
                        .setTitle(f.title)
                        .setDescription("👕 Fashion Release is now LIVE!")
                        .setColor(0x00AEFF)
                        .setTimestamp();

                    await fashionChannel.send({ embeds: [embed] });

                    if (f.format) await fashionChannel.send(f.format);
                    if (f.previewUrl) await fashionChannel.send(f.previewUrl);

                    f.announced = true;
                    await f.save();
                }
            }

            const paid = await PaidLimited.find({ active: true, announced: false });

            for (const p of paid) {
                if (!paidChannel) continue;

                if (p.releaseDate <= now) {
                    const embed = new EmbedBuilder()
                        .setTitle(p.itemName)
                        .setDescription("💰 Paid Limited is now LIVE!")
                        .setColor(0xFFD700)
                        .setTimestamp();

                    await paidChannel.send({ embeds: [embed] });

                    p.announced = true;
                    await p.save();
                }
            }

            const hunts = await ScavengerHunt.find({ active: true });

            for (const h of hunts) {
                if (!huntChannel) continue;

                const diff = h.startDate - now;

                const d72 = 72 * 60 * 60 * 1000;
                const d24 = 24 * 60 * 60 * 1000;

                const baseEmbed = new EmbedBuilder()
                    .setTitle(h.title)
                    .setColor(0xFF4D4D)
                    .setTimestamp();

                if (!h.sent72Hour && diff <= d72 && diff > d24) {
                    await huntChannel.send({
                        embeds: [
                            baseEmbed.setDescription("📢 72 HOURS REMAINING")
                        ]
                    });

                    h.sent72Hour = true;
                }

                if (!h.sent24Hour && diff <= d24 && diff > 0) {
                    await huntChannel.send({
                        embeds: [
                            baseEmbed.setDescription("⏳ 24 HOURS REMAINING")
                        ]
                    });

                    h.sent24Hour = true;
                }

                if (!h.liveSent && h.startDate <= now && h.endDate > now) {
                    await huntChannel.send({
                        embeds: [
                            baseEmbed.setDescription("🔥 NOW LIVE")
                        ]
                    });

                    h.liveSent = true;
                }

                if (!h.endSent && h.endDate <= now) {
                    await huntChannel.send({
                        embeds: [
                            baseEmbed.setDescription("⛔ EVENT ENDED")
                        ]
                    });

                    h.endSent = true;
                }

                await h.save();
            }

        } catch (err) {
            console.error("Scheduler Error:", err);
        }
    });
};
