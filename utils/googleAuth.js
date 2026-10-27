const path = require('path');
const { google } = require('googleapis');

// Chemin du fichier de compte de service (par défaut : credentials.json à la racine du projet)
const keyFile = process.env.GOOGLE_APPLICATION_CREDENTIALS
    || path.join(__dirname, '..', 'credentials.json');

let auth = null;
let sheetsApi = null;

function getGoogleAuth() {
    if (!auth) {
        auth = new google.auth.GoogleAuth({
            keyFile,
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
