```tsx
import { AutoComplete } from './AutoComplete';
import React from 'react';

const Demo = () => {
    const divRef = React.useRef(null);
    const [div, setDiv] = React.useState(null);
    React.useEffect(() => {
        divRef.current.addEventListener('keydown', (event) => {
            if (event.key === '#' || event.char === '#') {
                event.preventDefault();
                const span = document.createElement('span');
                span.innerHTML = '#';
                divRef.current.appendChild(span);
                setDiv(span);

                const sel = window.getSelection();
                sel.removeAllRanges();
                const range = document.createRange();
                const last = span.lastChild;
                const offset = last.textContent.length;
                range.setStart(last, offset);
                range.setEnd(last, offset);
                sel.addRange(range);
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
                    if (x == null) {
                        setDiv(undefined);
                        return;
                    }

                    div.textContent = x;
                    setDiv(undefined);
                    const sel = window.getSelection();
                    sel.removeAllRanges();
                    const range = document.createRange();
                    const last = div.lastChild;
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
