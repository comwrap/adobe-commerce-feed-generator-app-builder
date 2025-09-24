const {Core} = require('@adobe/aio-sdk')

const handlePlaceholder = (placeholder, item, type, feed, generatedFeed) => {

  let processedPlaceholder = placeholder;
  const fragmentMatch = placeholder.match(/{{([^|}]+)\|\|([^}]+)}}/);
  if (fragmentMatch) {
    processedPlaceholder = `{{${fragmentMatch[2]}}}`;
  }
  
  const handlers = [
    handleAttributeByCode,
    handleNoProperties,
    handleCount,
    handleSuppressNull,
    handleCategories,
    handleDefault
  ];

  for (let handler of handlers) {
    let tagValue = handler(processedPlaceholder, item, feed, type);
    if (tagValue !== null) {
      generatedFeed = generatedFeed.replace(placeholder, tagValue);
      break;
    }
  }

  return generatedFeed;
}

const handleAttributeByCode = (placeholder, item, feed, type) => {
  const [dataKey, placeholderProperties] = extractFromPlaceholder(placeholder);
  
  // Check if this is an attributes.value placeholder
  if (dataKey !== 'attributes.value') {
    return null;
  }
  
  // Check if code property is provided
  if (!placeholderProperties['code']) {
    return "";
  }
  
  const attributeCode = placeholderProperties['code'];
  // Check if item has attributes array
  if (!item.attributes || !Array.isArray(item.attributes)) {
    return "";
  }
  
  // Find the attribute with matching code/name
  const attribute = item.attributes.find(attr => attr.name === attributeCode);
  if (!attribute) {
    return "";
  }
  
  let tagValue = attribute.value;
  // Handle null/undefined values
  if (tagValue === null || tagValue === undefined) {
    return "";
  }
  
  // Convert to string if it's a number
  if (typeof tagValue === 'number') {
    tagValue = tagValue.toString();
  }
  
  // Wrap in CDATA if XML and contains special characters
  if (type === "xml") {
    tagValue = wrapInCDATAIfNeeded(tagValue);
  }
  
  return tagValue;
}

const handleSuppressNull = (placeholder, item, feed, type) => {
  const [dataKey] = extractFromPlaceholder(placeholder);
  let placeholderParts = dataKey.split(".");

  if (placeholderParts.length !== 1) {
    return null;
  }

  let tagValue = item[dataKey];
  if (type === "xml") {
    tagValue = wrapInCDATAIfNeeded(tagValue)
  }

  return tagValue;
}

const handleNoProperties = (placeholder, item, feed, type) => {
  const [dataKey] = extractFromPlaceholder(placeholder);
  let placeholderParts = dataKey.split(".");

  if (placeholderParts.length !== 1) {
    return null;
  }

  let tagValue = item[dataKey];
  if (type === "xml") {
    tagValue = wrapInCDATAIfNeeded(tagValue)
  }

  return tagValue;
}

const handleCategories = (placeholder, item, feed, type) => {
  
  // eslint-disable-next-line no-unused-vars
  const [dataKey, placeholderProperties] = extractFromPlaceholder(placeholder);

  let placeholderParts = dataKey.split(".");

  if (placeholderParts[0] !== 'categories') {
    return null;
  }

  let value = "";
  let itemCounter = 0;
  for (let placeholderPart of placeholderParts) {

    if (typeof value !== "undefined") {

    if (value.toString() === "") {
        if (itemCounter === 0) {
          /**
           * @ToDo Consider to use index as a property for define position of the value in the array if there are multiple values
           * Example: 
           * Categories: {{categories.name index=0}}
           * Json: 
           * {
           *  "categories": [
           *   {"name": "Category 1"},
           *   {"name": "Category 2"}
           * ]
           * }
           */
          // if (placeholderProperties['index'] !== undefined) {
            // value = item[placeholderPart][placeholderProperties['index']];
          // } else {
            value = item[placeholderPart][0];
          // }
        } else {
          value = item[placeholderPart]  
        }
      } else { 
        value = value[placeholderPart];
      }
    }
    itemCounter++;
  }

  let tagValue = value;
  if (type === "xml") {
    tagValue = wrapInCDATAIfNeeded(value);
  }

  return tagValue;
}

