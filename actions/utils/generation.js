const {Core} = require('@adobe/aio-sdk')
const {generateGqlItemsQueryBodyForTheFeed, generateFeedBodyForProduct, processVariables} = require('./../utils.js')
const {queryProducts} = require('./../acGqlLib/products.js')
const stateLib = require('@adobe/aio-lib-state')
const filesLib = require('@adobe/aio-lib-files')
const jsonToGraphQLQuery = require('json-to-graphql-query')
const {XMLValidator} = require("fast-xml-parser");
const {ActionResponse} = require("./actionResponse.js")

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

    // Cause it is not-possible to debug State libs, we need to find a workaround
    const isDebugMode = false;

    try {

        var startTime = performance.now()
        const uuidToExport = uuid
        let feedsInformation = {}
        const state = await stateLib.init()

        if (!isDebugMode) {
            feedsInformation = await state.get('feeds_' + uuidToExport) || null
            if (feedsInformation == null) {
                return new ActionResponse(200, "Feed does not exists");
            }
        } else {
            feedsInformation = {
                "expiration": "2023-03-03T12:58:47.000Z",
                "value": {
                    "created_at": "2023-03-02T12:58:47.770Z",
                    "feedBody": "<item>\n  <g:id>{{sku}}</g:id>\n  <title>{{name}}</title>\n  <description>{{description.html}}</description>\n  <link>https://eventing-clzaefa-bm5l4hpp6cb3s.eu-4.magentosite.cloud/{{url_key}}</link>\n  <g:image_link>{{thumbnail.url}}</g:image_link>\n  <g:condition>new</g:condition>\n  <g:price>{{price_range.maximum_price.final_price.value}}</g:price>\n  <g:tax>\n    <g:country>DE</g:country>\n    <g:rate>0</g:rate>\n    <g:tax_ship>y</g:tax_ship>\n  </g:tax>\n  <g:shipping>\n    <g:country>DE</g:country>\n    <g:price>0 EUR</g:price>\n  </g:shipping>\n  <g:availability>In Stock</g:availability>\n  <g:identifier_exists>TRUE</g:identifier_exists>\n  <g:product_type>Category will come soon</g:product_type>\n  <g:sale_price>{{price_range.minimum_price.final_price.value}}</g:sale_price><g:additional_image_link>{{media_gallery.url count=5}}</g:additional_image_link>\n</item>",
                    "feedFooter": "</items>",
                    "feedHeader": "<items>",
                    "feedName": "Test XML",
                    "feed_type": "xml",
                    "generated_at": "",
                    "status": "pending",
                    "store_code": "bund_de"
                }
            }
        }

        const feedToExport = feedsInformation['value']

        feedToExport.status = "in progress"
        if (!isDebugMode) {
            await state.put('feeds_' + uuidToExport, feedToExport, {ttl: -1})
        }

        const feed = feedToExport.feedBody
        params.store_code = feedToExport.store_code

        if (feedToExport.feed_type == undefined || feedToExport.store_code == undefined) {
            feedToExport.status = "error"
            feedToExport.error = "Export format or Store Code is not defined"
            if (!isDebugMode) {
                await state.put('feeds_' + uuidToExport, feedToExport, {ttl: -1})
            }
            return new ActionResponse(506,"Export format or Store Code is not defined");
        }

        if (feedToExport.feed_type == "xml") {
            const validationResult = XMLValidator.validate(feedToExport.feedHeader + feedToExport.feedBody + feedToExport.feedFooter);
            if (validationResult !== true) {
                feedToExport.status = "error"
                feedToExport.error = "XML Validation failed: " + validationResult.err.msg
                if (!isDebugMode) {
                    await state.put('feeds_' + uuidToExport, feedToExport, {ttl: -1})
                }

                return new ActionResponse(506, feedToExport.error)
            }
        }

        let searchQueryForGql = feedToExport.searchQuery
        let searchFilterForGql = feedToExport.filterQuery

        let query = generateGqlItemsQueryBodyForTheFeed(feed)

        let gqlQuery = {
            'query': {
                'products': {
                    '__args': {
                        'filter': {},
                        'pageSize': 200,
                        'currentPage': 1
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

        if (searchQueryForGql !== undefined && searchQueryForGql !== "") {
            gqlQuery.query.products.__args.search = searchQueryForGql;
        }

        if (searchFilterForGql !== undefined && searchFilterForGql !== "") {
            /** Add Filter to the request */
            gqlQuery.query.products.__args.filter = JSON.parse(searchFilterForGql);
        }

        let graphqlQuery = jsonToGraphQLQuery.jsonToGraphQLQuery(gqlQuery, {pretty: false})

        let products = await queryProducts(graphqlQuery, params)

        if (products.errors !== undefined) {
            if (products.errors[0].message !== undefined) {
                feedToExport.status = "error"
                feedToExport.error = products.errors[0].message + "<br /> Request was: " + JSON.stringify(gqlQuery)
                if (!isDebugMode) {
                    await state.put('feeds_' + uuidToExport, feedToExport, {ttl: -1})
                }

                return new ActionResponse(506, products.errors[0].message)
            }
        }

        let totalPages = products.data.products.page_info.total_pages
        let productItems = products.data.products.items

        for (let j = 2; j <= totalPages; j++) {

            gqlQuery = {
                'query': {
                    'products': {
                        '__args': {
                            'filter': {},
                            'pageSize': 200,
                            'currentPage': j
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

            graphqlQuery = jsonToGraphQLQuery.jsonToGraphQLQuery(gqlQuery, {pretty: false})
            products = await queryProducts(graphqlQuery, params)
            productItems = [...productItems, ...products.data.products.items]
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
            let savedFile = await files.write('public/feeds/' + uuidToExport + '.' + feedToExport.feed_type, requestBody)
            const props = await files.getProperties('public/feeds/' + uuidToExport + '.' + feedToExport.feed_type)
            feedToExport.file_path = props.url
        }

        feedToExport.generated_at = new Date()
        feedToExport.status = "generated"
        feedToExport.error = ""

        if (!isDebugMode) {
            await state.put('feeds_' + uuidToExport, feedToExport, {ttl: -1})
        }

        const endTime = performance.now()

        feedToExport.executionTime = endTime - startTime

        // feedToExport
        return new ActionResponse(200, feedToExport)

    } catch (error) {
        // log any server errors
        logger.error(error)

        return new ActionResponse(505, error.message)
    }
}

module.exports = {
    generateFeed
}
