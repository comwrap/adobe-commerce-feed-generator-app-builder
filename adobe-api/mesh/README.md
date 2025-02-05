# Adobe Mesh API
https://developer.adobe.com/graphql-mesh-gateway/gateway/getting-started/

### Install:
https://developer.adobe.com/graphql-mesh-gateway/gateway/getting-started/#install-the-aio-cli

`npm install -g @adobe/aio-cli` if aio not installed yet

then

`aio plugins:install @adobe/aio-cli-plugin-api-mesh`


### API Mesh access

Mesh api GraphQl endpoint follows next patter https://graph.adobe.io/api/{meshId}/graphql?api_key={mesh_api_key}

{mesh_api_key} can be moved to headers, so GQL endpoint will be
https://graph.adobe.io/api/{meshId}/graphql and need to add header `X-Api-Key` with value `{mesh_api_key}`



### Usage
https://developer.adobe.com/graphql-mesh-gateway/gateway/command-reference/

`aio api-mesh:status` - get status of current mesh config

`aio api-mesh:create adobe-api/mesh/mesh.json` - create mesh config for project
https://developer.adobe.com/graphql-mesh-gateway/gateway/create-mesh/

`aio api-mesh:update adobe-api/mesh/mesh.json` - update existing mesh config for project


### Notes

-----------------------------------------------

Sometimes `aio api-mesh` fail with different errors and `aio login` -> `aio logout` not helps. Execute next cli commands to reset aio ims config:

`aio logout`

`aio config delete \$ims --global && aio config delete \$ims --local`

`aio login`

After this `aio api-mesh` commands should works fine.

-------------------------------------------------

If Adobe Mesh Gql response fail need to check source URL (magento.host): SSL certificate MUST be VALID, otherwise Mesh GQL enpoint response error.

-------------------------------------------------


### Example mesh config description

```
{
  "meshConfig": {
    "sources": [
      {
        "name": "REST",
        "handler": {
          "openapi": {
            "source": "https://magento.host/rest/schema?services=storeWebsiteRepositoryV1",
             // can be udpated to /rest/schema?services=all if we want to use all rest enpoint in mesh
            
            "schemaHeaders": {
              "Authorization": "Bearer {context.headers['x-ac-api-token']}" 
              // magento integration api token. Must be included to Headers in request to Mesh GQl enpoint 
            },
            "operationHeaders": {
              "Authorization": "Bearer {context.headers['x-ac-api-token']}",
              "Content-Type": "application/json"
            },
            "includeHttpDetails": true
          }
        }
      },
      {
        "name": "GraphQL",
        "handler": {
          "graphql": {
            "endpoint": "https://magento.host/graphql"
          }
        }
      }
    ]
  }
}
```

### Example GQL query to Mesh GQL endpoint for example mesh config

```
query {
  GetV1StoreWebsites {
    ... on store_data_website_interface {
      id
      code
      name
      default_group_id
      extension_attributes
    }
  }
  GetV1StoreStoreViews {
    ... on store_data_store_interface {
      id
      code
      name
      website_id
      store_group_id
      is_active
      extension_attributes
    }
  }
  GetV1StoreStoreGroups {
    ... on store_data_group_interface {
      id
      website_id
      root_category_id
      default_store_id
      name
      code
      extension_attributes
    }
  }
}
```