
import React from 'react'
import PropTypes from 'prop-types'
import {
    Heading,
    View
} from '@adobe/react-spectrum'
import FeedsTable from "./FeedsTable";

class Feeds extends React.Component {
    constructor(props) {
        super(props)

        this.state = {
            actionResponseError: null,
            actionInvokeInProgress: false,
            feeds: null,
            loading: true
        }
    }

    render() {
        return (
            <View>
                <Heading level={2}>Feeds</Heading>
                <FeedsTable ims={this.props.ims} runtime={this.props.runtime}/>
            </View>
        )
    }
}

Feeds.propTypes = {
    ims: PropTypes.any
}

export default Feeds