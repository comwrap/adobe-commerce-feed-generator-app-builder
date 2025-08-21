const {Core} = require('@adobe/aio-sdk')
const stateLib = require('@adobe/aio-lib-state')
const {generateFeed} = require('./../utils/generation.js')
const {parse} = require("date-fns");
const {ActionResponse} = require('./../utils/actionResponse.js');

// main function that will be executed by Adobe I/O Runtime
async function main(params) {
    // create a Logger
    const logger = Core.Logger('main', {level: params.LOG_LEVEL || 'info'})
    logger.info('generateByCron started')
    try {

        logger.info('generateByCron before state init')
        const state = await stateLib.init()
        logger.info('generateByCron after state init')

        const processFeed = async (uuid) => {
            
            logger.info('generateByCron start UUID is: '+uuid)

            let feedsInformation = await state.get('feeds_' + uuid) || null;

            if (feedsInformation == null) {
                return;
            } else {
                feedsInformation['value'] = JSON.parse(feedsInformation['value']);
            }

            logger.info('generateByCron processFeed: ' + uuid);

            if (feedsInformation['value'] !== undefined) {
                const scheduleType = feedsInformation['value']['schedule_type'];
                if (scheduleType === 'schedule') {
                    const days = feedsInformation['value']['schedule_days'];
                    const times = feedsInformation['value']['schedule_times'];
                    const scheduledDateTimes = getDateTimes(days, times);
                    if (scheduledDateTimes.length > 0) {
                        const currentDate = new Date();
                        const pastDate = new Date(currentDate.getTime() - 30 * 60 * 1000); // 30 minutes into the past
                        for (const daytime of scheduledDateTimes) {
                            const optionDate = parse(daytime, "eeee h:mm a", new Date());

                            // Check if the option is between the past time and the current time
                            if (optionDate >= pastDate && optionDate <= currentDate) {
                                logger.info('generateByCron for uuid: ' + uuid);
                                //don't need to use await for async function because we don't want to wait when feed generation complete
                                //also we don't need result because generateFeed should be responsible for handling errors and logs
                                generateFeed(uuid, params);
                            }
                        }
                    }
                }
            }
        };

        const processFeeds = async (feedsList) => {
            for (const uuid of Object.values(feedsList)) {
                await processFeed(uuid);
            }
        };

        let feedsList = await state.get('feeds_list') || null
        if (feedsList == null) {
            return new ActionResponse(200, "Not found any feeds");
        } else {
            feedsList['value'] = JSON.parse(feedsList['value']);
        }
        processFeeds(feedsList['value'])
            .then(() => {
                return new ActionResponse(200, "Feeds processed");
            })
            .catch(() => {
                return new ActionResponse(505, "Error during generate feeds. Check logs for details");
            });


    } catch (error) {
        // log any server errors
        logger.error(error)
        return new ActionResponse(505, error.message);
    }

    function getDateTimes(feedDays, feedTimes) {
        const dateTimes = [];
        if (feedDays !== undefined
            && typeof feedDays !== 'undefined'
            && feedDays !== ''
            && feedTimes !== undefined
            && typeof feedTimes !== 'undefined'
            && feedTimes !== ''
        ) {
            feedDays = feedDays.split(",");
            feedTimes = feedTimes.split(",");
            for (const day of feedDays) {
                for (const time of feedTimes) {
                    dateTimes.push(`${day} ${time}`);
                }
            }
        }
        return dateTimes;
    }
}

exports.main = main