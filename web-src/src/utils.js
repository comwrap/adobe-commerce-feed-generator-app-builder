/* 
* <license header>
*/

/* global fetch */
import actions from './config.json'

async function invokeAction (actionName, _headers, _params, props) {

  const action = getAction(actionName, actions)
  const headers = _headers || {}
  const params = _params || {}
  // all headers to lowercase
  Object.keys(headers).forEach((h) => {
    const lowercase = h.toLowerCase()
    if (lowercase !== h) {
      headers[lowercase] = headers[h]
      headers[h] = undefined
      delete headers[h]
    }
  })
  // set the authorization header and org from the ims props object
  if (props.ims.imsToken && !headers.authorization) {
    headers.authorization = `Bearer ${props.ims.imsToken}`
  }
  if (props.ims.imsOrg && !headers['x-gw-ims-org-id']) {
    headers['x-gw-ims-org-id'] = props.ims.imsOrg
  }
  // action is [name, url]
  const result = await actionWebInvoke(action[1], headers, params)
  return result
}

/**
 *
 * Invokes a web action
 *
 * @param  {string} actionUrl
 * @param {object} headers
 * @param  {object} params
 *
 * @returns {Promise<string|object>} the response
 *
 */
async function actionWebInvoke (actionUrl, headers = {}, params = {}, options = { method: 'POST' }) {
  const actionHeaders = {
    'Content-Type': 'application/json',
    ...headers
  }

  const fetchConfig = {
    headers: actionHeaders
  }

  if (window.location.hostname === 'localhost') {
    actionHeaders['x-ow-extra-logging'] = 'on'
  }

  fetchConfig.method = options.method.toUpperCase()

  if (fetchConfig.method === 'GET') {
    actionUrl = new URL(actionUrl)
    Object.keys(params).forEach(key => actionUrl.searchParams.append(key, params[key]))
  } else if (fetchConfig.method === 'POST') {
    fetchConfig.body = JSON.stringify(params)
  }

  const response = await fetch(actionUrl, fetchConfig)

  let content = await response.text()

  if (!response.ok) {
    throw new Error(`failed request to '${actionUrl}' with status: ${response.status} and message: ${content}`)
  }
  try {
    content = JSON.parse(content)
  } catch (e) {
    // response is not json
  }
  return content
}

function getAction(name, actions) {
  return new Array(name, actions[name])
}

export default actionWebInvoke

module.exports = {
  actionWebInvoke,
  getAction,
  invokeAction
}

