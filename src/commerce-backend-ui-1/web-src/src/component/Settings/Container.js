import React from 'react'
import {
    View,
    Button
} from '@adobe/react-spectrum'
import SettingIcon from '@spectrum-icons/workflow/Settings'
import SettingForm from './SettingForm'

class Container extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            isOpen: false,
            feedFormKey: 0,
            contentKey: 0,
            tab: null
        };
    }

    reloadFeedTable = () => {
        this.setState({contentKey: this.state.contentKey + 1});
    }

    handleOpenSettings = () => {
        this.setOpen(true);
    }

    changeTab = (tabKey) => {
        this.setState({tab: tabKey});
    }
    setOpen = (value) => {
        this.setState({isOpen: value}, () => {
            console.log('Setting is Open:' + this.state.isOpen);
        });
    }

    render() {
        return (
            <View>
                <Button
                    variant="secondary" style="fill"
                    onPress={this.handleOpenSettings}
                >
                    <SettingIcon/><View paddingEnd='size-150'
                                        paddingStart='size-100'>Settings</View>
                </Button>
                <SettingForm key={this.state.feedFormKey}
                      isOpen={this.state.isOpen}
                      setDialog={this.setOpen}
                      ims={this.props.ims}
                      runtime={this.props.runtime}/>
            </View>
        )
    }
}


export default Container