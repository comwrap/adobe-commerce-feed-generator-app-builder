import React, {useState, useEffect} from 'react'
import {useTreeData} from 'react-stately';
import PropTypes from 'prop-types'
import {
    Button,
    Dialog,
    DialogTrigger,
    DialogContainer,
    View,
    ActionButton,
    ButtonGroup,
    Heading,
    Item, Content, useDialogContainer, ProgressBar, Tabs, TabList, TabPanels
} from '@adobe/react-spectrum'


import SettingIcon from '@spectrum-icons/workflow/Settings'
import DeleteOutlineIcon from '@spectrum-icons/workflow/DeleteOutline'
import {ToastContainer, ToastQueue} from '@react-spectrum/toast'

class SettingForm extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            // loading: true
            loading: false
        };
        this.handleCancel = this.handleCancel.bind(this);
    }

    handleCancel = () => {
        this.props.setDialog(false);
        this.setState({loading: false, isOpen: false})
    }

    clearCache = () => {
        sessionStorage.removeItem('feeder-gql-schema');
        ToastQueue.info('Application cache cleared.', {timeout: 5000});
    }
    clearCacheAndClose = () => {
        this.clearCache()
        this.handleCancel()
    }

    render() {
        if (this.props.isOpen) {
            if (this.state.loading) {
                return (
                    <DialogContainer
                        type="modal"
                        isDismissable
                        onDismiss={this.handleCancel}
                    >
                        <Dialog>
                            <Content>
                                <View>
                                    <ProgressBar width="100%" label="Loading…" isIndeterminate/>
                                </View>
                            </Content>
                        </Dialog>
                    </DialogContainer>
                );
            }

            return (
                <DialogContainer
                    type="fullscreen"
                    isDismissable
                    onDismiss={this.handleCancel}
                >
                    <Dialog>
                        <View gridArea="heading"><Heading> Settings</Heading></View>
                        <Content>
                            <Tabs>
                                <TabList>
                                    {/*<Item key="gql">GraphQL</Item>*/}
                                    {/*<Item key="stores">Store View</Item>*/}
                                    <Item key="cache">Cache</Item>
                                </TabList>
                                <TabPanels>
                                    {/*<Item key="gql"><View>gql</View></Item>*/}
                                    {/*<Item key="stores"><View>stores</View></Item>*/}
                                    <Item key="cache">
                                        <View gridArea='content' paddingY='size-200'>
                                            <ButtonGroup>
                                                <Button variant="secondary"
                                                        onPress={this.clearCache}><DeleteOutlineIcon marginEnd="5px"/>  Clear
                                                    Cache</Button>

                                                <Button variant="secondary"
                                                        onPress={this.clearCacheAndClose}><DeleteOutlineIcon marginEnd="5px"/>  Clear
                                                    Cache And Close Settings</Button>
                                            </ButtonGroup>
                                        </View>
                                    </Item>
                                </TabPanels>
                            </Tabs>
                        </Content>
                    </Dialog>
                </DialogContainer>
            );
        }

        return null;
    }
}

export default SettingForm;