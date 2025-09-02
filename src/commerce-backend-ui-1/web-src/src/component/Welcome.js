
import React from 'react'
import {
    Heading,
    View
} from '@adobe/react-spectrum'

class Welcome extends React.Component {
    render () {
        return (
            <View backgroundColor="gray-50" borderColor="gray-300" borderRadius="medium" borderWidth="thin" width="100%" paddingY="size-100" paddingX="size-250">
                <Heading level={2}>Welcome to the Feed Generator</Heading>
                <p>Feed Generator is a service that simplifies the process of generating product feeds. It ensures that you can easily integrate your store with various systems. With just a few configuration steps you can generate a feed that can be consumed by third-party marketplaces like Google and Facebook — or that can be used for integrating with any other third-party system.</p>
            </View>
        )
    }
}


export default Welcome