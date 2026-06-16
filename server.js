require("dotenv").config();
const express = require("express");
const cors = require("cors");

const { connectDB } = require("./db");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api", require("./routes/verify"));
app.use("/api", require("./routes/check"));

app.get("/", (req, res) => {
    res.send("UGC Backend Running");
});

(async () => {
    try {
        await connectDB();
        console.log("MongoDB Connected");

        const PORT = process.env.PORT || 3000;

        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });

    } catch (err) {
        console.error("Startup error:", err);
        process.exit(1);
    }
})();
