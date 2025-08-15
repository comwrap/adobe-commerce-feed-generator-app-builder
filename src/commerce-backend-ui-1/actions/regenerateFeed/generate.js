const {generateFeed} = require('./../utils/generation.js')

// main function that will be executed by Adobe I/O Runtime
async function main(params) {

    const uuidToExport = params.data.uuid
    return await generateFeed(uuidToExport, params);
}

exports.main = main