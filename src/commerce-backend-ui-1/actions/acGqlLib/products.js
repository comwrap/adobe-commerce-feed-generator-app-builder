const {callMeshGql} = require("./../meshGql.js");

async function queryProducts (gqlRequest, params, variables = {}) {
  let products = await callMeshGql(gqlRequest, params, variables)
  return products
}

module.exports = {
  queryProducts
}
