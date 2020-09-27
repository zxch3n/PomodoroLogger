import { Button } from 'antd';
import React from 'react';
import styled from 'styled-components';

const StyledLogger = styled.div`
    height: 100px;
`;

interface Props {
    play: () => void;
    pause: () => void;
    continue: () => void;
    getTime: () => string;
    isFocusing: boolean;
}

export class MiniLogger extends React.Component<Props> {
    render() {
        return (
            <StyledLogger>
                <Button icon="caret-right" />
                <Button icon="check" />
                <Button icon="close" />
            </StyledLogger>
        );
    }
}
