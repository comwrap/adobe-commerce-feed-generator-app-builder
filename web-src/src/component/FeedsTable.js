import React, {useState, useEffect} from 'react'
import PropTypes from 'prop-types'
import {
    View,
    ProgressBar,
    StatusLight,
    Badge,
    Link,
    Cell, Column, Row, TableView, TableBody, TableHeader, Tooltip, TooltipTrigger, ActionButton
} from '@adobe/react-spectrum'
import moment from "moment";

import {actionWebInvoke, getAction, invokeAction} from '../utils'
import {FeedActionMenuDialog} from "./FeedActionMenuDialog"
import InfoOutline from '@spectrum-icons/workflow/InfoOutline'
import Copy from '@spectrum-icons/workflow/Copy';
import FeedForm from "./FeedForm";

// import FeedForm from "./FeedForm"

class FeedsTable extends React.Component {

    constructor(props) {
        super(props)

        this.state = {
            actionResponseError: null,
            actionInvokeInProgress: false,
            feeds: null,
            loading: true,
            dialogRefs: []
        }
    }

    async componentDidMount() {
        // this.setState({actionInvokeInProgress: true})
        //
        // const headers = {}
        // const params = {}
        //
        // // set the authorization header and org from the ims props object
        // if (this.props.ims.token && !headers.authorization) {
        //     headers.authorization = 'Bearer ' + this.props.ims.token
        // }
        // if (this.props.ims.org && !headers['x-gw-ims-org-id']) {
        //     headers['x-gw-ims-org-id'] = this.props.ims.org
        // }
        // try {
        //     const actionResponse = await invokeAction('getAllFeeds', headers, params, this.props)
        //     console.log(`Recent feed action response:`, actionResponse)
        //
        //     this.setState({
        //         feeds: actionResponse,
        //         actionResponseError: null,
        //         actionInvokeInProgress: false
        //     })
        // } catch (e) {
        //     console.error(e)
        //     this.setState({feeds: null, actionResponseError: e.message, actionInvokeInProgress: false})
        // }
        const self = this;

        async function fetchData() {
            const feedData = await self.getFeeds();
            self.setState({
                feeds: feedData,
                loading: false
            });
        }

        fetchData();
    }

