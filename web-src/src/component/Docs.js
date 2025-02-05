import React, { useEffect } from 'react';

function Docs() {
    useEffect(() => {
        window.open("https://spectrum.adobe.com/", "_blank", "noopener,noreferrer");
    }, []);

    return null; // No UI is rendered
}

export default Docs;