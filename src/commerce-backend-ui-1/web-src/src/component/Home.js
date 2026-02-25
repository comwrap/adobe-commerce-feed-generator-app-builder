import React from 'react'
import PropTypes from 'prop-types'
import {
    View
} from '@adobe/react-spectrum'
import actions from '../config.json'
import actionWebInvoke from '../utils'
import Welcome from './Welcome'
import RecentFeeds from './RecentFeeds'

class Home extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            actionResponseError: null,
            actionInvokeInProgress: false,
            profiles: null,
            propsState: props
        }
    }

    // invoke send-promo action by user email
    async sendPromo(email) {
        try {
            const headers = {}

            // set the authorization header and org from the ims props object
            if (this.props.ims.token && !headers.authorization) {
                headers.authorization = 'Bearer ' + this.props.ims.token
            }
            if (this.props.ims.org && !headers['x-gw-ims-org-id']) {
                headers['x-gw-ims-org-id'] = this.props.ims.org
            }
            const actionResponse = await actionWebInvoke(actions['send-promo'], headers, {email})
        } catch (e) {
            // log and store any error message
            console.error(e)
        }
    }

    render() {

        return (
            <View>
                <View paddingY="size-250"><Welcome/></View>
                <View paddingY="size-250">
                    <RecentFeeds ims={this.props.ims}
                                 runtime={this.props.runtime}
                                 changeTab={this.props.changeTab}
                    />
                </View>
            </View>
        )
    }
}

Home.propTypes = {
    ims: PropTypes.any
}

export default Home