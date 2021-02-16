const express = require("express");
const router = express.Router();
const cloudinary = require("cloudinary").v2;
const isAuthenticated = require("../middlewares/isAuthenticated");
const mongoose = require("mongoose");

const User = require("../models/User");
const Offer = require("../models/Offer");

// Route qui nous permet de poster une nouvelle annonce
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
        if (title.length > 50) {
            res.status(400).json({
                message: "Your title must be shorter",
            });
        } else if (description.length > 500) {
            res.status(400).json({
                message: "Your description must be shorter",
            });
        } else if (Number(price) > 100000) {
            res.status(400).json({
                message: "You should put a lower price",
            });
        } else {
            if (title && price && req.files.picture) {
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
                                secrure_url:
                                    newOffer.owner.account.avatar.secure_url,
                                original_filename:
                                    newOffer.owner.account.avatar
                                        .original_filename,
                            },
                        },
                        _id: newOffer.owner._id,
                    },
                    product_image: {
                        secure_url: newOffer.product_image.secure_url,
                    },
                });
            } else {
                res.status(400).json({
                    message:
                        "You must specify the name of the offer, the price and the picture of your offer",
                });
            }
        }
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Route qui nous permet de récupérer une liste d'annonces, en fonction des filtres
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

        // // numero de page par défaut et limite de produit par page
        // let page;
        // // forcer à afficher la page 1 si la query page n'est pas envoyée ou est envoyée avec 0 ou < -1
        // if (req.query.page < 1) {
        //     page = 1;
        // } else if (req.query.page > Math.ceil(count / limit)) {
        //     page = Math.ceil(count / limit);
        // } else {
        //     // sinon, page est égale à ce qui est demandé
        //     page = Number(req.query.page);
        // }

        let page;
        if (Number(req.query.page) < 1) {
            page = 1;
        } else {
            page = Number(req.query.page);
        }

        limit = Number(req.query.limit);

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

// Route qui permmet de récupérer les informations d'une offre en fonction de son id
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
// Route qui nous permet de modifier une nouvelle annonce
router.put("/offer/update/:id", isAuthenticated, async (req, res) => {
    try {
        if (req.params.id) {
            const offerToUpdate = await Offer.findById(req.params.id);

            if (offerToUpdate) {
                let userId = req.user.id;
                let ownerId = offerToUpdate.owner.toString();

                // si l'id du user correspond à l'id du owner il peut modifier l'offre
                if (ownerId === userId) {
                    if (req.fields.title.length > 50) {
                        res.status(400).json({
                            message: "Your title must be shorter",
                        });
                    } else if (req.fields.description.length > 500) {
                        res.status(400).json({
                            message: "Your description must be shorter",
                        });
                    } else if (Number(req.fields.price) > 100000) {
                        res.status(400).json({
                            message: "You should put a lower price",
                        });
                    } else {
                        if (req.fields.title) {
                            offerToUpdate.product_name = req.fields.title;
                        }
                        if (req.fields.description) {
                            offerToUpdate.product_description =
                                req.fields.description;
                        }
                        if (req.fields.price) {
                            offerToUpdate.product_price = req.fields.price;
                        }

                        const details = offerToUpdate.product_details;
                        for (i = 0; i < details.length; i++) {
                            if (details[i].MARQUE) {
                                if (req.fields.brand) {
                                    details[i].MARQUE = req.fields.brand;
                                }
                            }
                            if (details[i].TAILLE) {
                                if (req.fields.size) {
                                    details[i].TAILLE = req.fields.size;
                                }
                            }
                            if (details[i].ÉTAT) {
                                if (req.fields.condition) {
                                    details[i].ÉTAT = req.fields.condition;
                                }
                            }
                            if (details[i].COULEUR) {
                                if (req.fields.color) {
                                    details[i].COULEUR = req.fields.color;
                                }
                            }
                            if (details[i].EMPLACEMENT) {
                                if (req.fields.location) {
                                    details[i].EMPLACEMENT =
                                        req.fields.location;
                                }
                            }
                        }

                        // Notifie Mongoose que l'on a modifié le tableau product_details
                        offerToUpdate.markModified("product_details");

                        //si on modifie l'image
                        if (req.files.picture) {
                            if (
                                offerToUpdate.product_image.public_id ===
                                undefined
                            ) {
                                //si l'offre n'avait pas d'image
                                const result = await cloudinary.uploader.upload(
                                    req.files.picture.path,
                                    {
                                        folder: `/vinted/offers/${offerToUpdate._id}`,
                                    }
                                );
                                offerToUpdate.product_image = result;
                            } else {
                                //sinon on remplace l'image
                                const result = await cloudinary.uploader.upload(
                                    req.files.picture.path,
                                    {
                                        public_id:
                                            offerToUpdate.product_image
                                                .public_id,
                                        overwrite: true,
                                    }
                                );
                                offerToUpdate.product_image = result;
                            }
                        }
                        await offerToUpdate.save();
                        res.status(200).json({
                            "Offer is updated ✅": {
                                product_name: offerToUpdate,
                                //.product_name,
                                //id: offerToUpdate._id,
                            },
                        });
                    }
                }
            } else {
                res.status(400).json({
                    message: "No offer found for this id",
                });
            }
        } else {
            res.status(400).json({
                message: "id is not valid",
            });
        }
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});
router.delete(
    "/offer/delete/picture/:id",
    isAuthenticated,
    async (req, res) => {
        try {
            if (req.params.id) {
                const offerToUpdate = await Offer.findById(req.params.id);

                if (offerToUpdate) {
                    let userId = req.user.id;
                    let ownerId = offerToUpdate.owner.toString();

                    // si l'id du user correspond à l'id du owner il peut supprimer l'image
                    if (ownerId === userId) {
                        if (
                            offerToUpdate.product_image.public_id === undefined
                        ) {
                            //si l'offre n'avait pas d'image
                            res.status(400).json({ message: "No picture" });
                        } else {
                            //supprime ce qui il y a dans le dossier
                            await cloudinary.api.delete_resources_by_prefix(
                                `vinted/offers/${req.params.id}`
                            );
                            //supprimer le dossier
                            await cloudinary.api.delete_folder(
                                `vinted/offers/${req.params.id}`
                            );

                            offerToUpdate.product_image = undefined;

                            await offerToUpdate.save();
                            res.status(200).json({
                                message: "Successful picture deleted",
                            });
                        }
                    }
                } else {
                    res.status(400).json({
                        message: "No offer found for this id",
                    });
                }
            } else {
                res.status(400).json({
                    message: "id is not valid",
                });
            }
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
);
router.delete("/offer/delete/:id", isAuthenticated, async (req, res) => {
    try {
        const offerToDelete = await Offer.findById(req.params.id);

        const user = req.user;

        if (offerToDelete) {
            let userId = req.user.id;
            let ownerId = offerToDelete.owner.toString();

            if (ownerId === userId) {
                //supprime l'image de l'annonce dans cloudinary
                await cloudinary.api.delete_resources_by_prefix(
                    `vinted/offers/${req.params.id}`
                );
                if (offerToDelete.product_image) {
                    //Supprime le dossier de l'image dans cloudinary
                    await cloudinary.api.delete_folder(
                        `vinted/offers/${req.params.id}`
                    );
                }
                await offerToDelete.deleteOne();
                res.status(200).json({
                    "Successful deleted of": offerToDelete.product_name,
                });
            } else {
                res.status(400).json({ message: "Unauthorized" });
            }
        } else {
            res.status(400).json({ message: "Unauthorized" });
        }
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

module.exports = router;
