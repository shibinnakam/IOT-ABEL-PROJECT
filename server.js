// server.js

const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.static(path.join(__dirname, "public")));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Setup file storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, "latest.jpg"); // always overwrite latest image
  },
});

const upload = multer({ storage });

// Route for image upload from ESP32-CAM
app.post("/upload", express.raw({ type: "image/jpeg", limit: "5mb" }), (req, res) => {
  try {
    fs.writeFileSync("uploads/latest.jpg", req.body);
    res.sendStatus(200);
  } catch (err) {
    console.error("Upload error:", err);
    res.sendStatus(500);
  }
});

// Serve main page
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Start the server
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
