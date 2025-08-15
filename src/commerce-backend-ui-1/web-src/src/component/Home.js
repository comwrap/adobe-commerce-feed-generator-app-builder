import React from 'react'
import PropTypes from 'prop-types'
import {
    View
} from '@adobe/react-spectrum'
import actions from '../config.json'
import actionWebInvoke from '../utils'
import Welcome from './Welcome'
// import QuickStart from './QuickStart'
import RecentFeeds from './RecentFeeds'

class Home extends React.Component {
    constructor(props) {
        super(props)
        console.log('Home runtime object:', props.runtime)
        console.log('Home ims object:', props.ims)

        // use exc runtime event handlers
        // respond to configuration change events (e.g. user switches org)
        props.runtime.on('configuration', ({imsOrg, imsToken, locale}) => {
            console.log('configuration change', {imsOrg, imsToken, locale})
        })
        // respond to history change events
        props.runtime.on('history', ({type, path}) => {
            console.log('history change', {type, path})
        })

        this.state = {
            actionResponseError: null,
            actionInvokeInProgress: false,
            profiles: null,
            propsState: props
        }
    }

    async componentWillMount() {
        this.setState({actionInvokeInProgress: true})

        const headers = {}
        const params = {}

        // set the authorization header and org from the ims props object
        if (this.props.ims.token && !headers.authorization) {
            headers.authorization = 'Bearer ' + this.props.ims.token
        }
        if (this.props.ims.org && !headers['x-gw-ims-org-id']) {
            headers['x-gw-ims-org-id'] = this.props.ims.org
        }
        try {
            // const actionResponse = await actionWebInvoke(actions['get-profiles'], headers, params)
            // this.setState({
            //     profiles: actionResponse.body.content,
            //     actionResponseError: null,
            //     actionInvokeInProgress: false
            // })
            // console.log(`action response:`, actionResponse)
        } catch (e) {
            console.error(e)
            this.setState({profiles: null, actionResponseError: e.message, actionInvokeInProgress: false})
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
            console.log(`Response from send-promo:`, actionResponse)
        } catch (e) {
            // log and store any error message
            console.error(e)
        }
    }

    render() {

        return (
            <View>
                <View paddingY="size-250"><Welcome/></View>
                {/* <View paddingY="size-250"><QuickStart/></View> */}
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