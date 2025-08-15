import React, {useState, useEffect} from 'react';
import PropTypes from 'prop-types'
import {
    View,
    Heading,
    Link
} from '@adobe/react-spectrum'
import FeedsTable from "./FeedsTable";
import {useAsyncList} from 'react-stately';

class RecentFeeds extends React.Component {
    constructor(props) {
        super(props)

        this.state = {
            actionResponseError:    null,
            actionInvokeInProgress: false,
            feeds:                  null,
            loading:                true
        }
        this.showAllFeeds = this.showAllFeeds.bind(this);
    }

    showAllFeeds() {
        const {changeTab} = this.props;
        changeTab('feeds');
    }

    render() {
        const rows = 5;
        return (
            <View>
                <div className="block-recent-feeds">
                    <div className="heading">
                        <Heading level={2}>Recent Feeds</Heading>
                        <div className="actions">
                            <Link onPress={this.showAllFeeds}>All Feeds</Link>
                        </div>
                    </div>
                    <FeedsTable ims={this.props.ims} runtime={this.props.runtime} num={rows}/>
                </div>
            </View>
        )
    }
}

RecentFeeds
    .propTypes =
    {
        ims: PropTypes.object
    }
;

export default RecentFeeds