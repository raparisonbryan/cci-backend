/**
 * * Imports
 */
const mongoose = require("mongoose");
const uniqueValidator = require("mongoose-unique-validator");

/**
 * Modèle de données de l'utilisateur
 */

const userSchema = mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  imageUrl: {
    type: String,
    required: false,
  },
  phone: {
    type: String,
    required: false,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
});

/**
 * * Contrôle d'unicité
 */
userSchema.plugin(uniqueValidator);

/**
 * * Export
 */
module.exports = mongoose.model("User", userSchema);
