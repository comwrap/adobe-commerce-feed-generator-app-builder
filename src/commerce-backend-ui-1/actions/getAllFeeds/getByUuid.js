const { Core } = require('@adobe/aio-sdk')
const stateLib = require('@adobe/aio-lib-state')
const { errorResponse } = require('./../utils.js')

// main function that will be executed by Adobe I/O Runtime
async function main (params) {
  // create a Logger
  const logger = Core.Logger('main', { level: params.LOG_LEVEL || 'info' })

  try {
    const state = await stateLib.init()
    const uuid = params.uuid  

    let feedsInformation = await state.get('feeds_' + uuid) || 0;

    if (feedsInformation === 0) {
      feedsInformation = {}
    } else {
      feedsInformation['value'] = JSON.parse(feedsInformation['value']);
    }

    const response = {
      statusCode: 200,
      body: feedsInformation
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
