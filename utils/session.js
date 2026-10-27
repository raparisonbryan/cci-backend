const crypto = require('crypto');
const { jwtDecrypt } = require('jose');

// Noms du cookie de session NextAuth (configurés côté front, voir src/utils/authCookie.ts)
const SESSION_COOKIE_NAMES = ['__Secure-cci.session-token', 'cci.session-token'];

let encryptionKey = null;

/**
 * Dérive la clé de chiffrement des JWT NextAuth (même dérivation que next-auth v4)
 * @returns {Uint8Array}
 */
function getEncryptionKey() {
    if (!encryptionKey) {
        const secret = process.env.NEXTAUTH_SECRET;
        if (!secret) {
            throw new Error('NEXTAUTH_SECRET non défini');
        }
        encryptionKey = new Uint8Array(
            crypto.hkdfSync('sha256', secret, '', 'NextAuth.js Generated Encryption Key', 32)
        );
    }
    return encryptionKey;
}

/**
 * Parse l'en-tête Cookie
 * @param {string} header - En-tête Cookie brut
 * @returns {Object<string, string>}
 */
function parseCookies(header = '') {
    const cookies = {};
    header.split(';').forEach((part) => {
        const index = part.indexOf('=');
        if (index === -1) return;
        const name = part.slice(0, index).trim();
        const value = part.slice(index + 1).trim();
        try {
            cookies[name] = decodeURIComponent(value);
        } catch {
            cookies[name] = value;
        }
    });
    return cookies;
}

/**
 * Récupère le token de session, y compris lorsqu'il est découpé en plusieurs cookies (.0, .1, ...)
 * @param {string} cookieHeader - En-tête Cookie brut
 * @returns {string|null}
 */
function getSessionToken(cookieHeader) {
    const cookies = parseCookies(cookieHeader);

    for (const name of SESSION_COOKIE_NAMES) {
        if (cookies[name]) return cookies[name];

        const chunks = Object.keys(cookies)
            .filter(key => key.startsWith(`${name}.`))
            .sort((a, b) => Number(a.split('.').pop()) - Number(b.split('.').pop()));
        if (chunks.length) return chunks.map(key => cookies[key]).join('');
    }
    return null;
}

/**
 * Retourne l'utilisateur connecté à partir des cookies, ou null si la session est absente ou invalide
 * @param {string} cookieHeader - En-tête Cookie brut
 * @returns {Promise<{email: string, name: string, image: string, role: string}|null>}
 */
async function getUserFromCookies(cookieHeader) {
    const token = getSessionToken(cookieHeader);
    if (!token) return null;

    try {
        const { payload } = await jwtDecrypt(token, getEncryptionKey(), { clockTolerance: 15 });
        if (!payload.email || !payload.role) return null;

        return {
            email: payload.email,
            name: payload.name,
            image: payload.picture,
            role: payload.role,
        };
    } catch (error) {
        console.error('Session invalide:', error.message);
        return null;
    }
}

module.exports = {
    getUserFromCookies
};
