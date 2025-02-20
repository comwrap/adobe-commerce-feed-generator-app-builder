const {Core} = require('@adobe/aio-sdk')

const handlePlaceholder = (placeholder, item, type, feed, generatedFeed) => {
  const handlers = [
    handleNoProperties,
    handleCount,
    handleSuppressNull,
    handleCategories,
    handleDefault,
  ];

  for (let handler of handlers) {
    let tagValue = handler(placeholder, item, feed, type);
    if (tagValue !== null) {
      generatedFeed = generatedFeed.replace(placeholder, tagValue);
      break;
    }
  }

  return generatedFeed;
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
  
  // const logger = Core.Logger('main', {level: 'info'})

  // eslint-disable-next-line no-unused-vars
  const [dataKey, placeholderProperties] = extractFromPlaceholder(placeholder);

  // logger.error("handleCategories START");

  let placeholderParts = dataKey.split(".");

  if (placeholderParts[0] !== 'categories') {
    return null;
  }

  // logger.error("item " + JSON.stringify(item));
  // logger.error("placeholderParts " + JSON.stringify(placeholderParts));
  // logger.error("placeholderParts0 " + JSON.stringify(placeholderParts[0]));

  let value = "";
  let itemCounter = 0;
  for (let placeholderPart of placeholderParts) {

    // logger.error("placeholderPart " + JSON.stringify(placeholderPart));
    if (value.toString() === "") { 

      // logger.error("item[placeholderPart] " + JSON.stringify(item[placeholderPart]));
      if (itemCounter === 0) {

        // logger.error("item[placeholderPart] VALUE " + JSON.stringify(item[placeholderPart][0]));
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
        // logger.error("item[placeholderPart] VALUE itemCounter > 0" + JSON.stringify(item[placeholderPart]));
        value = item[placeholderPart]  
      }
    } else { 
      // logger.error("value[placeholderPart] " + JSON.stringify(value[placeholderPart]));
      // logger.error("value " + JSON.stringify(value));
      value = value[placeholderPart];
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
  placeholderParts.pop();

  let value = "";
  for (let placeholderPart of placeholderParts) {
    if (value === "") { 
      value = item[placeholderPart];
    } else { 
      value = value[placeholderPart];
    }
  }

  let tagValue = value;

  const xmlTagRegex = new RegExp(`<([^>]*)>${placeholder}<\\/\\1>`);
  const matches = feed.match(xmlTagRegex);
  if (matches && matches.length > 1) {
    const tagName = matches[1];
    for (let counter = 0; counter < placeholderProperties['count']; counter++) {
      if (value[counter] !== undefined) {
        if (counter > 0) {
          tagValue += "</" + tagName + "><"+ tagName + ">";
        }
        tagValue += wrapInCDATAIfNeeded(value[counter][lastMatchedProperty]);
      }
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
  const datakey = placeholderMatch[1].split(' ')[0].trim();

  let placeholderProperties = [];
  const propertiesRegex = /\b(\w+)\s*=\s*(\d+|".*?")/g;
  let propertiesMatch;
  while ((propertiesMatch = propertiesRegex.exec(placeholderMatch[0])) !== null) {
    placeholderProperties[propertiesMatch[1]] = propertiesMatch[2].replace(/"/g, '');
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
  handlePlaceholder: handlePlaceholder,
  wrapInCDATAIfNeeded
};
