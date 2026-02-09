import { defineConfig } from "@adobe/aio-commerce-lib-app/config";

export default defineConfig({
  metadata: {
    id: "feedGenerator",
    displayName: "Feed Generator",
    description: "Feed Generator is a service that simplifies the process of generating product feeds.",
    version: "2.1.0",
  },
  businessConfig: {
    schema: [
      // ═══════════════════════════════════════════════════════════════
      // General Configuration
      // ═══════════════════════════════════════════════════════════════
      {
        name: "ac-graphql-url",
        label: "Adobe Commerce GraphQL URL",
        description: "Your Adobe Commerce GraphQL endpoint URL",
        type: "url"
      },
      {
        name: "ac-default-store-code",
        label: "Default Store Code",
        description: "Default Store to use for default setup",
        type: "text",
        default: "default",
      },
      {
        name: "commerce-base-url",
        label: "Commerce Base URL",
        description: "REST API URL. Commerce base URL should finish with slash '/'",
        type: "url"
      },
      {
        name: "feed-generator-provider-id",
        label: "Feed Generator Provider ID",
        description: "Event provider ID for feed generation",
        type: "text",
        default: "",
      },

      // ═══════════════════════════════════════════════════════════════
      // Commerce OAuth Configuration
      // These values can be copied from Integration Details under
      // System > Integrations in Adobe Commerce Admin
      // ═══════════════════════════════════════════════════════════════
      {
        name: "commerce-consumer-key",
        label: "Commerce Consumer Key",
        description: "Consumer Key from Commerce Integration",
        type: "password",
      },
      {
        name: "commerce-consumer-secret",
        label: "Commerce Consumer Secret",
        description: "Consumer Secret from Commerce Integration",
        type: "password",
      },
      {
        name: "commerce-access-token",
        label: "Commerce Access Token",
        description: "Access Token from Commerce Integration",
        type: "password",
      },
      {
        name: "commerce-access-token-secret",
        label: "Commerce Access Token Secret",
        description: "Access Token Secret from Commerce Integration",
        type: "password",
      },

      // ═══════════════════════════════════════════════════════════════
      // App Builder OAuth Configuration (IMS)
      // Server-to-Server OAuth credentials from Adobe Developer Console
      // More info: https://developer.adobe.com/developer-console/docs/guides/authentication/ServerToServerAuthentication/implementation
      // ═══════════════════════════════════════════════════════════════
      {
        name: "oauth-client-id",
        label: "OAuth Client ID",
        description: "Client ID from Adobe Developer Console",
        type: "password",
      },
      {
        name: "oauth-client-secret",
        label: "OAuth Client Secret",
        description: "Client Secret from Adobe Developer Console",
        type: "password",
      },
      {
        name: "oauth-technical-account-id",
        label: "OAuth Technical Account ID",
        description: "Technical Account ID from Adobe Developer Console",
        type: "text",
        default: "",
      },
      {
        name: "oauth-technical-account-email",
        label: "OAuth Technical Account Email",
        description: "Technical Account Email from Adobe Developer Console",
        type: "text",
        default: "",
      },
      {
        name: "oauth-org-id",
        label: "OAuth Organization ID",
        description: "Organization ID (IMS Org ID) from Adobe Developer Console",
        type: "text",
        default: "",
      },
      {
        name: "oauth-scopes",
        label: "OAuth Scopes",
        description: "OAuth scopes for IMS authentication",
        type: "text",
        default: "AdobeID, openid, read_organizations, additional_info.projectedProductContext, additional_info.roles, adobeio_api, read_client_secret, manage_client_secrets, event_receiver_api",
      },
    ],
  },
});