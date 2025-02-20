const {getIntrospectionQuery} = require("graphql");
const {errorResponse} = require("./../utils.js");

/**
 * Return GQL schema or throw error
 *
 * @param params
 * @returns {Promise<{error: {body: {error: string}, statusCode: number}}|any>}
 */
async function getSchema(params) {
  const gqlUrl = params['mesh_source_url']

  const introspectionQuery = getIntrospectionQuery();

  const result = await fetch(gqlUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'm-ac-rest-api-token': params['m-ac-rest-api-token']
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
