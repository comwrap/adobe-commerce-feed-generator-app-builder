import {onUpdate} from "./on-update";
import useCodeMirror from "./use-code-mirror";
import React, {useState, useEffect, useRef} from 'react';

export function useCodeEditor({ value, onChange, mode, autocompleteCustomList }) {
    const { ref, view } = useCodeMirror([onUpdate(onChange)], mode, autocompleteCustomList);

    useEffect(() => {
        if (view) {
            const editorValue = view.state.doc.toString();

            if (value !== editorValue) {
                view.dispatch({
                    changes: {
                        from: 0,
                        to: editorValue.length,
                        insert: value || "",
                    },
                });
            }
        }
    }, [value, view, mode]);

    return ref;
}