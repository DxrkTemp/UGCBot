const cron = require("node-cron");

const {
    FashionRelease,
    ScavengerHunt,
    PaidLimited,
    Affiliate
} = require("./db");

const { EmbedBuilder } = require("discord.js");

module.exports = (client) => {

    cron.schedule("* * * * *", async () => {
        try {

            const now = new Date();

            const fashionChannel = await client.channels.fetch(process.env.FASHION_CHANNEL_ID).catch(() => null);
            const huntChannel = await client.channels.fetch(process.env.HUNT_CHANNEL_ID).catch(() => null);
            const paidChannel = await client.channels.fetch(process.env.PAID_LIMITED_CHANNEL_ID).catch(() => null);

            const affiliateChannel = await client.channels.fetch(process.env.AFFILIATE_CHANNEL_ID).catch(() => null);

            const fashion = await FashionRelease.find({ active: true, announced: false });

            for (const f of fashion) {
                if (!fashionChannel) continue;
                if (f.releaseDate > now) continue;

                const embed = new EmbedBuilder()
                    .setTitle("👕 BI-WEEKLY AVRENZI COLLECTION")
                    .setDescription(
                        `The Avrenzi design team unveils this cycle’s bi-weekly release.\n\n` +
                        `Explore the newest additions to our catalog.\n\n` +
                        `**Title:** ${f.title}\n\nShop the collection now!`
                    )
                    .setColor(0x2ECC71)
                    .setFooter({ text: "Design Team • Avrenzi" })
                    .setTimestamp();

                await fashionChannel.send({ embeds: [embed] });

                f.announced = true;
                await f.save();
            }

            const paid = await PaidLimited.find({ active: true, announced: false });

            for (const p of paid) {
                if (!paidChannel) continue;
                if (p.releaseDate > now) continue;

                const embed = new EmbedBuilder()
                    .setTitle("💰 AVRENZI EXCLUSIVE RELEASE")
                    .setDescription(
                        `An exclusive Avrenzi paid-limited item is now available.\n\n` +
                        `**Item:** ${p.itemName}\n` +
                        `This item will not return once sold out.`
                    )
                    .setColor(0xF1C40F)
                    .setFooter({ text: "The Avrenzi Team" })
                    .setTimestamp();

                await paidChannel.send({ embeds: [embed] });

                p.announced = true;
                await p.save();
            }

            const hunts = await ScavengerHunt.find({ active: true });

            for (const h of hunts) {
                if (!huntChannel) continue;

                const diff = h.startDate - now;

                const d72 = 72 * 60 * 60 * 1000;
                const d24 = 24 * 60 * 60 * 1000;

                const template = (title, desc, color) =>
                    new EmbedBuilder()
                        .setTitle("🎯 SCAVENGER HUNT")
                        .setDescription(desc)
                        .addFields(
                            { name: "Reward", value: h.ugcName || "TBA", inline: true },
                            { name: "Rules", value: h.rules || "None", inline: false },
                            { name: "Location", value: "Avrenzi Homestore", inline: true }
                        )
                        .setColor(color)
                        .setFooter({ text: "Public Relations Department" })
                        .setTimestamp();

                if (!h.sent72Hour && diff <= d72 && diff > d24) {

                    await huntChannel.send({
                        embeds: [
                            template(
                                "UPCOMING",
                                "A new Avrenzi Scavenger Hunt is scheduled.",
                                0x3498DB
                            )
                        ]
                    });

                    h.sent72Hour = true;
                }

                if (!h.sent24Hour && diff <= d24 && diff > 0) {

                    await huntChannel.send({
                        embeds: [
                            template(
                                "UPCOMING SOON",
                                "The scavenger hunt begins soon.",
                                0xF1C40F
                            )
                        ]
                    });

                    h.sent24Hour = true;
                }

                if (!h.liveSent && h.startDate <= now && h.endDate > now) {

                    await huntChannel.send({
                        embeds: [
                            template(
                                "LIVE NOW",
                                `The Avrenzi Scavenger Hunt is now active.\n\nBegin your hunt now!`,
                                0x2ECC71
                            )
                        ]
                    });

                    h.liveSent = true;
                }

                if (!h.endSent && h.endDate <= now) {

                    await huntChannel.send({
                        embeds: [
                            template(
                                "EVENT ENDED",
                                "The scavenger hunt has officially concluded.",
                                0xE74C3C
                            )
                        ]
                    });

                    h.endSent = true;
                }

                await h.save();
            }

            const affiliates = await Affiliate.find({ active: true, announced: false });

            for (const a of affiliates) {
                if (!affiliateChannel) continue;
                if (a.releaseDate > now) continue;

                const embed = new EmbedBuilder()
                    .setTitle(`🤝 AVRENZI x ${a.affiliateName}`)
                    .setDescription(
                        `We are excited to announce our collaboration with **${a.affiliateName}**!\n\n` +
                        `Explore the collaboration now.\n\n` +
                        `**${a.title}**`
                    )
                    .setColor(0x9B59B6)
                    .setFooter({ text: "The Avrenzi Team" })
                    .setTimestamp();

                await affiliateChannel.send({ embeds: [embed] });

                a.announced = true;
                await a.save();
            }

        } catch (err) {
            console.error("Scheduler Error:", err);
        }
    });
};
