```tsx
import { AutoComplete } from './AutoComplete';
import React from 'react';

const Demo = () => {
    const divRef = React.useRef(null);
    const [div, setDiv] = React.useState(null);
    React.useEffect(() => {
        setDiv(divRef.current);
    }, []);
    React.useEffect(() => {
        divRef.current.addEventListener('keyup', (event) => {
            if (event.key === '#' || event.char === '#') {
                setDiv(divRef.current);
            }
        });
    }, []);

    return (
        <>
            <div ref={divRef} contentEditable={true}>
                abc
            </div>
            <AutoComplete
                element={div}
                autoComplete={(s) => [s + '1', s + '2', s + '3']}
                select={(x) => {
                    divRef.current.textContent = x;
                    setDiv(undefined);
                    const sel = window.getSelection();
                    sel.removeAllRanges();
                    const range = document.createRange();
                    const last = divRef.current.lastChild;
                    const offset = last.textContent.length;
                    range.setStart(last, offset);
                    range.setEnd(last, offset);
                    sel.addRange(range);
                }}
            />
        </>
    );
};

<Demo />;
```
