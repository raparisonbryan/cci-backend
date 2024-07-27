/**
 * imports
 */
require("dotenv").config();
const sheetId = process.env.SHEET_ID;
const sheetRange = "Janvier!A1:E";
const sheetMethods = require("../services/GoogleSheetsService");

/**
 * * récupérer les informations du tableur
 * @param {*} req
 * @param {*} res
 * @param {*} next
 */
exports.getSheetValues = async (req, res, next) => {
  try {
    const spreadsheetId = sheetId;
    const range = sheetRange;
    const values = await sheetMethods.getSpreadSheetValues(
      spreadsheetId,
      range
    );
    res.status(200).json(values);
  } catch (error) {
    res.status(500).send("Error retrieving sheet data");
  }
};
