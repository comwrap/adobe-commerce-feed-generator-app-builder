import regeneratorRuntime from 'regenerator-runtime'
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
    // ReactDOM.render(
    //     <App runtime={mockRuntime} ims={mockIms} />,
    //     document.getElementById('root')
    // )
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

    // use this to set a favicon
    // runtime.favicon = 'url-to-favicon'

    // use this to respond to clicks on the app-bar title
    // runtime.heroClick = () => window.alert('Did I ever tell you you\'re my hero?')

    // ready event brings in authentication/user info
    runtime.on('ready', ({ imsOrg, imsToken, imsProfile, locale }) => {
        // tell the exc-runtime object we are done
        runtime.done()
        console.log('Ready! received imsProfile:', imsProfile)
        const ims = {
            profile: imsProfile,
            org: imsOrg,
            token: imsToken
        }

        // ReactDOM.render(
        //     <App runtime={runtime} ims={ims} />,
        //     document.getElementById('root')
        // )

        const root = ReactDOMClient.createRoot(document.getElementById("root"));
        root.render(
            // <React.StrictMode>//disabled because cause issue with react-spectrum dropdowns and codemirror
                <App runtime={runtime} ims={ims} />
            // </React.StrictMode>
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

//
// const root = ReactDOMClient.createRoot(document.getElementById("root"));
// root.render(
//     <React.StrictMode>
//         <App />
//     </React.StrictMode>
// );