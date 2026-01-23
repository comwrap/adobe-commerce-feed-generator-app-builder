const { Core, Events } = require('@adobe/aio-sdk')
const uuid = require('uuid')

const { getImsAccessToken } = require('@adobe/commerce-sdk-auth')
const { fromParams } = require('../auth')

const {
  CloudEvent
} = require("cloudevents");
const { errorResponse, getBearerToken, checkMissingRequestInputs } = require('./../utils.js')

// main function that will be executed by Adobe I/O Runtime
async function main (params) {
  // create a Logger
  const logger = Core.Logger('main', { level: params.LOG_LEVEL || 'info' })

  try {

    params['payload'] = {"uuid": params.uuid}

    // check for missing request input parameters and headers
    const requiredParams = ['apiKey', 'providerId', 'eventCode', 'payload']
    const requiredHeaders = ['Authorization', 'x-gw-ims-org-id']
    const errorMessage = checkMissingRequestInputs(params, requiredParams, requiredHeaders)
    if (errorMessage) {
      // return and log client errors
      logger.error('Missing required inputs:', errorMessage)
      return errorResponse(400, errorMessage, logger)
    }

    // extract the user Bearer token from the Authorization header
    let token = getBearerToken(params)
    
    const authParams = fromParams(params, true)
    if (authParams?.ims) {
        const imsResponse = await getImsAccessToken(authParams.ims)
        token = imsResponse.access_token
        logger.info('Got IMS access token')
    } else {
        logger.info('NOT using IMS auth - using Bearer token from header')
    }

    // initialize the client
    const orgId = params.__ow_headers['x-gw-ims-org-id']
    const eventsClient = await Events.init(orgId, params.apiKey, token)

    const cloudEvent = createCloudEvent(params.providerId, params.eventCode, params.payload)

    const published = await eventsClient.publishEvent(cloudEvent)
    
    let statusCode = 200
    if (published === 'OK') {
      logger.info('Published successfully to I/O Events')
    } else if (published === undefined) {
      logger.info('Published to I/O Events but there were not interested registrations')
      statusCode = 204
    }

    const response = {
      statusCode: statusCode,
      body: published
    }

    return response

  } catch (error) {
    // return with 500
    return errorResponse(500, 'server error: ' + error, logger)
  }
}

function createCloudEvent(providerId, eventCode, payload) {
  let cloudevent = new CloudEvent({
    source: 'urn:uuid:' + providerId,
    type: eventCode,
    datacontenttype: "application/json",
    data: payload,
    id: uuid.v4()
  });
  return cloudevent
}

exports.main = main