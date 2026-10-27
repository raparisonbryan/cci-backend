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
 * Crée une erreur de conflit (renvoyée en 409 par le contrôleur)
 * @param {string} message - Message d'erreur
 * @returns {Error}
 */
function conflict(message) {
    const error = new Error(message);
    error.status = 409;
    return error;
}

/**
 * Vérifie que la ligne contient toujours les valeurs vues par le client,
 * pour ne pas agir sur une autre ligne si le tableau a bougé entre-temps
 * @param {string} spreadsheetId - ID du classeur
 * @param {string} sheetName - Nom de la feuille
 * @param {number} rowIndex - Index (base 0) de la ligne
 * @param {Array} expectedRow - Valeurs attendues
 */
async function assertRowUnchanged(spreadsheetId, sheetName, rowIndex, expectedRow) {
    const rowNumber = rowIndex + 1;
    const [currentRow = []] = await exports.getData(spreadsheetId, `${sheetName}!A${rowNumber}:Z${rowNumber}`);

    const length = Math.max(currentRow.length, expectedRow.length);
    for (let i = 0; i < length; i++) {
        if (String(currentRow[i] ?? '').trim() !== String(expectedRow[i] ?? '').trim()) {
            throw conflict(`La ligne ${rowNumber} a été modifiée entre-temps`);
        }
    }
}

/**
 * Convertit une valeur en cellule pour l'API batchUpdate (équivalent de valueInputOption RAW)
 * @param {*} value
 * @returns {Object}
 */
function toCellData(value) {
    if (typeof value === 'number') return { userEnteredValue: { numberValue: value } };
    if (typeof value === 'boolean') return { userEnteredValue: { boolValue: value } };
    return { userEnteredValue: { stringValue: String(value ?? '') } };
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
 * Supprime une ligne d'une feuille de calcul, si elle n'a pas changé
 * @param {string} spreadsheetId - ID du classeur
 * @param {string} range - Plage contenant la ligne à supprimer
 * @param {Array} expectedRow - Contenu de la ligne vu par le client
 * @returns {Promise<Object>} - Réponse de l'API
 */
exports.deleteRow = async (spreadsheetId, range, expectedRow) => {
    try {
        const sheets = getGoogleSheets();
        const { sheetName, rowIndex } = parseRowRange(range);
        const sheetId = await getSheetId(sheets, spreadsheetId, sheetName);
        await assertRowUnchanged(spreadsheetId, sheetName, rowIndex, expectedRow);

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
 * Insère une ligne et ses valeurs en une seule opération, si la ligne de référence n'a pas changé
 * @param {string} spreadsheetId - ID du classeur
 * @param {string} range - Plage où insérer la nouvelle ligne
 * @param {Array} expectedRow - Contenu actuel de la ligne à cette position, vu par le client
 * @param {Array} values - Valeurs de la nouvelle ligne
 * @returns {Promise<Object>} - Réponse de l'API
 */
exports.insertRow = async (spreadsheetId, range, expectedRow, values = []) => {
    try {
        const sheets = getGoogleSheets();
        const { sheetName, rowIndex } = parseRowRange(range);
        const sheetId = await getSheetId(sheets, spreadsheetId, sheetName);
        await assertRowUnchanged(spreadsheetId, sheetName, rowIndex, expectedRow);

        const requests = [{
            insertDimension: {
                range: {
                    sheetId: sheetId,
                    dimension: 'ROWS',
                    startIndex: rowIndex,
                    endIndex: rowIndex + 1
                }
            }
        }];
        if (values.length) {
            requests.push({
                updateCells: {
                    start: { sheetId: sheetId, rowIndex, columnIndex: 0 },
                    rows: [{ values: values.map(toCellData) }],
                    fields: 'userEnteredValue'
                }
            });
        }

        const response = await sheets.spreadsheets.batchUpdate({
            spreadsheetId,
            requestBody: { requests }
        });
        return response.data;
    } catch (error) {
        console.error('Erreur lors de l\'insertion de la ligne:', error);
        throw error;
    }
};
