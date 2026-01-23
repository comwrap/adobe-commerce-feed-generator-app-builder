const { Core } = require('@adobe/aio-sdk')
const { errorResponse } = require('../utils.js')
const zlib = require('zlib')
const { getSchema } = require('../acGqlLib/schema.js')

// main function that will be executed by Adobe I/O Runtime
async function main (params) {
  // create a Logger
  const logger = Core.Logger('main', { level: params.LOG_LEVEL || 'info' })

  try {

    let schema = await getSchema(params)
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