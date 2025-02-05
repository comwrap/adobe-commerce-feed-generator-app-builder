/**
 * Class for processing pre-defined variables
 * At this moment used only for header and footer, so Body may not be supported
 * 
 * @param {string} feed 
 * 
 * @returns {string} feed with processed variables
 */
const processVariables = (feed) => {

    const variablesHandles = {
        "{{DATE}}": handleDate
    }
    
    const placeholders = [...feed.matchAll(/{{.*?}}/g)];
    for (let placeholder of placeholders) {
        placeholder = String(placeholder[0]);
        let variableValue = ""
        if (variablesHandles[placeholder]) {
            variableValue = variablesHandles[placeholder](feed);
        }
        feed = feed.replace(placeholder, variableValue);
    }
    return feed;
}

const handleDate = () => {
    return new Date().toISOString();
}

module.exports = {
    processVariables   
}