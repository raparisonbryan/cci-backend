/**
 * * Imports
 */
const verifyPassword = require("password-validator");

const passwordSchema = new verifyPassword();

/**
 * * Critères pour avoir un password valide
 */
passwordSchema
  .is()
  .min(8)
  .is()
  .max(100)
  .has()
  .uppercase()
  .has()
  .lowercase()
  .has()
  .digits(1)
  .has()
  .not()
  .spaces()
  .is()
  .not()
  .oneOf(["Motdepasse123", "Password123"]);

/**
 * * Exports
 */
module.exports = passwordSchema;
