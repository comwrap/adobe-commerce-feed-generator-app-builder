"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getImsAccessToken = getImsAccessToken;
const simple_oauth2_1 = require("simple-oauth2");
async function getImsAccessToken({ clientId, clientSecret, host = 'https://ims-na1.adobelogin.com', scopes, }) {
    const config = {
        client: {
            id: clientId,
            secret: clientSecret,
        },
        auth: {
            tokenHost: host,
            tokenPath: '/ims/token/v3',
        },
        options: {
            bodyFormat: 'form',
            authorizationMethod: 'body',
        },
    };
    const client = new simple_oauth2_1.ClientCredentials(config);
    const tokenParams = {
        scope: scopes,
    };
    try {
        const accessToken = await client.getToken(tokenParams);
        return accessToken.token;
    }
    catch (error) {
        throw new Error(`Unable to get access token ${error.message}`);
    }
}
