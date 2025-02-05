const {v4: uuidv4} = require('uuid');
const fetch = require('node-fetch')
const {Core} = require('@adobe/aio-sdk')
const stateLib = require('@adobe/aio-lib-state')
const {errorResponse, getBearerToken, stringParameters, checkMissingRequestInputs} = require('./../utils.js')

// main function that will be executed by Adobe I/O Runtime
async function main(params) {
    // create a Logger
    const logger = Core.Logger('main', {level: params.LOG_LEVEL || 'info'})

    try {
        const state = await stateLib.init()

        const feedsInformation = await state.get('feeds_list') || {"value": {}}

        let feedsListData = {}

        // for (let i = 1; i < Object.keys(feedsInformation['value']).length; i++) {
        //   const feedJson = await state.get('feeds_' + feedsInformation['value'][i]) || 0
        //   feedsListData[feedsInformation['value'][i]] = feedJson
        // }

        const feedUuids = Object.values(feedsInformation['value']);
        let i = 1;
        for (const uuid of feedUuids) {
            const feedJson = await state.get('feeds_' + uuid)
            if (typeof feedJson === 'undefined' || feedJson === '' || feedJson === null) {
                continue;
            }
            feedsListData[uuid] = feedJson
            i++;
        }

        const response = {
            statusCode: 200,
            body: feedsListData
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
