// on-update.ts
import {EditorView, ViewUpdate} from "@codemirror/view";

type OnChange = (value: string, viewUpdate: ViewUpdate) => void;

export function onUpdate(onChange: OnChange) {
    return EditorView.updateListener.of((viewUpdate: ViewUpdate) => {
        if (viewUpdate.docChanged) {
            const doc = viewUpdate.state.doc;
            const value = doc.toString();
            onChange(value, viewUpdate);
        }
    });
}