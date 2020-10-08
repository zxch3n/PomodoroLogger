import { debounce } from 'lodash';
import React from 'react';
import styled from 'styled-components';

interface StyleProps {
    strictInside?: boolean;
}

const Container = styled.div<StyleProps>`
    width: 100%;
    ${({ strictInside = true }) => (strictInside ? `overflow: hidden;` : 'overflow: auto;')}
`;

interface Props extends StyleProps {
    children?: (w: number) => React.ReactNode;
}

export const AdaptWidthContainer: React.FC<Props> = ({ children, ...style }) => {
    const [w, rawSetW] = React.useState(100);
    const setW = React.useMemo(() => debounce(rawSetW, 100), []);
    const selfRef = React.useRef<HTMLDivElement>(null);
    React.useEffect(() => {
        if (selfRef.current) {
            const observer = new ResizeObserver(([entry]) => {
                setW(entry.contentRect.width);
            });
            observer.observe(selfRef.current);
            return () => {
                observer.disconnect();
            };
        }
    }, [selfRef.current]);
    return (
        <Container ref={selfRef} {...style}>
            {children && children(w)}
        </Container>
    );
};
