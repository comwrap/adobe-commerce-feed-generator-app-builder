const {Core} = require('@adobe/aio-sdk')
const {generateGqlItemsQueryBodyForTheFeed, generateFeedBodyForProduct, processVariables} = require('./../utils.js')
const {queryProducts} = require('./../acGqlLib/products.js')
const stateLib = require('@adobe/aio-lib-state')
const filesLib = require('@adobe/aio-lib-files')
const jsonToGraphQLQuery = require('json-to-graphql-query')
const {XMLValidator} = require("fast-xml-parser");
const {ActionResponse} = require("./actionResponse.js")
const { fromParams } = require('../auth')
/**
 * Generate feed by uuid
 *
 * @param uuid Feed uuid
 * @param params Adobe I/O action params array
 * @returns {Promise<{body: string, statusCode: number}|{body: (string|string|*), statusCode: number}|{body, statusCode: number}|{body: ({store_code}|{feed_type}|*), statusCode: number}>}
 */
async function generateFeed(uuid, params) {
    // create a Logger
    const logger = Core.Logger('main', {level: params.LOG_LEVEL || 'info'})
 
    const authParams = fromParams(params)

    // Cause it is not-possible to debug State libs, we need to find a workaround
    const isDebugMode = false;

    // Initialize state outside try block so it's accessible in catch
    const state = await stateLib.init()
    let feedToExport = null

    try {

        var startTime = performance.now()
        const uuidToExport = uuid
        let feedsInformation = {}

        if (!isDebugMode) {
            feedsInformation = await state.get('feeds_' + uuidToExport) || null
            if (feedsInformation == null) {
                return new ActionResponse(200, "Feed does not exists");
            } else {
                feedsInformation['value'] = JSON.parse(feedsInformation['value'])
            }
        } else {
            feedsInformation = {
                "expiration": "2023-03-03T12:58:47.000Z",
                "value": {
                    "created_at": "2023-03-02T12:58:47.770Z",
                    "feedBody": "<item>\n  <g:id>{{sku}}</g:id>\n  <g:category index=\"2\">{{categories.name}}</g:category>\n  \n <g:image_link>{{image.url count='2'}}</g:image_link>\n </item>",
                    "feedFooter": "</items>",
                    "feedHeader": "<items>",
                    "feedName": "Test XML",
                    "feed_type": "xml",
                    "generated_at": "",
                    "status": "pending",
                    "store_code": "de||main_website_store||base",
                    "searchQuery": "Gum",
//                    "filterQuery": "{\n   \"attribute\": \"price\",\n   \"range\": {\n     \"from\": 10,\n     \"to\": 100\n   }\n}"
                }
            }
        }

        feedToExport = feedsInformation['value']

        feedToExport.status = "in progress"
        if (!isDebugMode) {
            await state.put('feeds_' + uuidToExport, JSON.stringify(feedToExport), {ttl: stateLib.MAX_TTL})
        }

        const feed = feedToExport.feedBody

        if (feedToExport.feed_type == undefined || feedToExport.store_code == undefined) {
            feedToExport.status = "error"
            feedToExport.error = "Export format or Store Code is not defined"
            if (!isDebugMode) {
                await state.put('feeds_' + uuidToExport, JSON.stringify(feedToExport), {ttl: stateLib.MAX_TTL})
            }
            return new ActionResponse(506,"Export format or Store Code is not defined");
        } else {
            let storeInfo = feedToExport.store_code.split("||");

            params.store_code = storeInfo[0]
            params.store_group_code = storeInfo[1]
            params.website_code = storeInfo[2]
        }

        if (feedToExport.feed_type == "xml") {
            const validationResult = XMLValidator.validate(feedToExport.feedHeader + feedToExport.feedBody + feedToExport.feedFooter);
            if (validationResult !== true) {
                feedToExport.status = "error"
                feedToExport.error = "XML Validation failed: " + validationResult.err.msg
                if (!isDebugMode) {
                    await state.put('feeds_' + uuidToExport, JSON.stringify(feedToExport), {ttl: stateLib.MAX_TTL})
                }

                return new ActionResponse(506, feedToExport.error)
            }
        }

        let searchQueryForGql = feedToExport.searchQuery
        let searchFilterForGql = feedToExport.filterQuery

        let query = generateGqlItemsQueryBodyForTheFeed(feed)

        let gqlQuery = {}
        if (authParams.ims !== undefined && authParams.ims !== null) {
            gqlQuery = getSaaSProductQuery (query, 1)
        } else {
            gqlQuery = getPaasProductQuery (query, 1)
        }
        
        if (searchQueryForGql !== undefined && searchQueryForGql !== "") {
            if (authParams.ims !== undefined && authParams.ims !== null) {
                gqlQuery.query.productSearch.__args.phrase = searchQueryForGql;      
            } else {
                gqlQuery.query.products.__args.search = searchQueryForGql;
            }
        }

        if (searchFilterForGql !== undefined && searchFilterForGql !== "") {
            if (authParams.ims !== undefined && authParams.ims !== null) {
                gqlQuery.query.productSearch.__args.filter = JSON.parse(searchFilterForGql);      
            } else {
                gqlQuery.query.products.__args.filter = JSON.parse(searchFilterForGql);
            }
        }

        let graphqlQuery = jsonToGraphQLQuery.jsonToGraphQLQuery(gqlQuery, {pretty: false})

        let products = await queryProducts(graphqlQuery, params)

        // Collect all warnings from GraphQL responses
        let allWarnings = []

        // Check for warnings (partial errors with data)
        if (products.warnings !== undefined) {
            allWarnings = [...allWarnings, ...products.warnings]
            logger.info('GraphQL returned warnings on first page:', JSON.stringify(products.warnings))
        }

        if (products.errors !== undefined && products.data === undefined) {
            // Complete failure - no data at all
            if (products.errors[0].message !== undefined) {
                feedToExport.status = "error"
                feedToExport.error = products.errors[0].message + "<br /> Request was: " + JSON.stringify(gqlQuery)
                if (!isDebugMode) {
                    await state.put('feeds_' + uuidToExport, JSON.stringify(feedToExport), {ttl: stateLib.MAX_TTL})
                }

                return new ActionResponse(506, products.errors[0].message)
            }
        }

        let totalPages = 1
        let productItems = []
        if (authParams.ims !== undefined && authParams.ims !== null) {
            totalPages = products.data.productSearch.page_info.total_pages
            productItems = products.data.productSearch.items.map(item => item.productView)
        } else {
            totalPages = products.data.products.page_info.total_pages
            productItems = products.data.products.items
        }

        for (let j = 2; j <= totalPages; j++) {

            if (authParams.ims !== undefined && authParams.ims !== null) {
                gqlQuery = getSaaSProductQuery (query, j)
            } else {
                gqlQuery = getPaasProductQuery (query, j)
            }

            graphqlQuery = jsonToGraphQLQuery.jsonToGraphQLQuery(gqlQuery, {pretty: false})
            products = await queryProducts(graphqlQuery, params)

            // Collect warnings from pagination calls
            if (products.warnings !== undefined) {
                allWarnings = [...allWarnings, ...products.warnings]
                logger.info('GraphQL returned warnings on page ' + j + ':', JSON.stringify(products.warnings))
            }

            if (authParams.ims !== undefined && authParams.ims !== null) {
                productItems = [...productItems, ...products.data.productSearch.items.map(item => item.productView)]
            } else {
                productItems = [...productItems, ...products.data.products.items]
            }
        }

        const items = productItems

        let requestBody = generateFeedBodyForProduct(items, feed, feedToExport.feed_type)

        logger.error("FEED BEFORE PROCESSING")

        let feedHeader = processVariables(feedToExport.feedHeader)
        let feedFooter = processVariables(feedToExport.feedFooter)

        logger.error("FEED HEADER")
        logger.error(feedHeader)
        
        if (feedToExport.feed_type == "csv") {
            requestBody = feedHeader + "\r\n" + requestBody + feedFooter
        } else {
            requestBody = feedHeader + requestBody + feedFooter
        }

        if (!isDebugMode) {
            let files = await filesLib.init()
            await files.write('public/feeds/' + uuidToExport + '.' + feedToExport.feed_type, requestBody)
            const props = await files.getProperties('public/feeds/' + uuidToExport + '.' + feedToExport.feed_type)
            feedToExport.file_path = props.url
        }

        feedToExport.generated_at = new Date()
        feedToExport.status = "generated"
        feedToExport.error = ""
        feedToExport.warning = ""
        
        // Set warning if there were partial errors during generation
        if (allWarnings.length > 0) {
            const warningMessages = allWarnings.map(w => w.message + (w.path ? ' (path: ' + w.path.join('.') + ')' : '')).join('; ')
            feedToExport.warning = warningMessages
            logger.info('Feed generated with warnings:', warningMessages)
        }

        if (!isDebugMode) {
            await state.put('feeds_' + uuidToExport, JSON.stringify(feedToExport), {ttl: stateLib.MAX_TTL})
        }

        const endTime = performance.now()

        feedToExport.executionTime = endTime - startTime

        // feedToExport
        return new ActionResponse(200, feedToExport)

    } catch (error) {
        // log any server errors
        logger.error(error)

        // Save error status to the feed if it was loaded
        if (feedToExport !== null) {
            try {
                feedToExport.status = "error"
                feedToExport.error = error.message
                feedToExport.warning = ""
                await state.put('feeds_' + uuid, JSON.stringify(feedToExport), {ttl: stateLib.MAX_TTL})
                logger.info('Feed status updated to error: ' + uuid)
            } catch (stateError) {
                logger.error('Failed to update feed status to error:', stateError)
            }
        }

        return new ActionResponse(505, error.message)
    }
}

function getSaaSProductQuery(query, currentPage) {
    return {
        'query': {
            'productSearch': {
                '__args': {
                    'phrase': "",
                    'page_size': 200,
                    'current_page': currentPage
                },
                'items': {
                        'productView': query   
                },
                'total_count': true,
                'page_info': {
                    'current_page': true,
                    'total_pages': true
                }
            }
        }
    };
}
function getPaasProductQuery(query, currentPage) {
    return {
        'query': {
            'products': {
                '__args': {
                    'filter': {},
                    'pageSize': 200,
                    'currentPage': currentPage
                },
                'items': query,
                'total_count': true,
                'page_info': {
                    'current_page': true,
                    'total_pages': true
                }
            }
        }
    };
}

module.exports = {
    generateFeed
}
