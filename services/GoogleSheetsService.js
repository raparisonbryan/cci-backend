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
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range,
    majorDimension: "ROWS",
  });
  const rows = res.data.values || [];
  const maxColumns = 7;

  rows.forEach((row) => {
    while (row.length < maxColumns) {
      row.push("");
    }
  });

  return rows;
}

async function updateSpreadSheetValues(spreadsheetId, range, values) {
  const sheets = google.sheets({ version: "v4", auth: await getAuthToken() });
  const resource = {
    values,
  };
  const res = await sheets.spreadsheets.values.update({
    spreadsheetId,
    range,
    valueInputOption: "RAW",
    resource,
  });
  return res.data;
}

module.exports = {
  getSpreadSheet,
  getSpreadSheetValues,
  updateSpreadSheetValues,
};
