import { Component } from "react";
import {
    MenuTrigger,
    ActionButton,
    Menu,
    Item,
    DialogContainer,
    AlertDialog
} from '@adobe/react-spectrum';
import More from '@spectrum-icons/workflow/More';
import FeedForm from './FeedForm'
import {invokeAction} from '../utils'
import {ToastQueue} from "@react-spectrum/toast";

class FeedActionMenuDialog extends Component {
    constructor(props) {
        super(props);
        this.state = {
            dialog: null,
            isOpen: false
        };
        this.setDialog = this.setDialog.bind(this);
    }

    setDialog(dialog) {
        this.setState({ dialog: dialog });
    }
    setOpen(isOpen) {
        this.setState({ isOpen: isOpen });
    }

    reloadFeedsTable = () => {
        this.props.reloadFeedsTable();
    }

    onDeleteFeedAction = () => {
        console.log('feed removing')
        const self = this;
        this.deleteFeed().then(response => {
            ToastQueue.neutral('Feed deleted.', {timeout: 5000});
            console.log('feed removed')
            this.reloadFeedsTable();
        }).catch(err => {
            ToastQueue.negative("Can't delete feed.", {timeout: 5000})
            console.error('Error:', err)
        }).finally(() => {

        });
        console.log('feed removing end')
    }

    async deleteFeed() {
        const headersData = {}
        if (this.props.ims.token && !headersData.authorization) {
            headersData.authorization = 'Bearer ' + this.props.ims.token
        }
        if (this.props.ims.org && !headersData['x-gw-ims-org-id']) {
            headersData['x-gw-ims-org-id'] = this.props.ims.org
        }
        const params = {"uuid": this.props.feedUuid}

        try {
            const deleteFeedResponse = await invokeAction('feed-generator/deleteFeed', headersData, params, this.props)
            console.log(`Delete feed response:`, deleteFeedResponse)
            return;
        } catch (e) {
            console.error(e)
            this.setState({feedData: null, actionResponseError: e.message, actionInvokeInProgress: false})
            return;
        }
    }

    render() {
        const { dialog, isOpen } = this.state;
        return (
            <>
                <MenuTrigger>
                    <ActionButton aria-label="Actions">
                        <More/>
                    </ActionButton>
                    <Menu onAction={this.setDialog}>
                        <Item key="edit">Edit</Item>
                        <Item key="delete">Delete</Item>
                    </Menu>
                </MenuTrigger>

                {dialog === 'edit'
                    &&
                    (<FeedForm
                    reloadFeedsTable={this.reloadFeedsTable}
                    feedUuid={this.props.feedUuid}
                    isOpen={true}
                    setDialog={this.setDialog}
                    ims={this.props.ims}
                    runtime={this.props.runtime}/>)
                }

                {dialog === 'delete'
                    &&
                    (<DialogContainer
                            type="modal"
                            onDismiss={() => this.setDialog(null)}
                        >
                            <AlertDialog
                                title="Delete"
                                variant="destructive"
                                primaryActionLabel="Delete"
                                onPrimaryAction={this.onDeleteFeedAction}
                                cancelLabel="Cancel"
                            >
                                Are you sure you want to delete feed <b>{this.props.feedName}</b>?
                            </AlertDialog>
                        </DialogContainer>
                    )}
            </>
        );
    }
}

export { FeedActionMenuDialog };