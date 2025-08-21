import {useCodeEditor} from "./use-code-editor";
import {View} from '@adobe/react-spectrum';
import {useState} from 'react';

function CodeMirror({value, onChange, mode, autocompleteCustomList}) {
    const ref = useCodeEditor({value, onChange, mode, autocompleteCustomList});

    return (
        <div className='codemirror-ref' ref={ref}/>
    );
}

const CodeEditor = (props) => {
    const [code, setCode] = useState(props.code);
    const [mode, setMode] = useState(props.mode);
    const [autocompleteCustomList, setAutocompleteCustomList] = useState(props.autocompleteCustomList);

    return (
        <View height="100%">
            <CodeMirror
                height="size-3600"
                value={code}
                mode={props.mode}
                autocompleteCustomList={props.autocompleteCustomList}
                onChange={(newCode) => {
                    setCode(newCode);
                    props.onCodeChange(newCode);
                }}
            />
        </View>
    );
}
export default CodeEditor;