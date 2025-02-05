const { v4: uuidv4 } = require('uuid');
const fetch = require('node-fetch')
const { Core } = require('@adobe/aio-sdk')
const stateLib = require('@adobe/aio-lib-state')
const { errorResponse, getBearerToken, stringParameters, checkMissingRequestInputs } = require('./../utils.js')

// main function that will be executed by Adobe I/O Runtime
async function main (params) {
  // create a Logger
  const logger = Core.Logger('main', { level: params.LOG_LEVEL || 'info' })

  try {
    const state = await stateLib.init()
    const uuid = params.uuid  
    let feedInformation = await state.get('feeds_' + uuid) || 0

    if (feedInformation === 0) {
      feedInformation = {}
    }

    const response = {
      statusCode: 200,
      body: feedInformation
    }
    return response
  
  } catch (error) {
    // log any server errors
    logger.error(error)
    // return with 500
    return errorResponse(500, 'server error', logger)
  }
}

exports.main = main
