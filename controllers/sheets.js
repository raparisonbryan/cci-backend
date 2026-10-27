/**
 * imports
 */
const sheetService = require("../services/sheetService.js");

/**
 * *renvoyer une erreur en conservant le statut HTTP d'origine (validation ou API Google)
 * @param {*} res
 * @param {*} error
 * @param {string} message
 */
function sendError(res, error, message) {
  const status = error.status ?? error.response?.status;
  if (status >= 400 && status < 500) {
    return res.status(status).send(`${message}: ${error.message}`);
  }
  res.status(500).send(message);
}

/**
 * *vérifier que spreadsheetId et range sont des chaînes non vides
 * @param {*} res
 * @param {string} spreadsheetId
 * @param {string} range
 * @returns {boolean}
 */
function hasValidTarget(res, spreadsheetId, range) {
  if (typeof spreadsheetId !== "string" || !spreadsheetId || typeof range !== "string" || !range) {
    res.status(400).send("Missing spreadsheetId or range");
    return false;
  }
  return true;
}

/**
 * *récupérer les informations du tableur
 * @param {*} req
 * @param {*} res
 * @param {*} next
 */
exports.getData = async (req, res, next) => {
  try {
    const { spreadsheetId, range } = req.query;
    if (!hasValidTarget(res, spreadsheetId, range)) return;

    const data = await sheetService.getData(spreadsheetId, range);
    res.status(200).json(data);
  } catch (error) {
    sendError(res, error, "Error retrieving sheet data");
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
    if (!hasValidTarget(res, spreadsheetId, range)) return;
    if (!Array.isArray(values) || !values.every(Array.isArray)) {
      return res.status(400).send("values must be an array of rows");
    }

    // Un utilisateur "user" ne peut que remplir des cellules vides
    if (req.user.role === "user") {
      const current = await sheetService.getData(spreadsheetId, range);
      const overwritesCell = values.some((row, i) => row.some((value, j) => {
        const existing = String(current[i]?.[j] ?? "");
        return existing.trim() !== "" && String(value) !== existing;
      }));
      if (overwritesCell) {
        return res.status(403).send("Seules les cellules vides peuvent être modifiées");
      }
    }

    const response = await sheetService.updateData(spreadsheetId, range, values);
    res.status(200).json(response);
  } catch (error) {
    sendError(res, error, "Error updating sheet data");
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
    if (!hasValidTarget(res, spreadsheetId, range)) return;

    const response = await sheetService.deleteRow(spreadsheetId, range);
    res.status(200).json(response);
  } catch (error) {
    sendError(res, error, "Error deleting row");
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
    if (!hasValidTarget(res, spreadsheetId, range)) return;

    const response = await sheetService.insertRow(spreadsheetId, range);
    res.status(200).json(response);
  } catch (error) {
    sendError(res, error, "Error inserting row");
  }
};
