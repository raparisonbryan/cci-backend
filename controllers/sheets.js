/**
 * imports
 */
require("dotenv").config();
const sheetMethods = require("../services/GoogleSheetsService");

/**
 * * récupérer les informations du tableur
 * @param {*} req
 * @param {*} res
 * @param {*} next
 */
exports.getSheetValues = async (req, res, next) => {
  try {
    const { spreadsheetId, range } = req.query;
    if (!spreadsheetId || !range) {
      return res.status(400).send("Missing spreadsheetId or range");
    }
    const values = await sheetMethods.getSpreadSheetValues(
      spreadsheetId,
      range
    );
    res.status(200).json(values);
  } catch (error) {
    res.status(500).send("Error retrieving sheet data");
  }
};

/**
 * * mettre à jour les informations du tableur
 * @param {*} req
 * @param {*} res
 * @param {*} next
 */
exports.updateSheetValues = async (req, res, next) => {
  try {
    const { spreadsheetId, range, values } = req.body;
    const response = await sheetMethods.updateSpreadSheetValues(
      spreadsheetId,
      range,
      values
    );
    res.status(200).json(response);
  } catch (error) {
    res.status(500).send("Error updating sheet data");
  }
};
