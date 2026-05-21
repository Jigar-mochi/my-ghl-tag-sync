const crypto = require('crypto');

// Latest Ed25519 Public Key for X-GHL-Signature
const ED25519_PUBLIC_KEY = `-----BEGIN PUBLIC KEY-----
MCowBQYDK2VwAyEAi2HR1srL4o18O8BRa7gVJY7G7bupbN3H9AwJrHCDiOg=
-----END PUBLIC KEY-----`;

// Legacy RSA Public Key for X-WH-Signature
const RSA_PUBLIC_KEY = `-----BEGIN PUBLIC KEY-----
MIICIjANBgkqhkiG9w0BAQEFAAOCAg8AMIICCgKCAgEAokvo/r9tVgcfZ5DysOSC
Frm602qYV0MaAiNnX9O8KxMbiyRKWeL9JpCpVpt4XHIcBOK4u3cLSqJGOLaPuXw6
dO0t6Q/ZVdAV5Phz+ZtzPL16iCGeK9po6D6JHBpbi989mmzMryUnQJezlYJ3DVfB
csedpinheNnyYeFXolrJvcsjDtfAeRx5ByHQmTnSdFUzuAnC9/GepgLT9SM4nCpv
uxmZMxrJt5Rw+VUaQ9B8JSvbMPpez4peKaJPZHBbU3OdeCVx5klVXXZQGNHOs8gF
3kvoV5rTnXV0IknLBXlcKKAQLZcY/Q9rG6Ifi9c+5vqlvHPCUJFT5XUGG5RKgOKU
J062fRtN+rLYZUV+BjafxQauvC8wSWeYja63VSUruvmNj8xkx2zE/Juc+yjLjTXp
IocmaiFeAO6fUtNjDeFVkhf5LNb59vECyrHD2SQIrhgXpO4Q3dVNA5rw576PwTzN
h/AMfHKIjE4xQA1SZuYJmNnmVZLIZBlQAF9Ntd03rfadZ+yDiOXCCs9FkHibELhC
HULgCsnuDJHcrGNd5/Ddm5hxGQ0ASitgHeMZ0kcIOwKDOzOU53lDza6/Y09T7sYJ
PQe7z0cvj7aE4B+Ax1ZoZGPzpJlZtGXCsu9aTEGEnKzmsFqwcSsnw3JB31IGKAyk
T1hhTiaCeIY/OwwwNUY2yvcCAwEAAQ==
-----END PUBLIC KEY-----`;

/**
 * Verify GHL Webhook Signatures
 * Prefers X-GHL-Signature (Ed25519) if present, falls back to X-WH-Signature (RSA)
 */
function verifySignature(rawBody, headers) {
    const ghlSignature = headers['x-ghl-signature'];
    const whSignature = headers['x-wh-signature'];

    // 1. Try to verify the primary X-GHL-Signature first
    if (ghlSignature) {
        try {
            const isValid = crypto.verify(
                null, 
                Buffer.from(rawBody, 'utf8'), 
                ED25519_PUBLIC_KEY, 
                Buffer.from(ghlSignature, 'base64')
            );
            
            if (isValid) {
                return { ok: true, reason: null };
            } else {
                return { ok: false, reason: "Invalid X-GHL-Signature" };
            }
        } catch (error) {
            return { ok: false, reason: "Error verifying X-GHL-Signature" };
        }
    }

    // 2. Fall back to the legacy X-WH-Signature if primary is missing
    if (whSignature) {
        try {
            const isValid = crypto.verify(
                'SHA256',
                Buffer.from(rawBody, 'utf8'),
                RSA_PUBLIC_KEY,
                Buffer.from(whSignature, 'base64')
            );
            
            if (isValid) {
                return { ok: true, reason: null };
            } else {
                return { ok: false, reason: "Invalid X-WH-Signature" };
            }
        } catch (error) {
            return { ok: false, reason: "Error verifying X-WH-Signature" };
        }
    }

    // 3. No signature headers found
    return { ok: false, reason: "Missing signature header" };
}

module.exports = verifySignature;
