const express = require("express");
const formidable = require("express-formidable");
const mongoose = require("mongoose");
const cloudinary = require("cloudinary").v2;

require("dotenv").config();
const cors = require("cors");

const app = express();

//{ multiples: true } il faut cette option pour permettre l'upload de plusieurs fichiers
app.use(formidable({ multiples: true }));
app.use(cors());

mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
});

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const userRoutes = require("./routes/user");
app.use(userRoutes);
const offerRoutes = require("./routes/offer");
app.use(offerRoutes);

app.get("/", (req, res) => {
    res.status(200).json({ message: "Welcome to Vinted API 😎" });
});
app.all("*", (req, res) => {
    res.status(404).json({ message: "Route not found" });
});
app.listen(process.env.PORT, () => {
    console.log("Server started");
});
