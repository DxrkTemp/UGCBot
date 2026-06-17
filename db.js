const mongoose = require("mongoose");

const connectDB = async () => {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB Connected");
};

const UserSchema = new mongoose.Schema({
    robloxId: { type: Number, unique: true, required: true },
    discordId: { type: String, required: true },
    verified: { type: Boolean, default: false },
    claimed: { type: Boolean, default: false }
});

const FashionRelease = require("./models/FashionRelease");
const ScavengerHunt = require("./models/ScavengerHunt");
const PaidLimited = require("./models/PaidLimited");
const Affiliate = require("./models/Affiliate");

module.exports = {
    connectDB,
    User: mongoose.model("User", UserSchema),
    FashionRelease,
    ScavengerHunt,
    PaidLimited,
    Affiliate
};
