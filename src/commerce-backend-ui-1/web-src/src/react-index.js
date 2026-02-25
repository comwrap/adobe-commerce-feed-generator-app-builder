import Runtime, { init } from '@adobe/exc-app'

import React from "react"
import ReactDOMClient from "react-dom/client"
// import ReactDOM from 'react-dom'
// import { Provider, defaultTheme, Button } from "@adobe/react-spectrum"

import App from './component/App'

/* Here you can bootstrap your application and configure the integration with the Adobe Experience Cloud Shell */
try {
    // attempt to load the Experience Cloud Runtime
    require('./exc-runtime')
    // if there are no errors, bootstrap the app in the Experience Cloud Shell
    init(bootstrapInExcShell)
} catch (e) {
    console.log('application not running in Adobe Experience Cloud Shell')
    // fallback mode, run the application without the Experience Cloud Runtime
    bootstrapRaw()
}

function bootstrapRaw () {
    /* **here you can mock the exc runtime and ims objects** */
    const mockRuntime = { on: () => {} }
    const mockIms = {}
    // render the actual react application and pass along the runtime object to make it available to the App
    const root = ReactDOMClient.createRoot(document.getElementById("root"));
    root.render(
        <React.StrictMode>
            <App runtime={mockRuntime} ims={mockIms} />
        </React.StrictMode>
    );
}

function bootstrapInExcShell () {
    // get the Experience Cloud Runtime object
    const runtime = Runtime()

    // ready event brings in authentication/user info
    runtime.on('ready', ({ imsOrg, imsToken, imsProfile, locale }) => {
        // tell the exc-runtime object we are done
        runtime.done()
        const ims = {
            profile: imsProfile,
            org: imsOrg,
            token: imsToken
        }

        const root = ReactDOMClient.createRoot(document.getElementById("root"));
        root.render(
            <App runtime={runtime} ims={ims} />
        );
    })

    // set solution info, shortTitle is used when window is too small to display full title
    runtime.solution = {
        icon: 'AdobeExperienceCloud',
        title: 'Cowmrap Feed Generator',
        shortTitle: 'CFG'
    }
    runtime.title = 'Cowmrap Feed Generator'
}