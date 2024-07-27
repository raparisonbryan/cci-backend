const { google } = require("googleapis");
const SCOPES = ["https://www.googleapis.com/auth/spreadsheets"];
const auth = new google.auth.GoogleAuth({
  keyFile: "./credentials.json",
  scopes: SCOPES,
});

async function getAuthToken() {
  const authToken = await auth.getClient();
  return authToken;
}

async function getSpreadSheet(spreadsheetId) {
  const sheets = google.sheets({ version: "v4", auth: await getAuthToken() });
  const res = await sheets.spreadsheets.get({ spreadsheetId });
  return res.data;
}

async function getSpreadSheetValues(spreadsheetId, range) {
  const sheets = google.sheets({ version: "v4", auth: await getAuthToken() });
  const res = await sheets.spreadsheets.values.get({ spreadsheetId, range });
  return res.data.values;
}

module.exports = { getSpreadSheet, getSpreadSheetValues };
