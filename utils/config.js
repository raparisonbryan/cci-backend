/**
 * Lit une liste séparée par des virgules depuis une variable d'environnement
 * @param {string} name - Nom de la variable
 * @returns {string[]}
 */
function readList(name) {
    return (process.env[name] || '').split(',').map(item => item.trim()).filter(Boolean);
}

module.exports = {
    readList
};
