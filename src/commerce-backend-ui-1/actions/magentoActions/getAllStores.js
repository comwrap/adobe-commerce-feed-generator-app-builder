const { Core } = require('@adobe/aio-sdk')
const { errorResponse, getConfigValue } = require('./../utils.js')
const { getClient } = require('../oauth1a')

// main function that will be executed by Adobe I/O Runtime
async function main (params) {
  // Workaround: Copy params to process.env for @adobe/aio-commerce-lib-config
  // The library reads CONFIG_ENCRYPTION_KEY from process.env to decrypt password fields
  if (params.CONFIG_ENCRYPTION_KEY) {
    process.env.CONFIG_ENCRYPTION_KEY = params.CONFIG_ENCRYPTION_KEY
  }

  // create a Logger
  const logger = Core.Logger('main', { level: params.LOG_LEVEL || 'info' })

  try {
    logger.info(`=== getAllStores starting ===`)

    // Fetch configuration values (uses global scope)
    const commerceBaseUrl = await getConfigValue('commerce-base-url', logger)
    const commerceConsumerKey = await getConfigValue('commerce-consumer-key', logger)
    const commerceConsumerSecret = await getConfigValue('commerce-consumer-secret', logger)
    const commerceAccessToken = await getConfigValue('commerce-access-token', logger)
    const commerceAccessTokenSecret = await getConfigValue('commerce-access-token-secret', logger)
    const oauthClientId = await getConfigValue('oauth-client-id', logger)
    const oauthClientSecret = await getConfigValue('oauth-client-secret', logger)
    const oauthScopes = await getConfigValue('oauth-scopes', logger)

    logger.info(`=== Config values retrieved ===`)
    logger.info(`commerceBaseUrl: ${commerceBaseUrl ? 'SET' : 'EMPTY'}`)
    logger.info(`commerceConsumerKey: ${commerceConsumerKey ? 'SET' : 'EMPTY'}`)
    logger.info(`commerceConsumerSecret: ${commerceConsumerSecret ? 'SET' : 'EMPTY'}`)
    logger.info(`commerceAccessToken: ${commerceAccessToken ? 'SET' : 'EMPTY'}`)
    logger.info(`commerceAccessTokenSecret: ${commerceAccessTokenSecret ? 'SET' : 'EMPTY'}`)
    logger.info(`oauthClientId: ${oauthClientId ? 'SET' : 'EMPTY'}`)
    logger.info(`oauthClientSecret: ${oauthClientSecret ? 'SET' : 'EMPTY'}`)
    logger.info(`oauthScopes: ${oauthScopes ? 'SET' : 'EMPTY'}`)

    // Build params object for auth
    const configParams = {
      ...params,
      COMMERCE_CONSUMER_KEY: commerceConsumerKey,
      COMMERCE_CONSUMER_SECRET: commerceConsumerSecret,
      COMMERCE_ACCESS_TOKEN: commerceAccessToken,
      COMMERCE_ACCESS_TOKEN_SECRET: commerceAccessTokenSecret,
      OAUTH_CLIENT_ID: oauthClientId,
      OAUTH_CLIENT_SECRET: oauthClientSecret,
      OAUTH_SCOPES: oauthScopes
    }

    logger.info(`Creating OAuth client...`)

    const client = getClient(
      {
        url: commerceBaseUrl,
        params: configParams
      },
      logger
    )

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
