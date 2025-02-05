const { Core } = require('@adobe/aio-sdk')
const { errorResponse } = require('./../utils.js')
const { callMeshGql } = require('./../meshGql.js')

// main function that will be executed by Adobe I/O Runtime
async function main (params) {
  // create a Logger
  const logger = Core.Logger('main', { level: params.LOG_LEVEL || 'info' })

  try {

    let gqlQuery = "query {\n" +
        "  GetV1StoreWebsites {\n" +
        "    ... on store_data_website_interface {\n" +
        "      id\n" +
        "      code\n" +
        "      name\n" +
        "      default_group_id\n" +
        "    }\n" +
        "  }\n" +
        "  GetV1StoreStoreViews {\n" +
        "    ... on store_data_store_interface {\n" +
        "      id\n" +
        "      code\n" +
        "      name\n" +
        "      website_id\n" +
        "      store_group_id\n" +
        "      is_active\n" +
        "    }\n" +
        "  }\n" +
        "}\n";

    const storeWebsites = await callMeshGql(gqlQuery, params);
    // storeWebsites = JSON.parse(storeWebsites)//callMeshGql() already return json object

    let storeViews = storeWebsites.data.GetV1StoreStoreViews;
    let websites = storeWebsites.data.GetV1StoreWebsites;

    let websitesToStoreViewsList = [];

    websites.forEach((website) => {
      if(website.id != 0) {
        let storeItems = [];
        storeViews.forEach((storeView) => {
          if (storeView.website_id === website.id) {
            storeItems.push(storeView);
          }
        });

        websitesToStoreViewsList.push({
          name: website.name,
          id: website.id,
          items: storeItems,
        });
      }
    });

    const responseData = JSON.stringify(websitesToStoreViewsList)

    const response = {
      statusCode: 200,
      body: responseData
    }

    return response

  } catch (error) {
    // log any server errors
    logger.error(error)
    // return with 500
    return errorResponse(500, error.message, logger)
  }
}

exports.main = main
