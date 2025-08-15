const {getIntrospectionQuery} = require("graphql");
const {errorResponse} = require("./../utils.js");
const { Core } = require('@adobe/aio-sdk');
const { log } = require("react-zlib-js");

/**
 * Return GQL schema or throw error
 *
 * @param params
 * @returns {Promise<{error: {body: {error: string}, statusCode: number}}|any>}
 */
async function getSchema(params) {

  const logger = Core.Logger('main', { level: params.LOG_LEVEL || 'info' })

  const gqlUrl = params['AC_GRAPHQL_URL']

  logger.error('Debug getSchema')
  logger.error(gqlUrl)
  const introspectionQuery = getIntrospectionQuery();

  logger.error(introspectionQuery)

  const result = await fetch(gqlUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({query: introspectionQuery}),
  });

  const schema = result.json();
  if (result.errors) {
    return errorResponse(500, 'server error' + result.errors[0].message)
  }

  return schema;
}

module.exports = {
  getSchema
}
