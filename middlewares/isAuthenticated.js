//Import model User
const User = require("../models/User");

const isAuthenticated = async (req, res, next) => {
    try {
        if (req.headers.authorization) {
            //console.log(req.headers.authorization);
            // Récupère le token
            const token = req.headers.authorization.replace("Bearer ", "");

            //Chercher dans la BDD
            const user = await User.findOne({ token: token });
            //.selected( "account email token");
            if (user) {
                req.user = user; // rajoute clé user dans dans l'objet req

                //Sortir du middleware pour passer à la suite
                return next();
            } else {
                return res.status(401).json({ message: "Unauthorized" });
            }
        } else {
            return res.status(401).json({ message: "Unauthorized" });
        }
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

module.exports = isAuthenticated;
