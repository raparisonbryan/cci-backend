const { google } = require('googleapis');
const credentials = require('../credentials.json');

let auth = null;
let sheetsApi = null;

function getGoogleAuth() {
    if (!auth) {
        auth = new google.auth.GoogleAuth({
            credentials,
            scopes: ['https://www.googleapis.com/auth/spreadsheets']
        });
    }
    return auth;
}

function getGoogleSheets() {
    if (!sheetsApi) {
        const auth = getGoogleAuth();
        sheetsApi = google.sheets({ version: 'v4', auth });
    }
    return sheetsApi;
}

module.exports = {
    getGoogleSheets
};