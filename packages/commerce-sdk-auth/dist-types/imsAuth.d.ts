export interface ImsAuthParams {
    host?: string;
    clientId: string;
    clientSecret: string;
    scopes: Array<string>;
}
interface ImsTokenResponse {
    access_token: string;
    token_type: string;
    expires_in: number;
    expires_at: string;
}
/**
 * Generate access token to connect with Adobe tools (e.g. IO Events)
 *
 * @param {object} params includes env parameters
 * @returns {Promise<ImsTokenResponse>} returns the access token
 * @throws {Error} in case of any failure
 */
export declare function getImsAccessToken({ clientId, clientSecret, host, scopes, }: ImsAuthParams): Promise<ImsTokenResponse>;
export {};
