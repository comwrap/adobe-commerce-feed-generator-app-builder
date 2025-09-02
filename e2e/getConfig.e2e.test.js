/* 
* <license header>
*/

const { Config } = require('@adobe/aio-sdk').Core
const fs = require('fs')

// get action url
const namespace = Config.get('runtime.namespace')
const hostname = Config.get('cna.hostname') || 'adobeioruntime.net'
const runtimePackage = 'feed-generator'
const actionUrl = `https://${namespace}.${hostname}/api/v1/web/${runtimePackage}/getConfig`

// The deployed actions are secured with the `require-adobe-auth` annotation.
// If the authorization header is missing, Adobe I/O Runtime returns with a 401 before the action is executed.
test('returns a 401 when missing Authorization header', async () => {
  const res = await fetch(actionUrl)
  expect(res.status).toBe(401)
})
