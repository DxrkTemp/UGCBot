const mongoose = require("mongoose");

const connectDB = async () => {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB Connected");
};

const UserSchema = new mongoose.Schema({
    robloxId: { type: Number, required: true, unique: true },
    discordId: { type: String, required: true },
    verified: { type: Boolean, default: false },
    claimed: { type: Boolean, default: false }
});

const User = mongoose.model("User", UserSchema);

module.exports = { connectDB, User };