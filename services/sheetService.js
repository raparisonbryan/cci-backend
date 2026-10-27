/**
 * imports
 */
const { getGoogleSheets } = require('../utils/googleAuth.js');

/**
 * Crée une erreur de validation (renvoyée en 400 par le contrôleur)
 * @param {string} message - Message d'erreur
 * @returns {Error}
 */
function badRequest(message) {
    const error = new Error(message);
    error.status = 400;
    return error;
}

/**
 * Extrait le nom de la feuille et l'index (base 0) de la ligne d'une plage
 * @param {string} range - Plage de la forme 'Feuille!A5' ou 'Feuille!A5:Z5'
 * @returns {{sheetName: string, rowIndex: number}}
 */
function parseRowRange(range) {
    const match = /^(.+)![A-Z]+(\d+)(?::[A-Z]+\d+)?$/i.exec(range ?? '');
    if (!match) {
        throw badRequest(`Plage invalide : "${range}"`);
    }

    const rowNumber = parseInt(match[2], 10);
    if (rowNumber < 1) {
        throw badRequest(`Numéro de ligne invalide : ${rowNumber}`);
    }

    return { sheetName: match[1], rowIndex: rowNumber - 1 };
}

/**
 * Récupère le sheetId à partir du nom de la feuille
 * @param {Object} sheets - Instance de l'API Google Sheets
 * @param {string} spreadsheetId - ID du classeur
 * @param {string} sheetName - Nom de la feuille
 * @returns {Promise<number>} - ID de la feuille
 */
async function getSheetId(sheets, spreadsheetId, sheetName) {
    try {
        const spreadsheet = await sheets.spreadsheets.get({
            spreadsheetId: spreadsheetId
        });

        const cleanSheetName = /^'.*'$/.test(sheetName)
            ? sheetName.slice(1, -1).replace(/''/g, "'")
            : sheetName;

        const sheet = spreadsheet.data.sheets.find(s =>
            s.properties.title.toLowerCase() === cleanSheetName.toLowerCase()
        );

        if (!sheet) {
            throw badRequest(`Feuille "${cleanSheetName}" non trouvée`);
        }

        return sheet.properties.sheetId;
    } catch (error) {
        console.error('Erreur lors de la récupération du sheetId:', error);
        throw error;
    }
}

/**
 * Insère ou supprime une ligne d'une feuille de calcul
 * @param {string} spreadsheetId - ID du classeur
 * @param {string} range - Plage contenant la ligne
 * @param {'insertDimension'|'deleteDimension'} operation - Opération à effectuer
 * @returns {Promise<Object>} - Réponse de l'API
 */
async function updateRowDimension(spreadsheetId, range, operation) {
    const sheets = getGoogleSheets();
    const { sheetName, rowIndex } = parseRowRange(range);
    const sheetId = await getSheetId(sheets, spreadsheetId, sheetName);

    const response = await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: {
            requests: [{
                [operation]: {
                    range: {
                        sheetId: sheetId,
                        dimension: 'ROWS',
                        startIndex: rowIndex,
                        endIndex: rowIndex + 1
                    }
                }
            }]
        }
    });
    return response.data;
}

/**
 * Récupère les valeurs d'une feuille de calcul
 * @param {string} spreadsheetId - ID du classeur
 * @param {string} range - Plage de cellules (ex: 'Feuille1!A1:Z')
 * @returns {Promise<Array>} - Données de la feuille
 */
exports.getData = async (spreadsheetId, range) => {
    const sheets = getGoogleSheets();
    try {
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range,
            valueRenderOption: 'UNFORMATTED_VALUE',
            dateTimeRenderOption: 'FORMATTED_STRING',
            majorDimension: 'ROWS',
        });

        const headers = response.data.values?.[0] || [];
        return response.data.values?.map((row) => {
            while (row.length < headers.length) {
                row.push('');
            }
            return row;
        }) || [];
    } catch (error) {
        console.error('Erreur lors de la récupération des données:', error);
        throw error;
    }
};

/**
 * Met à jour les valeurs d'une feuille de calcul
 * @param {string} spreadsheetId - ID du classeur
 * @param {string} range - Plage de cellules à mettre à jour
 * @param {Array} values - Nouvelles valeurs
 * @returns {Promise<Object>} - Réponse de l'API
 */
exports.updateData = async (spreadsheetId, range, values) => {
    const sheets = getGoogleSheets();
    try {
        const response = await sheets.spreadsheets.values.update({
            spreadsheetId,
            range,
            valueInputOption: 'RAW',
            requestBody: { values },
        });
        return response.data;
    } catch (error) {
        console.error('Erreur lors de la mise à jour des données:', error);
        throw error;
    }
};

/**
 * Supprime une ligne d'une feuille de calcul
 * @param {string} spreadsheetId - ID du classeur
 * @param {string} range - Plage contenant la ligne à supprimer
 * @returns {Promise<Object>} - Réponse de l'API
 */
exports.deleteRow = async (spreadsheetId, range) => {
    try {
        return await updateRowDimension(spreadsheetId, range, 'deleteDimension');
    } catch (error) {
        console.error('Erreur lors de la suppression de la ligne:', error);
        throw error;
    }
};

/**
 * Insère une ligne dans une feuille de calcul
 * @param {string} spreadsheetId - ID du classeur
 * @param {string} range - Plage où insérer la nouvelle ligne
 * @returns {Promise<Object>} - Réponse de l'API
 */
exports.insertRow = async (spreadsheetId, range) => {
    try {
        return await updateRowDimension(spreadsheetId, range, 'insertDimension');
    } catch (error) {
        console.error('Erreur lors de l\'insertion de la ligne:', error);
        throw error;
    }
};
