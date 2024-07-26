/**
 * * Imports
 */
const verifyEmail = require("email-validator");

/**
 * * Exports
 */
module.exports = (req, res, next) => {
  if (!verifyEmail.validate(req.body.email)) {
    return res.status(400).json({
      message: "Saisir une adresse email valide.",
    });
  } else {
    next();
  }
};
