const { Core } = require('@adobe/aio-sdk')
const { errorResponse } = require('./../utils.js')
const { getClient } = require('../oauth1a')


// main function that will be executed by Adobe I/O Runtime
async function main (params) {
  // create a Logger
  const logger = Core.Logger('main', { level: params.LOG_LEVEL || 'info' })

  const client = getClient(
    {
      url: params.COMMERCE_BASE_URL,
      params
    },
    logger
  )

  try {

      const storeViews = await client.get(
        `store/storeViews`,
        ''
      )
      const storeGroups = await client.get(
        `store/storeGroups`,
        ''
      )
      const websites = await client.get(
        `store/websites`,
        ''
      )

    let websitesToStoreViewsList = [];

    websites.forEach((website) => {
      if(website.id != 0) {
        let storeItems = [];
        storeViews.forEach((storeView) => {
          let storeViewId = storeView.code;
          storeGroups.forEach((storeGroup) => {
            if (storeView.store_group_id === storeGroup.id) {
              storeViewId = storeViewId + "||" + storeGroup.code;
            }
          });
          if (storeView.website_id === website.id) {
            storeViewId = storeViewId + "||" + website.code;
            storeView.id = storeViewId;
            storeView.code = storeViewId;
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
