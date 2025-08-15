async function main() {
    const extensionId = 'comwrap-feed-generator'

    return {
        statusCode: 200,
        body: {
            registration: {
                menuItems: [
                    {
                        id: `${extensionId}::config`,
                        title: `Configuration`,
                        parent: `${extensionId}::stock`,
                        sortOrder: 1,
                    },
                    {
                        id: `${extensionId}::stock`,
                        title: 'Stock',
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