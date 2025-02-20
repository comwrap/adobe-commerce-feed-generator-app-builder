/* 
* <license header>
*/

/* This file exposes some common utilities for your actions */

const { handlePlaceholder } = require('./utils/placeholderHandler');
const { processVariables } = require('./utils/generation/processVariables');

/**
 *
 * Returns a log ready string of the action input parameters.
 * The `Authorization` header content will be replaced by '<hidden>'.
 *
 * @param {object} params action input parameters.
 *
 * @returns {string}
 *
 */
function stringParameters (params) {
  // hide authorization token without overriding params
  let headers = params.__ow_headers || {}
  if (headers.authorization) {
    headers = { ...headers, authorization: '<hidden>' }
  }
  return JSON.stringify({ ...params, __ow_headers: headers })
}

/**
 *
 * Returns the list of missing keys giving an object and its required keys.
 * A parameter is missing if its value is undefined or ''.
 * A value of 0 or null is not considered as missing.
 *
 * @param {object} obj object to check.
 * @param {array} required list of required keys.
 *        Each element can be multi level deep using a '.' separator e.g. 'myRequiredObj.myRequiredKey'
 *
 * @returns {array}
 * @private
 */
function getMissingKeys (obj, required) {
  return required.filter(r => {
    const splits = r.split('.')
    const last = splits[splits.length - 1]
    const traverse = splits.slice(0, -1).reduce((tObj, split) => { tObj = (tObj[split] || {}); return tObj }, obj)
    return traverse[last] === undefined || traverse[last] === '' // missing default params are empty string
  })
}

/**
 *
 * Returns the list of missing keys giving an object and its required keys.
 * A parameter is missing if its value is undefined or ''.
 * A value of 0 or null is not considered as missing.
 *
 * @param {object} params action input parameters.
 * @param {array} requiredHeaders list of required input headers.
 * @param {array} requiredParams list of required input parameters.
 *        Each element can be multi level deep using a '.' separator e.g. 'myRequiredObj.myRequiredKey'.
 *
 * @returns {string} if the return value is not null, then it holds an error message describing the missing inputs.
 *
 */
function checkMissingRequestInputs (params, requiredParams = [], requiredHeaders = []) {
  let errorMessage = null

  // input headers are always lowercase
  requiredHeaders = requiredHeaders.map(h => h.toLowerCase())
  // check for missing headers
  const missingHeaders = getMissingKeys(params.__ow_headers || {}, requiredHeaders)
  if (missingHeaders.length > 0) {
    errorMessage = `missing header(s): '${missingHeaders}'`
  }

  // check for missing parameters
  const missingParams = getMissingKeys(params, requiredParams)
  if (missingParams.length > 0) {
    if (errorMessage) {
      errorMessage += ' and '
    } else {
      errorMessage = ''
    }
    errorMessage += `missing parameter(s) '${missingParams}'`
  }

  return errorMessage
}

/**
 *
 * Extracts the bearer token string from the Authorization header in the request parameters.
 *
 * @param {object} params action input parameters.
 *
 * @returns {string|undefined} the token string or undefined if not set in request headers.
 *
 */
function getBearerToken (params) {
  if (params.__ow_headers &&
      params.__ow_headers.authorization &&
      params.__ow_headers.authorization.startsWith('Bearer ')) {
    return params.__ow_headers.authorization.substring('Bearer '.length)
  }
  return undefined
}
/**
 *
 * Returns an error response object and attempts to log.info the status code and error message
 *
 * @param {number} statusCode the error status code.
 *        e.g. 400
 * @param {string} message the error message.
 *        e.g. 'missing xyz parameter'
 * @param {*} [logger] an optional logger instance object with an `info` method
 *        e.g. `new require('@adobe/aio-sdk').Core.Logger('name')`
 *
 * @returns {object} the error object, ready to be returned from the action main's function.
 *
 */
function errorResponse (statusCode, message, logger) {
  if (logger && typeof logger.info === 'function') {
    logger.info(`${statusCode}: ${message}`)
  }
  return {
    error: {
      statusCode,
      body: {
        error: message
      }
    }
  }
}

/**
 * Make a deep merge of 2 arrays 
 * 
 * @param {*} target 
 * @param {*} source 
 */
function deepMerge(target, source) {
  for (const key in source) {
    // eslint-disable-next-line no-prototype-builtins
    if (source.hasOwnProperty(key)) {
      if (typeof source[key] === 'object' && !Array.isArray(source[key]) && source[key] !== null) {
        // eslint-disable-next-line no-prototype-builtins
        if (!target.hasOwnProperty(key)) {
          target[key] = {};
        }
        deepMerge(target[key], source[key]);
      } else {
        target[key] = source[key];
      }
    }
  }
}

function generateGqlItemsQueryBodyForTheFeed (feed) {

  const regexp = /{{.*?}}/g
  const matches = [...feed.matchAll(regexp)]

  let query = {}
  for (let i = 0; i < matches.length; i++) {
      let elementMatch = matches[i][0];

      // Extracting the variable "media_gallery.url"
      const elementMatchRegex = /{{([^{}]+)}}/;
      elementMatch = elementMatch.match(elementMatchRegex);
      elementMatch = elementMatch[1].split(' ')[0].trim();

      const elementMatchList = elementMatch.split(".");

      if (elementMatchList.length == 1) {
          query[elementMatch] = true
      } else {

        const result = {};

        let currentObj = result;
        elementMatchList.forEach((key, index) => {
          if (index === elementMatchList.length - 1) {
            currentObj[key] = true;
          } else {
            if (currentObj[key] === undefined) {
              currentObj[key] = {};
            }
            currentObj = currentObj[key];
          }
        });

        deepMerge(query, result);
        
      }
  }

  if (Object.keys(query).length == 0) {
    query = { "name": true }
  }

  return query

}

/**
 * 
 * Generate Body for products based on provided items and feed body
 * 
 * @param {array} items 
 * @param {string} feed 
 * @param {string} type
 *  
 * @returns string
 */
function generateFeedBodyForProduct(items, feed, type) {
  let resultFeedBody = new Array();

  const placeholders = [...feed.matchAll(/{{.*?}}/g)];
  for (let item of items) {
    let generatedFeed = (" " + feed).slice(1);

    for (let placeholder of placeholders) {
        placeholder = String(placeholder);
        generatedFeed = handlePlaceholder(placeholder, item, type, feed, generatedFeed);
    }

    resultFeedBody.push(generatedFeed)
  }
  if (type === "json") {
    return resultFeedBody.join(",");
  } else if (type === "csv") {
    return resultFeedBody.join("\r\n");
  } else {
    return resultFeedBody.join("");
  }
}

module.exports = {
  errorResponse,
  getBearerToken,
  stringParameters,
  checkMissingRequestInputs,
  generateGqlItemsQueryBodyForTheFeed,
  generateFeedBodyForProduct,
  processVariables
}
