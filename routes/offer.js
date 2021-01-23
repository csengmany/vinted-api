const express = require("express");
const router = express.Router();
const cloudinary = require("cloudinary").v2;
const isAuthenticated = require("../middlewares/isAuthenticated");
const mongoose = require("mongoose");

const User = require("../models/User");
const Offer = require("../models/Offer");

router.post("/offer/publish", isAuthenticated, async (req, res) => {
    try {
        const {
            title,
            description,
            price,
            size,
            brand,
            condition,
            city,
            color,
        } = req.fields;
        //Créer une nouvelle annonce
        const newOffer = new Offer({
            product_name: title,
            product_description: description,
            product_price: price,
            product_details: [
                {
                    MARQUE: brand,
                },
                {
                    TAILLE: size,
                },
                {
                    ÉTAT: condition,
                },
                {
                    COULEUR: color,
                },
                {
                    EMPLACEMENT: city,
                },
            ],
            owner: req.user,
        });
        //Ajouter une image à l'annonce et l'envoyer à cloudinary
        if (req.files.picture) {
            const result = await cloudinary.uploader.upload(
                req.files.picture.path,
                { folder: `/vinted/offers/${newOffer._id}` }
            );
            newOffer.product_image = result;
        }

        await newOffer.save();

        res.status(200).json({
            _id: newOffer._id,
            product_name: newOffer.product_name,
            product_description: newOffer.product_description,
            product_price: newOffer.product_price,
            product_details: newOffer.product_details,
            owner: {
                account: {
                    username: newOffer.owner.account.username,
                    phone: newOffer.owner.account.phone,
                    avatar: {
                        secrure_url: newOffer.owner.account.avatar.secure_url,
                        original_filename:
                            newOffer.owner.account.avatar.original_filename,
                    },
                },
                _id: newOffer.owner._id,
            },
            product_image: {
                secure_url: newOffer.product_image.secure_url,
            },
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

router.get("/offers", async (req, res) => {
    try {
        const { title, priceMin, priceMax, sort } = req.query;

        const filters = {};

        // si on cherche un nom de produit
        if (title) {
            filters.product_name = new RegExp(title, "i");
        }
        //si on filtre le prix
        if (priceMin) {
            filters.product_price = { $gte: Number(priceMin) };
        }
        if (priceMax) {
            if (filters.product_price) {
                filters.product_price.$lte = Number(priceMax);
            } else {
                filters.product_price = { $lte: Number(priceMax) };
            }
        }
        // si on veux odonner les produits en fonciton du prix
        let howToSort = {};
        if (sort) {
            howToSort = { product_price: sort.replace("price-", "") };
        }
        // Renvoie le nombre de résultats trouvés en fonction des filters

        const count = await Offer.countDocuments(filters);
        let limit = Number(req.query.limit);

        // numero de page par défaut et limite de produit par page
        let page;
        // forcer à afficher la page 1 si la query page n'est pas envoyée ou est envoyée avec 0 ou < -1
        if (req.query.page < 1) {
            page = 1;
        } else if (req.query.page > Math.round(count / limit)) {
            page = Math.round(count / limit);
        } else {
            // sinon, page est égale à ce qui est demandé
            page = Number(req.query.page);
        }

        const offers = await Offer.find(filters)
            .select(
                //"product_name product_price"
                "product_details _id product_name product_description product_price product_image.secure_url owner"
            )
            .populate(
                "owner",
                "account.username account.phone account.avatar.secure_url account.avatar.original_filename"
            )
            .sort(howToSort)
            .skip((page - 1) * limit)
            .limit(Number(limit));

        res.json({ count: count, offers: offers });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

router.get("/offer/:_id", async (req, res) => {
    try {
        if (mongoose.Types.ObjectId.isValid(req.params._id)) {
            const offer = await Offer.findById(req.params)
                .select(
                    "product_details _id product_name product_description product_price product_image.secure_url owner"
                )
                .populate(
                    "owner",
                    "account.username account.phone account.avatar.secure_url account.avatar.original_filename"
                );
            if (offer) {
                res.status(200).json(offer);
            } else {
                res.status(401).json({
                    message: "No offers found for this id",
                });
            }
        } else {
            res.status(404).json({
                message: "Not found",
            });
        }
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});
module.exports = router;
