const cron = require("node-cron");

const {
    FashionRelease,
    ScavengerHunt,
    PaidLimited
} = require("./db");

module.exports = (client) => {

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

                await fashionChannel.send(
`:premium: BI-WEEKLY AVRENZI COLLECTION

The Avrenzi design team unveils this cycle’s bi-weekly release.
Explore the newest additions to our catalog and elevate your wardrobe with refined essentials crafted for the season.

**Title:** ${f.title}

Shop the collection now!
Group Store Link

username
Design Team
@unknown-role`
                );

                f.announced = true;
                await f.save();
            }

            const paid = await PaidLimited.find({ active: true, announced: false });

            for (const p of paid) {
                if (!paidChannel) continue;
                if (p.releaseDate > now) continue;

                await paidChannel.send(
`:premium: AVRENZI EXCLUSIVE RELEASE — ${p.itemName}

"Luxury in Motion, Style in Devotion"

An exclusive Avrenzi paid-limited item is now available.

Item: ${p.itemName}

This item will not return once all copies are sold or the timer expires.

Claim the exclusive limited here:
🔗 [Paid-Limited UGC]

username
The Avrenzi Team
@unknown-role`
                );

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
                    await huntChannel.send(
`:premium: UPCOMING SCAVENGER HUNT

A new Avrenzi Scavenger Hunt is scheduled.

Stay prepared and ensure you are a member of the Avrenzi group to participate.

username
Public Relations Department
@unknown-role`
                    );

                    h.sent72Hour = true;
                }

                if (!h.sent24Hour && diff <= d24 && diff > 0) {
                    await huntChannel.send(
`:premium: SCAVENGER HUNT — SOON

The Avrenzi Scavenger Hunt begins soon at the Avrenzi Homestore.

Be ready.

username
Public Relations Department
@unknown-role`
                    );

                    h.sent24Hour = true;
                }

                if (!h.liveSent && h.startDate <= now && h.endDate > now) {
                    await huntChannel.send(
`:premium: SCAVENGER HUNT — LIVE NOW

The Avrenzi Scavenger Hunt is now active at the Avrenzi Homestore.

Reward: ${h.ugcName}
Location: Avrenzi Homestore

Begin your hunt now!
https://www.roblox.com/games/12568359319/Avrenzi-Homestore

username
Public Relations Department
@unknown-role`
                    );

                    h.liveSent = true;
                }

                if (!h.endSent && h.endDate <= now) {
                    await huntChannel.send(
`:premium: SCAVENGER HUNT — EVENT ENDED

The Avrenzi Scavenger Hunt has officially concluded.

Reward: ${h.ugcName}

Thank you for participating.

username
Public Relations Department
@unknown-role`
                    );

                    h.endSent = true;
                }

                await h.save();
            }

        } catch (err) {
            console.error(err);
        }
    });
};
