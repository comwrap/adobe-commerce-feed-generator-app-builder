/**
 * Validate if value equal to target value and not equal to undefined
 * 
 * @param {string} value 
 * @param {string} target 
 * @returns {string}
 */
function validateStateAgainstValue(value, target = "") 
{
    if (value !== undefined && value != target) {
        return "valid"
    }
    return "invalid"
}

/**
 * Validate form before saving
 * 
 * @param {Array} feedData 
 * @returns {Array}
 */
function validateFeedForm(feedData)
{
    let validationState = {}
    let errorMessages = []
    if (validateStateAgainstValue(feedData['feedName']) !== 'valid') {
        validationState['isFieldNameValid'] = 'invalid'
    }
    if (validateStateAgainstValue(feedData['feed_type']) !== 'valid') {
        validationState['isFieldTypeValid'] = 'invalid'
    }
    if (validateStateAgainstValue(feedData['store_code']) !== 'valid') {
        validationState['isFieldStoreValid'] = 'invalid'
    }
    if (validateStateAgainstValue(feedData['feedBody']) !== 'valid') {
        errorMessages.push("Feed Item Body cannot be empty!")
    } else {

        let usedFeedHeader = feedData['feedHeader'];
        if (usedFeedHeader == undefined) {
            usedFeedHeader = "";
        }
        let usedFeedFooter = feedData['feedFooter'];
        if (usedFeedFooter == undefined) {
            usedFeedFooter = "";
        }
        let usedFeedBody = feedData['feedBody'];
        if (usedFeedBody == undefined) {
            usedFeedBody = "";
        }

        if (!validateXml(usedFeedHeader + usedFeedBody + usedFeedFooter)) {
            errorMessages.push("XML for generation is invalid, please align it and try again!")
        }
    }
    
    return [validationState, errorMessages];
}

/**
 * Validate if XML is a valid XML
 * 
 * @param {*} xml 
 * @returns {boolean}
 */
function validateXml(xml)
{
    // Create a new DOMParser
    const parser = new DOMParser();

    try {
        const xmlDoc = parser.parseFromString(xml, "text/xml");

        // Check if there are any parsing errors
        const parseErrors = xmlDoc.getElementsByTagName("parsererror");
        if (parseErrors.length > 0) {
            // XML is invalid
            return false;
        } else {
            // XML is valid
            return true;
        }
    } catch (error) {
        // An error occurred during parsing
        return false;
    }
}

module.exports = {
    validateStateAgainstValue,
    validateFeedForm
}