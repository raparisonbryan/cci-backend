/**
 * * Imports
 */
const passwordSchema = require("../models/Password");

/**
 * * Exports
 */
module.exports = (req, res, next) => {
  if (!passwordSchema.validate(req.body.password)) {
    return res.status(400).json({
      message:
        "Le mot de passe doit contenir entre 8 et 100 caractères, avec au minimum une majuscule, une minuscule et 1 chiffre",
    });
  } else {
    next();
  }
};
