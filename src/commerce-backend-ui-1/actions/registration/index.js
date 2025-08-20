async function main() {
    const extensionId = 'feedGenerator'

    return {
        statusCode: 200,
        body: {
            registration: {
                menuItems: [
                    {
                        id: `${extensionId}::config`,
                        title: `Configuration`,
                        parent: `${extensionId}::feedgenerator`,
                        sortOrder: 1,
                    },
                    {
                        id: `${extensionId}::feedgenerator`,
                        title: 'Feed Generator',
                        isSection: true,
                        sortOrder: 100
                    }
                ],
                page: {
                    title: 'Feed Generator',
                }
            }
        }
    }
}

exports.main = main