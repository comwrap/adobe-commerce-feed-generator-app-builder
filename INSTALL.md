# Installation instructions

## Prerequisites

- Node.js 18+
- Adobe I/O CLI

## Adobe Console preparation

### Create a new project

Go to console.adobe.io and create a new project from template: "App Builder"

To required environment add: 

* I/O Management API with OAuth Server-to-Server
* I/O Events


### Adobe Api Mesh (Optional)

1. Add "Api Mesh" service to your environment.
2. Rename file `adobe-api/mesh/mesh.json.dist` into `adobe-api/mesh/mesh.json`.
3. Change required options inside `adobe-api/mesh/mesh.json`.
    * MAGENTO-URL (This should be your Adobe Commerce system's base URL.)
    * MAGENTO-TOKEN 

    You can obtain the token by following these [steps](https://experienceleague.adobe.com/en/docs/commerce-admin/systems/integrations). Copy the Access Token value once generated. Additionally, you need to enable the "[Integration Token](https://experienceleague.adobe.com/en/docs/commerce-admin/systems/integrations)" functionality if it is not enabled yet. The generated token does not expire, but it can be updated if necessary.

3. Provision Mesh by using this file with `aio api-mesh create adobe-api/mesh/mesh.json`.

## Installation

1. Clone the repository
2. Run `npm install` to install the dependencies
3. Go to [Project](https://developer.adobe.com/console), select Environment and click on "Download All" button.
4. Execute `aio app use <path-to-file>` with file you just downloaded. (Merge files if you already have .env file)
5. Edit `.env` file with your project details.
Set following variables: 

```
AC_GRAPHQL_URL= // Your Mesh URL 
AC_API_TOKEN= // Adobe Commerce Integration Bearer Token
AC_DEFAULT_STORE_CODE= // Default Adobe Commerce Store Code
```

6. Create Event Provider for Feed Generator. Run `aio event provider create` and define name. Copy `id` from output.
Add to `.env` line `FEED_GENERATOR_PROVIDER_ID=<id>`

7. Create Event Metadata for Feed Generator. Run `aio event eventmetadata create PROVIDERID`. Define event code as `feed.generate` and define description as `Generate Feed`.

8. Run `aio app deploy` to deploy the app.

9. Go To your application environment via Browser. Click on "Add Service" -> Event -> 3rd Party Custom Events -> And select your provider and event subscription. In Receiver define "Runtime action" as `processGeneration` action.

10. The app is ready to use. Please save the link to your application environment. Additionally, you can replicate all steps in your production environment and publish the application, so it will be available on your exchange dashboard.

