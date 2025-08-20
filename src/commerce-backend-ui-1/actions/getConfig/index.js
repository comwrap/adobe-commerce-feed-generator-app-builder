const { Core } = require('@adobe/aio-sdk')
const { errorResponse } = require('./../utils.js')
const { fromParams } = require('../auth')

// main function that will be executed by Adobe I/O Runtime
async function main (params) {
  // create a Logger
  const logger = Core.Logger('main', { level: params.LOG_LEVEL || 'info' })

  const authParams = fromParams(params)

  try {

    responseData = {};
    responseData.ims = false
    if (authParams.ims !== undefined && authParams.ims !== null) {
        responseData.ims = true
    }

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
