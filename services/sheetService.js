/**
 * imports
 */
const { getGoogleSheets } = require('../utils/googleAuth.js');

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

        // Nettoyer le nom de la feuille (enlever les guillemets simples s'ils existent)
        const cleanSheetName = sheetName.replace(/'/g, '');

        const sheet = spreadsheet.data.sheets.find(s =>
            s.properties.title.toLowerCase() === cleanSheetName.toLowerCase()
        );

        if (!sheet) {
            new Error(`Feuille "${cleanSheetName}" non trouvée`);
        }

        return sheet.properties.sheetId;
    } catch (error) {
        console.error('Erreur lors de la récupération du sheetId:', error);
        throw error;
    }
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
    const sheets = getGoogleSheets();
    try {
        // Extraire le nom de la feuille et l'index de la ligne
        const [sheetName, cellRange] = range.split('!');
        const rowIndex = parseInt(cellRange.replace(/[^0-9]/g, '')) - 1;

        // Récupérer le sheetId
        const sheetId = await getSheetId(sheets, spreadsheetId, sheetName);

        const response = await sheets.spreadsheets.batchUpdate({
            spreadsheetId,
            requestBody: {
                requests: [{
                    deleteDimension: {
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
    const sheets = getGoogleSheets();
    try {
        // Extraire le nom de la feuille et l'index de la ligne
        const [sheetName, cellRange] = range.split('!');
        const rowIndex = parseInt(cellRange.replace(/[^0-9]/g, '')) - 1;

        // Récupérer le sheetId
        const sheetId = await getSheetId(sheets, spreadsheetId, sheetName);

        const response = await sheets.spreadsheets.batchUpdate({
            spreadsheetId,
            requestBody: {
                requests: [{
                    insertDimension: {
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
    } catch (error) {
        console.error('Erreur lors de l\'insertion de la ligne:', error);
        throw error;
    }
};

/**
 * Vérifie si une feuille existe et la crée si nécessaire
 * @param {string} spreadsheetId - ID du classeur
 * @param {string} sheetTitle - Titre de la feuille
 * @returns {Promise<Object>} - Réponse de l'API
 */
exports.ensureSheetExists = async (spreadsheetId, sheetTitle) => {
    const sheets = getGoogleSheets();
    try {
        const spreadsheet = await sheets.spreadsheets.get({
            spreadsheetId
        });

        const sheetExists = spreadsheet.data.sheets.some(
            sheet => sheet.properties.title.toLowerCase() === sheetTitle.toLowerCase()
        );

        if (!sheetExists) {
            const response = await sheets.spreadsheets.batchUpdate({
                spreadsheetId,
                requestBody: {
                    requests: [{
                        addSheet: {
                            properties: {
                                title: sheetTitle
                            }
                        }
                    }]
                }
            });
            return response.data;
        }

        return null; // La feuille existe déjà
    } catch (error) {
        console.error('Erreur lors de la vérification/création de la feuille:', error);
        throw error;
    }
};