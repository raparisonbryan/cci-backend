/**
 * imports
 */
require("dotenv").config();
const sheetService = require("../services/sheetService.js");

/**
 * *récupérer les informations du tableur
 * @param {*} req
 * @param {*} res
 * @param {*} next
 */
exports.getData = async (req, res, next) => {
  try {
    const { spreadsheetId, range } = req.query;
    if (!spreadsheetId || !range) {
      return res.status(400).send("Missing spreadsheetId or range");
    }

    const data = await sheetService.getData(spreadsheetId, range);
    res.status(200).json(data);
  } catch (error) {
    res.status(500).send("Error retrieving sheet data");
  }
};

/**
 * *mettre à jour les informations du tableur
 * @param {*} req
 * @param {*} res
 * @param {*} next
 */
exports.updateData = async (req, res, next) => {
  try {
    const { spreadsheetId, range, values } = req.body;
    const response = await sheetService.updateData(spreadsheetId, range, values);
    res.status(200).json(response);
  } catch (error) {
    res.status(500).send("Error updating sheet data");
  }
};

/**
 * *supprimer une ligne du tableur
 * @param {*} req
 * @param {*} res
 * @param {*} next
 */
exports.deleteRow = async (req, res, next) => {
  try {
    const { spreadsheetId, range } = req.body;
    const response = await sheetService.deleteRow(spreadsheetId, range);
    res.status(200).json(response);
  } catch (error) {
    res.status(500).send("Error deleting row");
  }
};

/**
 * *insérer une ligne dans le tableur
 * @param {*} req
 * @param {*} res
 * @param {*} next
 */
exports.insertRow = async (req, res, next) => {
  try {
    const { spreadsheetId, range } = req.body;
    const response = await sheetService.insertRow(spreadsheetId, range);
    res.status(200).json(response);
  } catch (error) {
    res.status(500).send("Error inserting row");
  }
};