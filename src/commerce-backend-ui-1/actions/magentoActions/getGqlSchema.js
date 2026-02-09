const { Core } = require('@adobe/aio-sdk')
const { errorResponse, getConfigValue } = require('../utils.js')
const zlib = require('zlib')
const { getSchema } = require('../acGqlLib/schema.js')

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
    // Fetch configuration values (uses global scope)
    const acGraphqlUrl = await getConfigValue('ac-graphql-url', logger)

    // Build params object with config values
    const configParams = {
      ...params,
      AC_GRAPHQL_URL: acGraphqlUrl
    }

    let schema = await getSchema(configParams)
    const responseData = JSON.stringify(schema)

    //compress schema because it could be more than 1MB
    const compressed = zlib.deflateRawSync(responseData)
    const compressedString = compressed.toString('base64')

    const response = {
      statusCode: 200,
      body: compressedString
    }

    return response

  } catch (error) {
    // log any server errors
    logger.error(error)
    // return with 500
    return errorResponse(500, error, logger)
  }
}

exports.main = main