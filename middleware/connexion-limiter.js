/**
 * * Imports
 */
const connexionLimit = require("express-rate-limit");

const max = connexionLimit({
  windowMs: 3 * 60 * 1000,
  max: 3,
  message:
    "Suite à 3 tentatives infructueuses, veuillez patienter 3 minutes avant de réessayer",
});

/**
 * * Exports
 */
module.exports = {
  max,
};
