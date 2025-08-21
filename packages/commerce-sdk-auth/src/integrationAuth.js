"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOAuthHeader = getOAuthHeader;
var crypto_1 = require("crypto");
var oauth_1_0a_1 = require("oauth-1.0a");
function getOAuthHeader(_a) {
    var consumerKey = _a.consumerKey, consumerSecret = _a.consumerSecret;
    return new oauth_1_0a_1.default({
        consumer: {
            key: consumerKey,
            secret: consumerSecret,
        },
        signature_method: 'HMAC-SHA256',
        hash_function: function (baseString, key) { return crypto_1.default.createHmac('sha256', key).update(baseString).digest('base64'); },
    });
}
