# Installation instructions

## Prerequisites

- Node.js 18+
- Adobe I/O CLI

## Adobe Console preparation

### Create a new project

Go to https://developer.adobe.com/console and create a new project from template: "App Builder"

To required environment add: 

* I/O Management API with OAuth Server-to-Server
* I/O Events


### Adobe API Mesh (Optional)

1. Add "API Mesh" service to your environment.
2. Rename file `adobe-api/mesh/mesh.json.dist` into `adobe-api/mesh/mesh.json`.
3. Change required options inside `adobe-api/mesh/mesh.json`.
    * AC-URL (This should be your Adobe Commerce system's base URL to GQL Endpoint)

4. Provision Mesh by using this file with `aio api-mesh create adobe-api/mesh/mesh.json`.

## Installation

1. Clone the repository
2. Run `npm install` to install the dependencies
3. Go to [Project](https://developer.adobe.com/console), select Environment and click on "Download All" button.
4. Copy the env.dist file into .env file. `cp env.dist .env`
4. Execute `aio app use <path-to-file>` with file you just downloaded. (Merge files if you already have .env file)
5. Edit `.env` file with your project details.
Set following variables: 

```
AC_GRAPHQL_URL= // Your GraphQL URL 
AC_DEFAULT_STORE_CODE= // Default Adobe Commerce Store Code
AC_ENVIRONMENT_ID= // Your Environment ID for Catalog Service if used (optional)
COMMERCE_BASE_URL= // Commerce instance REST API Url
```

> [!NOTE]
> When configuring the `COMMERCE_BASE_URL` environment variable, the format differs between PaaS and SaaS:
>
> For PaaS (On-Premise/Cloud):
>
> - Must include your base site URL + `/rest/` suffix
> - Example: `https://[environment-name].us-4.magentosite.cloud/rest/`
>
> For SaaS:
>
> - Must be the REST API endpoint provided by Adobe Commerce
> - Example: `https://na1-sandbox.api.commerce.adobe.com/[tenant-id]/`
>
> Make sure to use your actual environment name or tenant ID in the URL. The examples above use placeholder values.


6. Configure Adobe Commerce Authorization

In env.dist file you will find set of Auth parameters.

**For Adobe Commerce PaaS:**

These values can be copied from the Integration Details under System > Integrations in your Adobe Commerce backend

```
COMMERCE_CONSUMER_KEY=
COMMERCE_CONSUMER_SECRET=
COMMERCE_ACCESS_TOKEN=
COMMERCE_ACCESS_TOKEN_SECRET=
```

**For Adobe Commerce SaaS:**

Documentation how to get these values is available here: https://developer.adobe.com/developer-console/docs/guides/authentication/ServerToServerAuthentication/implementation

```
OAUTH_CLIENT_ID=
OAUTH_CLIENT_SECRET=
OAUTH_TECHNICAL_ACCOUNT_ID=
OAUTH_TECHNICAL_ACCOUNT_EMAIL=
OAUTH_ORG_ID=
OAUTH_SCOPES=AdobeID, openid, read_organizations, additional_info.projectedProductContext, additional_info.roles, adobeio_api, read_client_secret, manage_client_secrets, event_receiver_api
```

7. Create Event Provider for Feed Generator. Run `aio event provider create` and define name. Copy `id` from output.
Add to `.env` line `FEED_GENERATOR_PROVIDER_ID=<id>`

8. Create Event Metadata for Feed Generator. Run `aio event eventmetadata create PROVIDERID`. Define event code as `feed.generate` and define description as `Generate Feed`.

9. Run `aio app deploy` to deploy the app.

10. Go To your application environment via Browser. Click on "Add Service" -> Event -> 3rd Party Custom Events -> And select your provider and event subscription. In Receiver define "Runtime action" as `processGeneration` action.

11. The app is ready to use. Please save the link to your application environment. Additionally, you can replicate all steps in your production environment and publish the application, so it will be available on your exchange dashboard.

