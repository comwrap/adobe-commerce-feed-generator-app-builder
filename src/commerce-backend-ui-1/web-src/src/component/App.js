import React from 'react'

import PropTypes from 'prop-types';
import {
    Provider,
    defaultTheme,
    View,
    Header,
    Footer,
    Content,
    Button,
    Tabs,
    TabList,
    TabPanels,
    Image,
    Heading,
    Item,
    Flex,
    ProgressCircle
} from '@adobe/react-spectrum'
import { attach } from '@adobe/uix-guest'

import logo from 'url:../../media/logo.png'

import {ToastContainer} from '@react-spectrum/toast'


import Home from './Home'
import Feeds from './Feeds'
import Docs from './Docs'
import SettingsContainer from './Settings/Container'
import FeedForm from "./FeedForm";

function App(props) {

    // use exc runtime event handlers
    // respond to configuration change events (e.g. user switches org)
    props.runtime.on('configuration', ({imsOrg, imsToken, locale}) => {
        console.log('configuration change', {imsOrg, imsToken, locale})
    })
    // respond to history change events
    props.runtime.on('history', ({type, path}) => {
        console.log('history change', {type, path})
    })

    const [isOpen, setOpen] = React.useState(false);
    const [feedFormKey, setFeedFormKey] = React.useState(0);
    const [contentKey, setContentKey] = React.useState(0);
    const [tab, setTab] = React.useState('home');
    const [imsState, setImsState] = React.useState(props.ims);
    const [isTokenReady, setIsTokenReady] = React.useState(!!props.ims.token);

    // Get token from UIX guest context once at startup if not available
    React.useEffect(() => {
        async function initToken() {
            if (!imsState.token) {
                console.log('App: Token not available, fetching from UIX guest context...');
                try {
                    const guestConnection = await attach({ id: 'feedGenerator' });
                    const token = guestConnection?.sharedContext?.get('imsToken');
                    const org = guestConnection?.sharedContext?.get('imsOrgId');
                    if (token) {
                        console.log('App: Got token from UIX guest context');
                        setImsState({ ...imsState, token, org });
                    }
                } catch (e) {
                    console.error('App: Failed to get token from UIX guest context:', e);
                }
            }
            setIsTokenReady(true);
        }
        initToken();
    }, []);

    const reloadFeedTable = () => {
        setContentKey(contentKey + 1);
    }

    const handleCreateFeedClick = () => {
        setOpen(true);
        setFeedFormKey(feedFormKey + 1);
    }

    const changeTab = (tabKey) => {
        setTab(tabKey)
    }

    // Show loading while waiting for token
    if (!isTokenReady) {
        return (
            <Provider theme={defaultTheme} colorScheme="light">
                <View padding="size-1000">
                    <Flex direction="column" alignItems="center" justifyContent="center" gap="size-200">
                        <ProgressCircle aria-label="Loading..." isIndeterminate size="L" />
                        <Heading level={4}>Loading Feed Generator...</Heading>
                    </Flex>
                </View>
            </Provider>
        );
    }

    return (

        <Provider theme={defaultTheme} colorScheme="light">

            <ToastContainer />
            <Tabs
                aria-label="Feed Generator navigation"
                selectedKey={tab}
                onSelectionChange={setTab}
            >
                <View gridArea="header" height="size-700" paddingX="size-250" paddingY="size-100">
                    <Header>
                        <Flex direction="row" justifyContent="space-between">
                            <View gridArea="header-logo" width="size-5000" height="size-400">
                                <Flex direction="row" gap="size-100" justifyContent="left">
                                    <View width="size-400" height="size-400" padding="size-150">
                                        <Image src={logo} alt="Feed Generator" />
                                    </View>
                                    <Heading level={3}>Feed Generator</Heading>
                                </Flex>
                            </View>

                            <View gridArea="header-nav" width="size-5000" height="size-400">
                                <Flex direction="row"  gap="size-100" justifyContent="center">
                                        <TabList>
                                            <Item key="home">Home</Item>
                                            <Item key="feeds">Feeds</Item>
                                            <Item key="docs">Docs</Item>
                                        </TabList>
                                </Flex>
                            </View>

                            <View gridArea="header-button" width="size-5000" height="size-400">
                                <Flex direction="row" justifyContent="right">

                                    <Button variant="accent" onPress={handleCreateFeedClick}>
                                        Create new feed
                                    </Button>
                                    <FeedForm
                                        key={feedFormKey}
                                        reloadFeedsTable={reloadFeedTable}
                                        isOpen={isOpen}
                                        setDialog={setOpen}
                                        ims={imsState}
                                        runtime={props.runtime}/>
                                    <View marginStart="size-250">
                                        <SettingsContainer
                                            ims={imsState}
                                            runtime={props.runtime}/>
                                    </View>
                                </Flex>
                            </View>
                        </Flex>
                    </Header>
                </View>

                <View gridArea="content" paddingX="size-250" paddingY="size-100">
                    <Content key={contentKey}>
                        {/* Lazy load tabs - only mount selected tab to avoid duplicate API calls */}
                        {tab === 'home' && <Home ims={imsState} runtime={props.runtime} changeTab={changeTab}/>}
                        {tab === 'feeds' && <Feeds ims={imsState} runtime={props.runtime}/>}
                        {tab === 'docs' && <Docs/>}
                    </Content>
                </View>

                <View gridArea="footer" height="size-300" margin="0" paddingX="size-250" paddingY="size-100">
                    <Footer>&copy; 2025 Feed Generator. All Rights Reserved.</Footer>
                </View>
            </Tabs>


        </Provider>

    )
}

App.propTypes = {
    ims: PropTypes.object
};

export default App