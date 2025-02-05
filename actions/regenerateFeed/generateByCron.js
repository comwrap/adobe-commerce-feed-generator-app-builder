const {Core} = require('@adobe/aio-sdk')
const stateLib = require('@adobe/aio-lib-state')
const {generateFeed} = require('./../utils/generation.js')
const {format, parse} = require("date-fns");
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

            const feedsInformation = await state.get('feeds_' + uuid) || null;

            // const feedsInformation = {"value" : {
            //     "created_at": "2023-07-28T14:25:00.497Z",
            //     "feedBody": "<item>\n  <g:id>{{sku}}</g:id>\n  <title>{{name}}</title>\n  <description>{{description.html}}</description>\n  <link>https://eventing-clzaefa-bm5l4hpp6cb3s.eu-4.magentosite.cloud/{{url_key}}</link>\n  <g:image_link>{{thumbnail.url}}</g:image_link>\n  <g:condition>new</g:condition>\n  <g:price>{{price_range.maximum_price.final_price.value}}</g:price>\n  <g:tax>\n    <g:country>DE</g:country>\n    <g:rate>0</g:rate>\n    <g:tax_ship>y</g:tax_ship>\n  </g:tax>\n  <g:shipping>\n    <g:country>DE</g:country>\n    <g:price>0 EUR</g:price>\n  </g:shipping>\n  <g:availability>In Stock</g:availability>\n  <g:identifier_exists>TRUE</g:identifier_exists>\n  <g:product_type>Category will come soon</g:product_type>\n  <g:sale_price>{{price_range.minimum_price.final_price.value}}</g:sale_price>\n  <g:additional_image_link>{{media_gallery.url count=5}}</g:additional_image_link>\n</item>",
            //     "feedFooter": "</channel> </rss>",
            //     "feedHeader": "<?xml version=\"1.0\"?> <rss version=\"2.0\" xmlns:g=\"http://base.google.com/ns/1.0\"><channel> <created_at>{{DATE}}</created_at>",
            //     "feedName": "Bundverlag Template",
            //     "feed_type": "xml",
            //     "filterQuery": "{\n   \"sku\": {\n      \"eq\": \"TR-710041772\"\n   }\n}",
            //     "generated_at": "",
            //     "schedule_days": "tuesday,wednesday,monday,thursday,friday,saturday,sunday",
            //     "schedule_times": "9:30 PM,9:00 PM,10:30 PM,12:00 AM,12:30 AM,1:00 AM,1:30 AM,2:00 AM,2:30 AM,3:00 AM,3:30 AM,4:00 AM,4:30 AM,5:00 AM,5:30 AM,6:00 AM,6:30 AM,7:00 AM,7:30 AM,8:00 AM,8:30 AM,9:00 AM,9:30 AM,10:00 AM,10:30 AM,11:00 AM,11:30 AM,12:00 PM,12:30 PM,1:00 PM,1:30 PM,2:00 PM,2:30 PM,3:00 PM,3:30 PM,4:00 PM,4:30 PM,5:00 PM,5:30 PM,6:00 PM,6:30 PM,7:00 PM,7:30 PM,8:00 PM,8:30 PM,10:00 PM,11:00 PM,11:30 PM",
            //     "schedule_type": "schedule",
            //     "searchQuery": "",
            //     "status": "pending",
            //     "store_code": "default",
            //     "id": "e7061b16-3633-4796-b9ef-991466edd6ab"
            // }}

            if (feedsInformation == null) {
                return;
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

        logger.info(JSON.stringify(feedsList))
        // let feedsList = {"value":{"0":"23775ee5-bd0d-4657-88e8-b7395f3fbb55","1":"5ad0757a-5efc-447f-b47c-7f9477c8e1bb","2":"e7061b16-3633-4796-b9ef-991466edd6ab","6":"1ee744bb-01f7-4e3f-8aa8-06d0ed6e5928","7":"42ecfb97-a6db-41f5-bdfc-4f97b6e4fc10","8":"875c2df9-2bd8-4f07-b8f1-580e15fcd583"},"expiration":null}

        if (feedsList == null) {
            return new ActionResponse(200, "Not found any feeds");
        }
        processFeeds(feedsList['value'])
            .then(() => {
                return new ActionResponse(200, "Feeds processed");
            })
            .catch((error) => {
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