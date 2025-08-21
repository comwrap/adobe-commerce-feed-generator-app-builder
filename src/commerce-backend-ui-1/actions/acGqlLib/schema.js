const {getIntrospectionQuery} = require("graphql");
const {errorResponse} = require("./../utils.js");
/**
 * Return GQL schema or throw error
 *
 * @param params
 * @returns {Promise<{error: {body: {error: string}, statusCode: number}}|any>}
 */
async function getSchema(params) {

  const gqlUrl = params['AC_GRAPHQL_URL']
  const introspectionQuery = getIntrospectionQuery();

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
