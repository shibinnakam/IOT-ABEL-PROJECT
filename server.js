// server.js
require("dotenv").config();
const express = require("express");
const path = require("path");
const cors = require("cors");
const mongoose = require("mongoose");

const app = express();
const PORT = process.env.PORT || 3000;

// ====== MongoDB Connection ======
mongoose
  .connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("✅ MongoDB Atlas connected"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// ====== MongoDB Schema ======
const imageSchema = new mongoose.Schema({
  data: Buffer,
  contentType: String,
  createdAt: { type: Date, default: Date.now },
});
const Image = mongoose.model("Image", imageSchema);

// ====== Middleware ======
app.use(cors());
app.use(express.static(path.join(__dirname, "public")));

// ====== Upload Route ======
// Accept raw JPEG from ESP32-CAM
app.post("/upload", express.raw({ type: "image/jpeg", limit: "5mb" }), async (req, res) => {
  try {
    if (!req.body || !req.body.length) {
      return res.status(400).send("No image data received");
    }

    // Save image to MongoDB
    const newImage = new Image({
      data: req.body,
      contentType: "image/jpeg",
    });
    await newImage.save();

    console.log(`✅ Image saved to MongoDB (${req.body.length} bytes)`);
    res.status(200).send("OK");
  } catch (err) {
    console.error("❌ Upload error:", err);
    res.status(500).send("Internal Server Error");
  }
});

// ====== Route to Get Latest Image ======
app.get("/latest", async (req, res) => {
  try {
    const latest = await Image.findOne().sort({ createdAt: -1 });
    if (!latest) return res.status(404).send("No image found");
    res.set("Content-Type", latest.contentType);
    res.send(latest.data);
  } catch (err) {
    console.error("❌ Error fetching latest image:", err);
    res.status(500).send("Internal Server Error");
  }
});

// ====== Serve Main Page ======
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ====== Start Server ======
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
