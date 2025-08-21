const {Core} = require('@adobe/aio-sdk')
const stateLib = require('@adobe/aio-lib-state')
const {errorResponse} = require('./../utils.js')

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
        
        let feedsInformation = await state.get('feeds_list') || {"value": "{}"};

        await state.delete('feeds_' + uuid);

        // remove uuid from feed list
        const feedsList = JSON.parse(feedsInformation['value'])
        const indexToRemove = Object.values(feedsList).indexOf(uuid);
        if (indexToRemove > -1) {
            delete feedsList[indexToRemove];
            await state.put('feeds_list', JSON.stringify(feedsList), { ttl: stateLib.MAX_TTL });
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
