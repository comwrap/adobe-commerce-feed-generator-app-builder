import React from 'react'
import PropTypes from 'prop-types'
import {
    View,
    ProgressBar,
    StatusLight,
    Link,
    Cell, 
    Column, 
    Row, 
    TableView, 
    TableBody, 
    TableHeader, 
    Tooltip, 
    TooltipTrigger, 
    ActionButton
} from '@adobe/react-spectrum'
import moment from "moment";

import {invokeAction} from '../utils'
import {FeedActionMenuDialog} from "./FeedActionMenuDialog"
import InfoOutline from '@spectrum-icons/workflow/InfoOutline'
import Copy from '@spectrum-icons/workflow/Copy';

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
        // Token is now guaranteed to be available from App.js
        const feedData = await this.getFeeds();
        this.setState({
            feeds: feedData,
            loading: false
        });
    }

    async getFeeds() {

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
            const actionResponse = await invokeAction('feed-generator/getAllFeeds', headers, params, this.props)
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

                    let warning = ""
                    if (actionResponse[uuid].value.warning !== undefined) {
                        warning = actionResponse[uuid].value.warning;
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
                        'error': error,
                        'warning': warning
                    };
                    feedRows.push(rowData);
                    i = i + 1;
                }
            });
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
            {name: 'STORE', uid: 'store', width: 200},
            {name: 'FILE', uid: 'link', width: 100},
            {name: 'INFO', uid: 'info', width: 100},
            {name: 'CREATED', uid: 'created_at', width: 200},
            {name: 'GENERATED', uid: 'generated_at', width: 200,},
            {name: 'TYPE', uid: 'type', width: 50},
            {name: 'STATUS', uid: 'status', width: 200},
            {name: '', uid: 'action', width: 50}
        ];
        const renderCell = (item, fieldName) => {
            const feedActionMenuDialogRef = React.createRef();
            this.state.dialogRefs[item['uuid']] = feedActionMenuDialogRef;

            if (fieldName === 'name') {
                return <Cell>
                    <View>
                        <Link onPress={() => this.triggerFeedActionDialogState(item['uuid'])}>{item[fieldName]}</Link>
                    </View>
                    <View paddingTop="size-100">{item['uuid']}</View>
                </Cell>
            } else if (fieldName === 'store') {
                const storeCode = item['store'] || '';
                const storeParts = storeCode.split('||');
                const displayStore = storeParts.reverse().join(' -> ');
                
                return <Cell>
                    <View>{displayStore}</View>
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
                return <Cell>
                    <div className="cell status">
                        <View><StatusLight variant={variantTxt}>{label}</StatusLight></View>
                    </div>
                </Cell>
            } else if (fieldName === 'link') {
                let link = item[fieldName];
                if (link !== "" && typeof link !== 'undefined') {
                    return <Cell>
                        <View><Link><a href={link} target="_blank" download>Download</a></Link></View>
                    </Cell>
                }
                return <Cell></Cell>
            } else if (fieldName === 'info') {
                let errorMsg = item['error']
                let warningMsg = item['warning']
                
                // Display error in red if present
                if (errorMsg !== "" && errorMsg !== undefined) {
                    return <Cell>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                            <TooltipTrigger delay='10'>
                                <ActionButton isQuiet aria-label="Show Errors"><InfoOutline /></ActionButton>
                                <Tooltip variant='negative' showIcon='true' width='550px'><div style={{ width: '500px' }}>{errorMsg}</div></Tooltip>
                            </TooltipTrigger>
                            <ActionButton onPress={() => navigator.clipboard.writeText(errorMsg).then(() => console.log("Text copied to clipboard"))} isQuiet aria-label="Copy error to clipboard"><Copy /></ActionButton>
                        </div>
                    </Cell>
                }
                
                // Display warning in orange if present
                if (warningMsg !== "" && warningMsg !== undefined) {
                    return <Cell>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                            <TooltipTrigger delay='10'>
                                <ActionButton isQuiet aria-label="Show Warnings"><InfoOutline color="notice" /></ActionButton>
                                <Tooltip variant='neutral' showIcon='true' width='550px'><div style={{ width: '500px' }}>{warningMsg}</div></Tooltip>
                            </TooltipTrigger>
                            <ActionButton onPress={() => navigator.clipboard.writeText(warningMsg).then(() => console.log("Warning copied to clipboard"))} isQuiet aria-label="Copy warning to clipboard"><Copy /></ActionButton>
                        </div>
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