const express = require("express");
const router = express.Router();
const uid2 = require("uid2");
const SHA256 = require("crypto-js/sha256");
const encBase64 = require("crypto-js/enc-base64");
const cloudinary = require("cloudinary").v2;

const User = require("../models/User");
const Offer = require("../models/Offer");

router.post("/user/signup", async (req, res) => {
    try {
        //est-ce que je reçois tout ce qu'il faut ? (email, username, password)
        if (
            req.fields.email &&
            req.fields.username &&
            req.fields.password
            // &&
            // req.fields.phone
        ) {
            // Rechercher dans la BDD si un user possède déjà cet email
            const user = await User.findOne({ email: req.fields.email });
            //Si l'email n'existe pas dans la BDD
            if (!user) {
                const username = await User.findOne({
                    "account.username": new RegExp(
                        `${req.fields.username}`,
                        "i"
                    ),
                });

                //Si username n'existe pas dans la BDD
                if (!username) {
                    //étape 1 : encrypter le mdp donc generate: salt hash  token
                    const salt = uid2(64);
                    const hash = SHA256(req.fields.password + salt).toString(
                        encBase64
                    );
                    const token = uid2(64);
                    // étape 2 : créer le nouvel utilisateur sur la base du model User
                    const newUser = new User({
                        email: req.fields.email,
                        account: {
                            username: req.fields.username,
                            phone: req.fields.phone,
                            // avatar: req.files.avatar.path,
                        },
                        token: token,
                        hash: hash,
                        salt: salt,
                    });
                    // Ajouter un avatar
                    // const result = await cloudinary.uploader.upload(
                    //     newUser.account.avatar,
                    //     {
                    //         folder: `/vinted/user/"${newUser._id}`,
                    //     }
                    // );
                    // newUser.account.avatar = result;

                    // étape 3 :sauvegarder l'utilisateur
                    await newUser.save();

                    //étape 4 répondre au client
                    res.status(200).json({
                        message: "You are registered ✅",
                        _id: newUser._id,
                        token: newUser.token,
                        account: {
                            username: newUser.account.username,
                            phone: newUser.account.phone,
                            // avatar: {
                            //     secure_url: newUser.account.avatar.secure_url,
                            //     original_filename:
                            //         newUser.account.avatar.original_filename,
                            // },
                        },
                    });
                } else {
                    res.status(400).json({
                        message: "Change username, it is already used ⚠️",
                    });
                }
            } else {
                res.status(400).json({
                    message: "This email already has an account ⚠️",
                });
            }
        } else {
            res.status(400).json({
                message: "Missing parameters ⚠️",
            });
        }
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

router.post("/user/login", async (req, res) => {
    try {
        //Trouver dans la BDD le user qui veut se connecter
        const user = await User.findOne({ email: req.fields.email });
        if (user) {
            //Est-ce qu'il a bien retré le bon mdp?
            const password = req.fields.password;
            //Générer un nouveau hash avec le password rentré et l'user.salt trouvé en BDD
            const newHash = SHA256(password + user.salt).toString(encBase64);
            //Si ce hash coresspond au hash du user trouvé => ok
            if (newHash === user.hash) {
                res.status(200).json({
                    _id: user._id,
                    token: user.token,
                    account: {
                        username: user.account.username,
                        phone: user.account.phone,
                    },
                });
            } else {
                //Sinon => Erreur
                res.status(401).json({ message: "Unauthorized ⚠️" });
            }
        } else {
            res.status(401).json({ message: "Unauthorized ⚠️" });
        }
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

module.exports = router;
