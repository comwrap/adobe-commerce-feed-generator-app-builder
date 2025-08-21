// use-code-mirror.ts
import React, {useState, useEffect, useRef} from 'react';
import {EditorView, basicSetup} from 'codemirror';
import { EditorState } from '@codemirror/state';
import {javascript} from "@codemirror/lang-javascript";
import {xml} from "@codemirror/lang-xml";
import {autocompletion, completeFromList} from "@codemirror/autocomplete";

export default function useCodeMirror(extensions, mode, autocompleteCustomList) {
    const ref = useRef();
    const [view, setView] = useState();

    function getModeExtension(mode) {
        if (mode === 'xml') {
            return xml();
        }
        return javascript()
    }

    useEffect(() => {
        let autocompletionConfig = {};
        if (autocompleteCustomList.length > 0) {
            autocompletionConfig = {override: [completeFromList(autocompleteCustomList)]};
        }
        const basicExtensions = [
            basicSetup,
            getModeExtension(mode),
            autocompletion(autocompletionConfig),
            ...extensions
        ];


        const view = new EditorView({
            state: EditorState.create({
                extensions: basicExtensions
            }),
            parent: ref.current
        });

        setView(view);

        return () => {
            view.destroy();
            setView(undefined);
        };
    }, [mode]);

    return {ref, view};
}

