import OAuth1a from "oauth-1.0a";
export interface IntegrationAuthParams {
    consumerKey: string;
    consumerSecret: string;
}
export declare function getOAuthHeader({ consumerKey, consumerSecret, }: IntegrationAuthParams): OAuth1a;
