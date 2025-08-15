import { ClientCredentials } from 'simple-oauth2';
export async function getImsAccessToken({ clientId, clientSecret, host = 'https://ims-na1.adobelogin.com', scopes, }) {
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
    const client = new ClientCredentials(config);
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
