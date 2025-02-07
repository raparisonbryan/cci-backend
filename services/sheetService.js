/**
 * imports
 */
const {getGoogleSheets} = require('../utils/googleAuth.js');
/**
 * *récupérer les valeurs d'une feuille de calcul
 * @param {string} spreadsheetId
 * @param {string} range
 * @returns {Promise<Array>}
 */
exports.getData = async (spreadsheetId, range) => {
    const sheets = getGoogleSheets();
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
};

/**
 * *mettre à jour les valeurs d'une feuille de calcul
 * @param {string} spreadsheetId
 * @param {string} range
 * @param {Array} values
 * @returns {Promise<Object>}
 */
exports.updateData = async (spreadsheetId, range, values) => {
    const sheets = getGoogleSheets();
    const response = await sheets.spreadsheets.values.update({
        spreadsheetId,
        range,
        valueInputOption: 'RAW',
        requestBody: { values },
    });
    return response.data;
};

/**
 * *supprimer une ligne d'une feuille de calcul
 * @param {string} spreadsheetId
 * @param {string} range
 * @returns {Promise<Object>}
 */
exports.deleteRow = async (spreadsheetId, range) => {
    const sheets = getGoogleSheets();
    const rowIndex = parseInt(range.split('!')[1].replace(/[^0-9]/g, '')) - 1;

    const response = await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: {
            requests: [{
                deleteDimension: {
                    range: {
                        sheetId: 0,
                        dimension: 'ROWS',
                        startIndex: rowIndex,
                        endIndex: rowIndex + 1
                    }
                }
            }]
        }
    });
    return response.data;
};

/**
 * *insérer une ligne dans une feuille de calcul
 * @param {string} spreadsheetId
 * @param {string} range
 * @returns {Promise<Object>}
 */
exports.insertRow = async (spreadsheetId, range) => {
    const sheets = getGoogleSheets();
    const rowIndex = parseInt(range.split('!')[1].replace(/[^0-9]/g, '')) - 1;

    const response = await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: {
            requests: [{
                insertDimension: {
                    range: {
                        sheetId: 0,
                        dimension: 'ROWS',
                        startIndex: rowIndex,
                        endIndex: rowIndex + 1
                    }
                }
            }]
        }
    });
    return response.data;
};