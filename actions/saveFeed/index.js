const { v4: uuidv4 } = require('uuid');
const { Core } = require('@adobe/aio-sdk')
const stateLib = require('@adobe/aio-lib-state')
const { errorResponse } = require('./../utils.js')

// main function that will be executed by Adobe I/O Runtime
async function main (params) {
  // create a Logger
  const logger = Core.Logger('main', { level: params.LOG_LEVEL || 'info' })

  try {

    const state = await stateLib.init()

    let uuid = uuidv4()
    if (params.uuid) {
      uuid = params.uuid
    } else {

      let feedsInformation = await state.get('feeds_list') || {"value": '{}'}
      feedsInformation['value'] = JSON.parse(feedsInformation['value'])

      const newFeedsList = feedsInformation['value']

      if (Object.keys(newFeedsList).length === 0) {
        newFeedsList[0] = uuid
      } else {

        let maxIndex = Object.keys(newFeedsList).reduce((acc, cur) => {
          const index = parseInt(cur);
          if (!isNaN(index) && index > acc) {
            return index;
          }
          return acc;
        }, -1);
        newFeedsList[maxIndex + 1] = uuid
      }
      /**
       * Re-save feeds list
       */
      await state.put('feeds_list', JSON.stringify(newFeedsList), { ttl: stateLib.MAX_TTL })

    }
    
    /**
     * Save Feed data to own value
     */
    params['feed'].created_at = new Date()
    params['feed'].generated_at = ""
    params['feed'].status = "pending"
    await state.put('feeds_' + uuid, JSON.stringify(params['feed']), { ttl: stateLib.MAX_TTL })

    params['feed'].uuid = uuid

    const response = {
      statusCode: 200,
      body: params['feed']
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
