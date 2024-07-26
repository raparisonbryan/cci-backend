/**
 * imports
 */
const User = require("../models/User");
require("dotenv").config();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

/**
 * * inscription d'un utilisateur
 * * Crypter le mdp
 * * Prendre le mdp crypté et créer un nouveau User
 * * Enregistre le nouveau User dans la base de donnée
 * @param {*} req
 * @param {*} res
 * @param {*} next
 */
exports.signup = (req, res, next) => {
  bcrypt
    .hash(req.body.password, 10)
    .then((hash) => {
      const user = new User({
        name: req.body.name,
        imageUrl: req.body.imageUrl,
        phone: req.body.phone,
        email: req.body.email,
        password: hash,
      });
      user
        .save()
        .then(() =>
          res.status(201).json({
            message: "Utilisateur créé !",
          })
        )
        .catch((error) =>
          res.status(400).json({
            error,
          })
        );
    })
    .catch((error) =>
      res.status(500).json({
        error,
      })
    );
};

/**
 * * connexion d'un utilisateur
 * @param {*} req
 * @param {*} res
 * @param {*} next
 */
exports.login = (req, res, next) => {
  User.findOne({
    email: req.body.email,
  })
    .then((user) => {
      if (!user) {
        return res.status(401).json({
          error: "Utilisateur non trouvé !",
        });
      }
      bcrypt
        .compare(req.body.password, user.password)
        .then((valid) => {
          if (!valid) {
            return res.status(401).json({
              error: "Mot de passe incorrect !",
            });
          }
          res.status(200).json({
            name: user.name,
            email: user.email,
            userId: user._id,
            token: jwt.sign(
              {
                userId: user._id,
              },
              process.env.RANDOM_TOKEN_SECRET,
              {
                expiresIn: "24h",
              }
            ),
          });
        })
        .catch((error) => {
          console.error("Erreur bcrypt:", error);
          res.status(500).json({
            error: "Erreur durant la comparaison des mots de passe",
          });
        });
    })
    .catch((error) => {
      console.error("Utilisateur non trouvé !", error);
      res.status(500).json({
        error: "Utilisateur non trouvé !",
      });
    });
};

/**
 * * Demander un utilisateur par son id
 * @param {*} req
 * @param {*} res
 * @param {*} next
 */
exports.getOneUser = (req, res, next) => {
  User.findOne({
    _id: req.params.id,
  })
    .then((user) => res.status(200).json(user))
    .catch((error) =>
      res.status(404).json({
        error,
      })
    );
};

/**
 * * Modifier un utilisateur
 * @param {*} req
 * @param {*} res
 * @param {*} next
 */
exports.modifyUser = (req, res, next) => {
  const userId = req.params.id;

  User.findByIdAndUpdate(userId, req.body, { new: true })
    .then((updatedUser) => {
      if (!updatedUser) {
        return res.status(404).json({ message: "Utilisateur non trouvé" });
      }
      res.json(updatedUser);
    })
    .catch((err) => {
      res.status(400).json({
        message:
          err.message ||
          "Une erreur s'est produite lors de la mise à jour de l'utilisateur.",
      });
    });
};

/**
 * * Supprimer un utilisateur
 * @param {*} req
 * @param {*} res
 * @param {*} next
 */
exports.deleteUser = (req, res, next) => {
  const userId = req.params.id;

  User.findByIdAndRemove(userId)
    .then((deletedUser) => {
      if (!deletedUser) {
        return res.status(404).json({ message: "Utilisateur non trouvé" });
      }
      res.json(deletedUser);
    })
    .catch((err) => {
      res.status(400).json({
        message:
          err.message ||
          "Une erreur s'est produite lors de la suppression de l'utilisateur.",
      });
    });
};

/**
 * * Demander tous les utilisateurs
 * @param {*} req
 * @param {*} res
 * @param {*} next
 */
exports.getAllUsers = (req, res, next) => {
  User.find()
    .then((users) => res.status(200).json(users))
    .catch((error) =>
      res.status(400).json({
        error,
      })
    );
};