    async getFeeds() {
        // this.setState({actionInvokeInProgress: true})

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
            const actionResponse = await invokeAction('getAllFeeds', headers, params, this.props)
            console.log(`Recent feed action response:`, actionResponse)

            // ----- for local development start ---------
            // const feedInformation = await invokeAction(
            //     'getFeedByUuid', headers, {'uuid':'d36f983d-504f-4266-8062-e59a6ee1e204'}, this.props
            // )
            // ----- for local development end ---------

            const feedRows = [];
            let i = 1;
            Object.keys(actionResponse).forEach(uuid => {
                if (typeof actionResponse[uuid] !== 'undefined' && typeof actionResponse[uuid].value !== 'undefined') {
                    if (this.props.num !== null && this.props.num < i) {
                        return false;
                    }
                    let link = ""
                    if (typeof actionResponse[uuid].value.file_path !== 'undefined') {
                        link = actionResponse[uuid].value.file_path
                    }

                    let errorMessage = actionResponse[uuid].value.error
                    if (errorMessage !== undefined && errorMessage !== "") {
                        errorMessage = errorMessage
                    } else {
                        errorMessage = "";
                    }

                    let status = actionResponse[uuid].value.status

                    let createAt = actionResponse[uuid].value.created_at
                    createAt = moment(createAt).format('HH:mm:ss DD.MM.YYYY');

                    let generatedAt = actionResponse[uuid].value.generated_at
                    if (generatedAt !== "") {
                        generatedAt = moment(generatedAt).format('HH:mm:ss DD.MM.YYYY');
                    } else {
                        generatedAt = ""
                    }
                    let name = actionResponse[uuid].value.feedName;
                    let storeCode = actionResponse[uuid].value.store_code;
                    let feedType = actionResponse[uuid].value.feed_type;
                    let error = ""
                    if (actionResponse[uuid].value.error !== undefined) {
                        error = actionResponse[uuid].value.error;
                    }

                    let nameUuid = "<Link><a href='test'>" + name + "</a><Link><Text>" + uuid + "</Text>";

                    let rowData = {
                        'id': i,
                        'uuid': uuid,
                        'name': name,
                        'store': storeCode,
                        'link': link,
                        'created_at': createAt,
                        'generated_at': generatedAt,
                        'type': feedType,
                        'status': status,
                        'action': '',
                        // 'error': errorMessage
                        'error': error
                    };
                    feedRows.push(rowData);
                    i = i + 1;
                }
            });
            console.log(`feeds rows:`, feedRows);
            return feedRows
        } catch (e) {
            console.error(e)
            this.setState({feeds: null, actionResponseError: e.message, actionInvokeInProgress: false})
            return [];
        }
    }

    //reload feeds table
    reloadFeedsTable = () => {
        const self = this;
        this.setState({
            feeds: null,
            loading: true
        });

        this.getFeeds().then(feedData => {
            self.setState({
                feeds: feedData
            });
        }).catch(err => {
            console.error('Error:', err)
        }).finally(() => {
            self.setState({
                loading: false
            });
        })
    }

    copyToClipboard = () => {
        
    }

    triggerFeedActionDialogState = (uuid) => {
        // Call setDialog in FeedActionMenuDialog
        this.state.dialogRefs[uuid].current.setDialog('edit');
        this.state.dialogRefs[uuid].current.setOpen(true);
    };

    render() {

        if (this.state.loading) {
            return <ProgressBar label="Loading feeds list…" isIndeterminate/>
        }

        const columns = [
            // {name: 'UUID', uid: 'uuid'},
            {name: 'NAME/UUID', uid: 'name'},
            {name: 'STORE', uid: 'store', width: 100},
            {name: 'FILE', uid: 'link', width: 100},
            {name: 'CREATED', uid: 'created_at', width: 200},
            {name: 'GENERATED', uid: 'generated_at', width: 200,},
            {name: 'TYPE', uid: 'type', width: 50},
            {name: 'STATUS', uid: 'status', width: 200},
            {name: '', uid: 'action', width: 50}
        ];
        console.log(`feeds object:`, this.state.feeds);

        const renderCell = (item, fieldName) => {
            const feedActionMenuDialogRef = React.createRef();
            this.state.dialogRefs[item['uuid']] = feedActionMenuDialogRef;

            if (fieldName === 'name') {
                return <Cell>
                    <View>
                        <Link onPress={() => this.triggerFeedActionDialogState(item['uuid'])}>{item[fieldName]}</Link>
                        {/*<FeedForm*/}
                        {/*    reloadFeedsTable={this.reloadFeedsTable}*/}
                        {/*    feedUuid={item['uuid']}*/}
                        {/*    isOpen={false}*/}
                        {/*    setDialog={this.setDialog}*/}
                        {/*    ims={this.props.ims}*/}
                        {/*    runtime={this.props.runtime}/>*/}
                    </View>
                    <View paddingTop="size-100">{item['uuid']}</View>
                </Cell>
            } else if (fieldName === 'status') {
                let status = item['status']
                let errorMsg = item['error']
                let variantTxt = "neutral"
                let label = "Undefined"
                if (status == "error") {
                    variantTxt = "negative"
                    label = "Error"
                }
                if (status == "generated") {
                    variantTxt = "positive"
                    label = "Generated"
                }
                if (status == "pending") {
                    variantTxt = "neutral"
                    label = "Pending"
                }
                if (status == "in progress") {
                    variantTxt = "yellow"
                    label = "In Progress"
                }
                // if (errorMsg == "") {
                //     return <Cell>
                //         <View><StatusLight variant={variantTxt}>{label}</StatusLight></View>
                //     </Cell>
                // }
                return <Cell>
                    <div className="cell status">
                        <View><StatusLight variant={variantTxt}>{label}</StatusLight></View>
                    </div>
                </Cell>
            } else if (fieldName === 'link') {
                let errorMsg = item['error']
                let link = item[fieldName];
                if (errorMsg !== "") {
                    return <Cell><TooltipTrigger delay='10'>
                            <ActionButton isQuiet aria-label="Show Errors"><InfoOutline /></ActionButton>
                            <Tooltip variant='negative' showIcon='true' width='550px'><div style={{ width: '500px' }}>{errorMsg}</div></Tooltip>
                        </TooltipTrigger><ActionButton onPress={() => navigator.clipboard.writeText(errorMsg).then(() => console.log("Text copied to clipboard"))} isQuiet area-label="Copy error to clipboard"><Copy /></ActionButton></Cell>
                }
                if (link !== "" && typeof link !== 'undefined') {
                    return <Cell>
                        <View><Link><a href={link} target="_blank" download>Download</a></Link></View>
                    </Cell>
                }
                return <Cell></Cell>
            } else if (fieldName === 'action') {
                return <Cell>
                    <FeedActionMenuDialog
                        ref={feedActionMenuDialogRef}
                        reloadFeedsTable={this.reloadFeedsTable}
                        feedUuid={item['uuid']}
                        feedName={item['name']}
                        ims={this.props.ims}
                        runtime={this.props.runtime}
                    />
                </Cell>
            } else {
                return <Cell>
                    {item[fieldName]}
                </Cell>
            }
        };

        return (
            <TableView aria-label="Feeds"
                       density="spacious"
                       overflowMode="wrap" >
                <TableHeader columns={columns}>
                    {column => (
                        <Column
                            key={column.uid}
                            width={column.width}
                            align={column.uid === 'created_at' || column.uid === 'generated_at' ? 'end' : 'start'}>
                            <View><span className="heading-title">{column.name}</span></View>
                        </Column>
                    )}
                </TableHeader>
                <TableBody items={this.state.feeds}>
                    {item => (
                        <Row>
                            {(columnKey) => renderCell(item, columnKey)}
                        </Row>
                    )}
                </TableBody>
            </TableView>
        )
    }
}

FeedsTable
    .propTypes =
    {
        ims: PropTypes.object
    }
;

export default FeedsTable