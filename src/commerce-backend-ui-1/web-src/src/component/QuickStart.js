import React from 'react'
import PropTypes from 'prop-types'
import {
    Heading,
    View
} from '@adobe/react-spectrum'

class QuickStart extends React.Component {
    constructor(props) {
        super(props)
    }

    render() {
        return (
            <View>
                <Heading level={2}>QuickStart</Heading>
                <p>Portland grailed pour-over sriracha umami, actually marfa. Raclette cold-pressed hammock bicycle
                    rights. Poke jawn gatekeep selfies, semiotics lomo narwhal migas intelligentsia prism yuccie bicycle
                    rights grailed bitters wolf. Hashtag iceland truffaut tattooed tumblr, kinfolk big mood mumblecore
                    affogato echo park.</p>
            </View>
        )
    }
}


export default QuickStart