const handleCount = (placeholder, item, feed, type) => {
  const [dataKey, placeholderProperties] = extractFromPlaceholder(placeholder);

  if (type !== "xml" || placeholderProperties['count'] === undefined) {
    return null;
  }

  let placeholderParts = dataKey.split(".");
  let lastMatchedProperty = placeholderParts[placeholderParts.length - 1];
  let arrayParts = placeholderParts.slice(0, -1); 

  // Navigate to the array
  let arrayValue = item;
  for (let part of arrayParts) {
    if (arrayValue && arrayValue[part]) {
      arrayValue = arrayValue[part];
    } else {
      return ""; // Array not found
    }
  }

  // Check if we have an array
  if (!Array.isArray(arrayValue)) {
    return "";
  }

  const xmlTagRegex = new RegExp(`<([^>]*)>${placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}<\\/\\1>`);
  const matches = feed.match(xmlTagRegex);
  
  if (!matches || matches.length < 2) {
    return "";
  }

  const tagName = matches[1];
  let tagValue = "";
  
  const maxCount = parseInt(placeholderProperties['count']);
  const itemsToProcess = Math.min(maxCount, arrayValue.length);

  for (let counter = 0; counter < itemsToProcess; counter++) {
    const arrayItem = arrayValue[counter];
    
    if (arrayItem && arrayItem[lastMatchedProperty] !== undefined) {
      if (counter > 0) {
        tagValue += `</${tagName}><${tagName}>`;
      }
      tagValue += wrapInCDATAIfNeeded(arrayItem[lastMatchedProperty]);
    }
  }

  return tagValue;
}

const handleDefault = (placeholder, item, feed, type) => {

  const logger = Core.Logger('main', {level: 'info'})

  const [dataKey] = extractFromPlaceholder(placeholder);

  let value = "";

  let isDebug = false;
  if (isDebug === true) {
    logger.error("handleDefault START for " + dataKey);
  } 

  let placeholderParts = dataKey.split(".");
  for (let placeholderPart of placeholderParts) {

    if (value === undefined || value === null) {
      break;
    }

    if (isDebug === true) {
      logger.error("value before every loop " + JSON.stringify(value));    
    }

    if (value.toString() === "") { 
      if (isDebug === true) {
        logger.error("item[placeholderPart] " + JSON.stringify(item[placeholderPart]));    
      }

      value = item[placeholderPart];
    } else { 

      if (isDebug === true) {
        logger.error("value[placeholderPart] " + JSON.stringify(value[placeholderPart]));    
      }
      value = value[placeholderPart];

    }
  }

  let tagValue = value;
  if (type === "xml") {
    tagValue = wrapInCDATAIfNeeded(value);
  }

  return tagValue;
}

function extractFromPlaceholder(placeholder) {
  const placeholderMatch = placeholder.match(/{{([^{}]+)}}/);
  if (!placeholderMatch) {
    return ["", {}];
  }
  
  const content = placeholderMatch[1].trim();
  const parts = content.split(/\s+/);
  const datakey = parts[0];

  let placeholderProperties = {};
  
  // Parse properties from the remaining parts
  for (let i = 1; i < parts.length; i++) {
    const part = parts[i];
    const propertyMatch = part.match(/(\w+)\s*=\s*['"]?([^'"]+)['"]?/);
    if (propertyMatch) {
      placeholderProperties[propertyMatch[1]] = propertyMatch[2];
    }
  }

  return [datakey, placeholderProperties];
}

/**
 * Function defined if content have to be wrapped to CDATA depends on XML standard
 *
 * @param {string} value
 * @returns
 */
function wrapInCDATAIfNeeded(value)
{
  // Ensure the value is a string before proceeding
  if (typeof value !== 'string') {
    if (typeof value === 'number') {
      return value.toString();
    }
    return "";
  }

  // Check for null or undefined values
  if (value === null || value === undefined) {
      return "";
  }

  // Check if the value contains any characters that require CDATA wrapping
  const needsCDATA = /[<>&]/.test(value) || value.includes(']]>');

  if (needsCDATA) {
      // If the value needs CDATA wrapping, return it wrapped in a CDATA section
      return `<![CDATA[${value.replace(/]]>/g, ']]]]><![CDATA[>')}]]>`;
  } else {
      // If not, return the original value
      return value;
  }
}

module.exports = {
  handlePlaceholder,
  wrapInCDATAIfNeeded,
  extractFromPlaceholder,
  handleAttributeByCode,
  handleNoProperties,
  handleCount,
  handleSuppressNull,
  handleCategories,
  handleDefault
};
