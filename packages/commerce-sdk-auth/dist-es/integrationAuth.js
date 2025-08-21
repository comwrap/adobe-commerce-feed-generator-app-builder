import crypto from 'crypto';
import OAuth1a from "oauth-1.0a";
export function getOAuthHeader({ consumerKey, consumerSecret, }) {
    return new OAuth1a({
        consumer: {
            key: consumerKey,
            secret: consumerSecret,
        },
        signature_method: 'HMAC-SHA256',
        hash_function: (baseString, key) => crypto.createHmac('sha256', key).update(baseString).digest('base64'),
    });
}
