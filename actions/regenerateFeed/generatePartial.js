const { Core, Events } = require('@adobe/aio-sdk')
const fetch = require('node-fetch')
const { errorResponse, getBearerToken, stringParameters, checkMissingRequestInputs, generateGqlItemsQueryBodyForTheFeed, generateFeedBodyForProduct } = require('./../utils.js')
const { queryProducts } = require('./../acGqlLib/products.js')
const stateLib = require('@adobe/aio-lib-state')
const filesLib = require('@adobe/aio-lib-files')
const { jsonToGraphQLQuery, VariableType } = require('json-to-graphql-query')

// main function that will be executed by Adobe I/O Runtime
async function main (params) {
  // create a Logger
  const logger =  Core.Logger('main', { level: params.LOG_LEVEL || 'info' })

  try {

      const changedProductSku = params.data.value.sku;
      // const changedProductSku = '29061';

      const state = await stateLib.init()
      const feedsInformation = await state.get('feeds_list') || {"value": {}}
  
      // const feedsInformation = {
      //   "expiration": "2023-02-22T00:09:49.000Z",
      //   "value": {
      //     "0": "9cbca023-bc3f-4125-94c6-979c5c00843b"
      //   }
      // }
      
      for (let i = 0; i < Object.keys(feedsInformation['value']).length; i++) {

        let feedJson = await state.get('feeds_' + feedsInformation['value'][i]) || 0
        feedJson = feedJson['value']

        if (feedJson === undefined) {
          continue
        }

        // let feedJson = {
        //     "created_at": "2023-02-27T15:29:09.712Z",
        //     "error": "",
        //     "feedBody": "<item>  <name>{{name}}</name>  <sku>{{sku}}</sku>  <color>{{color}}</color></item>",
        //     "feedFooter": "</items>",
        //     "feedHeader": "<items>",
        //     "feedName": "XML Example",
        //     "feed_type": "xml",
        //     "file_path": "https://firefly.azureedge.net/344d04bac0f9f71a9b6110c1df6bfaee-public/public/feeds/9cbca023-bc3f-4125-94c6-979c5c00843b.xml",
        //     "generated_at": "2023-02-28T10:04:30.440Z",
        //     "productTypes": "simple_product",
        //     "status": "generated",
        //     "store_code": "default"
        // };

        if (feedJson.status !== "generated") {
          continue;
        }  

        if (feedJson.feed_type !== "xml") {
          continue;
        }

        let feedBody = feedJson.feedBody;
        params.store_code = feedJson.store_code

        const query = generateGqlItemsQueryBodyForTheFeed(feedBody)
        const gqlQuery = {
          query: {
            __variables: {
              sku: "String!" 
           },
            products: {
              __args: {
                filter: { sku: { eq: new VariableType('sku') }}
              },
              items: query
            } 
          }
        };

        let graphqlQuery = jsonToGraphQLQuery(gqlQuery, { pretty: false })

        // graphqlQuery = graphqlQuery.replace('eq: \"'+changedProductSku+'\"', "eq: '"+changedProductSku+"'")
        // let graphqlQuery = 'query { products (filter: {sku: {eq: "29061"}}) { items { name sku } } }'

        let products = await queryProducts(params, graphqlQuery, {sku: changedProductSku})
        products = JSON.parse(products)
                      
        if (products.errors !== undefined) {
          if (products.errors[0].message !== undefined) {
            feedToExport.status = "error"
            feedToExport.error = products.errors[0].message + "<br /> Request was: " + JSON.stringify(gqlQuery, 0, 2)
  
            await state.put('feeds_' + uuidToExport, feedToExport)
          } 
        }  

        const items = products.data.products.items
        let xml = generateFeedBodyForProduct(items, feedBody)

        if (xml !== "") {
          files = await filesLib.init()
          if (feedJson.file_path !== "" && feedJson.file_path !== undefined) {
            const existedFeed = await files.read('public/feeds/' + feedsInformation['value'][i] + '.xml')
            const existedFileBody = existedFeed.toString() 

            // const existedFileBody = "<items><item>  <name>Sommer Duschwanne</name>  <sku>Sommerduschwanne</sku>  <color>null</color></item><item>  <name>HSK Shower und Co Handbrause</name>  <sku>HSK-1100117</sku>  <color>null</color></item><item>  <name>Treos Serie 710 Oval-Badewanne</name>  <sku>TR-710041772</sku>  <color>null</color></item><item>  <name>Repabad Seed Raumspar-Badewanne</name>  <sku>RPB-1709-0037379</sku>  <color>null</color></item><item>  <name>Riho Solid Surface Oval-Badewanne</name>  <sku>RI-1592-BS10005</sku>  <color>null</color></item><item>  <name>Riho Oval-Badewanne</name>  <sku>RI-1592-BD10</sku>  <color>null</color></item><item>  <name>Fokus auf Kunden anstelle Technologie</name>  <sku>Fokus auf Kunden anstelle Technologie</sku>  <color>null</color></item><item>  <name>Multi Vendor Marketplace</name>  <sku>Multi Vendor Marketplace</sku>  <color>null</color></item><item>  <name>Hybrid B2B und B2C Commerce</name>  <sku>Hybrid B2B und B2C Commerce</sku>  <color>null</color></item><item>  <name>Omni-Channel Commerce 500011</name>  <sku>29061</sku>  <color>null</color></item></items>"

            const indexOfFirst = feedBody.indexOf(">")
            const openingTag = feedBody.substring(0, indexOfFirst + 1)
            const closingTag = openingTag.replace("<", "<\\/"); 
            
            var regExp = openingTag + "(?:(?!" + openingTag + ").)*?" + changedProductSku + "(?:(?!" + closingTag + ").)*?" + closingTag;
            regExp = new RegExp(regExp, "gm")

            const newFeedBody = existedFileBody.replace(regExp, xml);
            
            await files.write('public/feeds/' + feedsInformation['value'][i] + '.xml', newFeedBody)
            
            feedJson.generated_at = new Date()
      
            await state.put('feeds_' + feedsInformation['value'][i], feedJson)

          }
        }

      }
  
      // feedToExport
      const response = {
        statusCode: 200,
        body: "Updated"
      }

      return response

  } catch (error) {
    // log any server errors
    logger.error(error)

    const response = {
      statusCode: 505,
      body: error.message + ". Product SKU: " + params.data.value.sku
    }
    return response
  }
}

exports.main = main