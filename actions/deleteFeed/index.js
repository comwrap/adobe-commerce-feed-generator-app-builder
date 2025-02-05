const {v4: uuidv4} = require('uuid');
const fetch = require('node-fetch')
const {Core} = require('@adobe/aio-sdk')
const stateLib = require('@adobe/aio-lib-state')
const {errorResponse, getBearerToken, stringParameters, checkMissingRequestInputs} = require('./../utils.js')

// delete feed by uuid
async function main(params) {
    // create a Logger
    const logger = Core.Logger('main', {level: params.LOG_LEVEL || 'info'})

    try {
        const state = await stateLib.init()
        const uuid = params.uuid
        const responseData = {
            statusCode: 200,
            body: true
        }

        if (uuid === null || typeof uuid == 'undefined' || uuid == 'undefined' || uuid == undefined) {
            return responseData
        }
        const [deleteResult, feedsInformation] = await Promise.all([
            state.delete('feeds_' + uuid),
            state.get('feeds_list') || {"value": {}}
        ])

        // remove uuid from feed list
        const feedsList = feedsInformation['value']
        const indexToRemove = Object.values(feedsList).indexOf(uuid);
        if (indexToRemove > -1) {
            delete feedsList[indexToRemove];
            await state.put('feeds_list', feedsList, { ttl: -1 });
        }

        return responseData
    } catch (error) {
        // log any server errors
        logger.error(error)
        // return with 500
        return errorResponse(500, 'server error', logger)
    }
}

exports.main = main
