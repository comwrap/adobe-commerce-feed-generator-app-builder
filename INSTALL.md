# Installation instructions

## Prerequisites

- Node.js 18+
- Adobe I/O CLI
- For PaaS integration with Admin UI: Adobe Commerce Admin UI SDK v3+ (see [Installation Guide](https://developer.adobe.com/commerce/extensibility/admin-ui-sdk/installation/))

## Adobe Console preparation

### Create a new project

Go to https://developer.adobe.com/console and create a new project from template: "App Builder"

To required environment add: 

* I/O Management API with OAuth Server-to-Server
* I/O Events
* Adobe Commerce as a Cloud Service (SaaS) - is required to manage authorization between the application and your Adobe Commerce instance.

## Installation

1. Clone the repository
2. Run `npm install` to install the dependencies
3. Copy the env.dist file into .env file: `cp env.dist .env`
4. Configure the project environment using one of the following methods:

**Option A: Download configuration from Console**

   - Go to [Adobe Developer Console](https://developer.adobe.com/console), select your Project and Environment
   - Click on "Download All" button
   - Execute `aio app use <path-to-downloaded-file>` (Merge files if you already have .env file)

**Option B: Configure via CLI**

   ```bash
   aio login
   aio console org select
   aio console project select
   aio console workspace select
   aio app use
   ```

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

**For Adobe Commerce (PaaS Only):**

> [!NOTE]
> For SaaS Installation those values are not needed and can be skipped.

These values can be copied from the Integration Details under System > Integrations in your Adobe Commerce backend.

```
COMMERCE_CONSUMER_KEY=
COMMERCE_CONSUMER_SECRET=
COMMERCE_ACCESS_TOKEN=
COMMERCE_ACCESS_TOKEN_SECRET=
```

**For Adobe Commerce (SaaS & PaaS):**

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

8. Create Event Metadata for Feed Generator. Run:
   ```bash
   aio event eventmetadata create <FEED_GENERATOR_PROVIDER_ID>
   ```
   Replace `<FEED_GENERATOR_PROVIDER_ID>` with the `id` generated in the previous step. Define event code as `feed.generate` and define description as `Generate Feed`.

9. Run `aio app deploy` to deploy the app.

10. Go to Developer console via Browser. Open your application. Click on "Add Service" -> Event -> 3rd Party Custom Events -> And select your provider and event subscription. In Receiver define "Runtime action" as `processGeneration` action.

11. The app is ready to use. Please save the link to your application environment. Additionally, you can replicate all steps in your production environment and publish the application, so it will be available on your exchange dashboard.

## Adding to Adobe Admin UI (SaaS)

For Adobe Commerce SaaS, follow the steps below to add the deployed application to the Commerce Admin

1. Go to Stores -> Configuration in your Adobe Commerce Admin
2. Go to Adobe Services -> Admin UI SDK
3. Click "Configure extensions" and choose respective Environment and Application.
4. Save changes.

For more information and troubleshooting please go to: https://developer.adobe.com/commerce/extensibility/admin-ui-sdk/configuration/

## Adding to Adobe Admin UI (PaaS)

For Adobe Commerce PaaS (On-Premise/Cloud), you need to install and configure the Admin UI SDK module.

### Install the Admin UI SDK Module

1. Install the module via Composer:

```bash
composer require "magento/commerce-backend-sdk": ">=3.0"
```

2. Enable the module (for On-premises installation):

```bash
bin/magento module:enable Magento_AdminUiSdk
bin/magento setup:upgrade
bin/magento cache:clean
```

### Configure the Admin UI SDK

Follow the official Adobe documentation for configuration steps:
- [Admin UI SDK Configuration](https://developer.adobe.com/commerce/extensibility/admin-ui-sdk/configuration/)

For detailed installation instructions, please refer to:
- [Admin UI SDK Installation](https://developer.adobe.com/commerce/extensibility/admin-ui-sdk/installation/)