const mongoose = require("mongoose");

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("MongoDB Connected");
    } catch (err) {
        console.error("MongoDB Connection Failed:", err);
        process.exit(1);
    }
};

const UserSchema = new mongoose.Schema({
    robloxId: { type: Number, unique: true, required: true },
    discordId: { type: String, required: true },
    verified: { type: Boolean, default: false },
    claimed: { type: Boolean, default: false }
}, { timestamps: true });

const FashionRelease = require("./models/FashionRelease");
const ScavengerHunt = require("./models/ScavengerHunt");
const PaidLimited = require("./models/PaidLimited");

module.exports = {
    connectDB,
    User: mongoose.model("User", UserSchema),
    FashionRelease,
    ScavengerHunt,
    PaidLimited
};
