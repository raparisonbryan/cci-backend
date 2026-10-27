/**
 * imports
 */
const { getUserFromCookies } = require('../utils/session.js');
const { readList } = require('../utils/config.js');

/**
 * *vérifier que la requête provient d'un utilisateur connecté (cookie de session NextAuth)
 * @param {*} req
 * @param {*} res
 * @param {*} next
 */
exports.requireAuth = async (req, res, next) => {
  const user = await getUserFromCookies(req.headers.cookie);
  if (!user) {
    return res.status(401).send("Non authentifié");
  }
  req.user = user;
  next();
};

/**
 * *restreindre une route à certains rôles
 * @param {...string} roles
 */
exports.requireRole = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user?.role)) {
    return res.status(403).send("Accès refusé");
  }
  next();
};

/**
 * *n'autoriser que les classeurs listés dans ALLOWED_SPREADSHEET_IDS
 * @param {*} req
 * @param {*} res
 * @param {*} next
 */
const allowedSpreadsheetIds = readList('ALLOWED_SPREADSHEET_IDS');
if (!allowedSpreadsheetIds.length) {
  console.warn('ALLOWED_SPREADSHEET_IDS non défini : tous les classeurs sont autorisés');
}

exports.requireAllowedSpreadsheet = (req, res, next) => {
  const spreadsheetId = req.query.spreadsheetId ?? req.body?.spreadsheetId;
  if (allowedSpreadsheetIds.length && !allowedSpreadsheetIds.includes(spreadsheetId)) {
    return res.status(403).send("Classeur non autorisé");
  }
  next();
};
