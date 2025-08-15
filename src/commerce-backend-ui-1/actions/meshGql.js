async function callMeshGql(gqlRequest, params, variables = {}) {

  const gqlUrl = params['MESH_SOURCE_URL']
  const requestBody = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'm-ac-gql-store-code': params['store_code'],
      'magento-environment-id': params['MAGENTO_ENVIRONMENT_ID'],
      'magento-website-code': params['website_code'],
      'magento-store-view-code': params['store_code'],
      'magento-store-code': params['store_group_code'],
      'x-api-key': 'search_gql'
    },

    body: JSON.stringify({
      query: gqlRequest,
      variables: variables
    })
  }
  
  try {
    const response = await fetch(gqlUrl, requestBody);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! status: ${response.status} ${response.statusText}, body: ${errorText}`);
    }
    
    const result = await response.json();
    
    if (result.errors) {
      throw new Error(`failed request to Mesh API. Status: ${response.status} and message: ${JSON.stringify(result.errors)}`)
    }
    
    return result;
    
  } catch (error) {
    throw error;
  }
}

module.exports = {
  callMeshGql
}
