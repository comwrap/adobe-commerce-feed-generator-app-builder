async function callMeshGql(gqlRequest, params, variables = {}) {

  const gqlUrl = params['AC_GRAPHQL_URL']
  const requestBody = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'store': params['store_code'],
      'Magento-Environment-Id': params['AC_ENVIRONMENT_ID'],
      'Magento-Website-Code': params['website_code'],
      'Magento-Store-View-Code': params['store_code'],
      'Magento-Store-Code': params['store_group_code'],
      'x-api-key': 'search_gql'
    },

    body: JSON.stringify({
      query: gqlRequest,
      variables: variables
    })
  }
  
  const response = await fetch(gqlUrl, requestBody);
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`HTTP error! status: ${response.status} ${response.statusText}, body: ${errorText}`);
  }
  
  const result = await response.json();
  
  if (result.errors) {
    // Check if we have data alongside errors (partial success)
    const hasProductsData = result.data?.products?.items?.length > 0 || 
                            result.data?.productSearch?.items?.length > 0;
    
    if (hasProductsData) {
      // Return data with warnings attached - don't throw, allow processing to continue
      result.warnings = result.errors;
    } else {
      // No usable data - throw error
      throw new Error(`failed request to Mesh API. Status: ${response.status} and message: ${JSON.stringify(result.errors)}`)
    }
  }
  
  return result;
  
}

module.exports = {
  callMeshGql
}
