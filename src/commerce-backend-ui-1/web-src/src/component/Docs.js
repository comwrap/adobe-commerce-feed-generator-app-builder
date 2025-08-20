import { useEffect } from 'react';

function Docs() {
    useEffect(() => {
        window.open("https://github.com/comwrap/adobe-commerce-feed-generator-app-builder/blob/main/README.md", "_blank", "noopener,noreferrer");
    }, []);


    return (
        <div>
            <a href="https://github.com/comwrap/adobe-commerce-feed-generator-app-builder/blob/main/README.md" target="_blank" rel="noopener noreferrer">
                <h1>Documentation</h1>
            </a>
        </div>
    ); // No UI is rendered
}

export default Docs;