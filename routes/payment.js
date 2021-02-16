const express = require("express");
const formidableMiddleware = require("express-formidable");
const router = express.Router();

require("dotenv").config();
const cors = require("cors");

const stripe = require("stripe")(process.env.STRIPE_API_SECRET);

const app = express();
app.use(formidableMiddleware());
app.use(cors());

router.post("/payment", async (req, res) => {
    try {
        // Réception du token créer via l'API Stripe depuis le Frontend
        const stripeToken = req.fields.stripeToken;
        // Créer la transaction
        const response = await stripe.charges.create({
            amount: req.fields.amount * 100,
            currency: "eur",
            description: `Paiement effectuer sur Vinted pour ${req.fields.name}`,
            // On envoie ici le token
            source: stripeToken,
        });
        console.log(response.status);
        // TODO
        // Sauvegarder la transaction dans une BDD MongoDB
        res.json(response);
    } catch (error) {
        console.log(error.message);
        res.status(400).json({ error: error.message });
    }
});

module.exports = router;
