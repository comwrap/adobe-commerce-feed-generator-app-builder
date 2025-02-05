const fetch = require('node-fetch')
const {errorResponse} = require("./utils.js");
const {Core} = require('@adobe/aio-sdk')

async function callMeshGql(gqlRequest, params, variables = {}) {

  const gqlUrl = params['mesh_source_url']
  const requestBody = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'm-ac-rest-api-token': params['m-ac-rest-api-token'],
      'm-ac-gql-store-code': params['m-ac-gql-store-code']
    },
    body: JSON.stringify({
      query: gqlRequest,
      variables: variables
    })
  }
  const response = await fetch(gqlUrl, requestBody)
  const result = response.json();
  if (result.errors) {
    throw new Error(`failed request to Mesh API. Status: ${response.status} and message: ${result}`)
  }
  return result;
}

module.exports = {
  callMeshGql
}
