const {Core} = require('@adobe/aio-sdk')
const stateLib = require('@adobe/aio-lib-state')
const {errorResponse} = require('./../utils.js')

// main function that will be executed by Adobe I/O Runtime
async function main(params) {
    // create a Logger
    const logger = Core.Logger('main', {level: params.LOG_LEVEL || 'info'})

    try {
        const state = await stateLib.init()

        let feedsInformation = await state.get('feeds_list') || {"value": "{}"};

        let feedsListData = {}
        const feedUuids = Object.values(JSON.parse(feedsInformation['value']));
        for (const uuid of feedUuids) {
            let feedJson = await state.get('feeds_' + uuid)
            if (typeof feedJson === 'undefined' || feedJson === '' || feedJson === null) {
                continue;
            }
            feedsListData[uuid] = feedJson
            feedsListData[uuid].value = JSON.parse(feedJson['value'])
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
