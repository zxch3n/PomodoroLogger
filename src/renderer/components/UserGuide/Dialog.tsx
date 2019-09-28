import React, { useEffect } from 'react';
import styled from 'styled-components';
import { getElementAbsoluteOffsetBySelector } from './utils';
import { Position } from './type';
import { Button, Card } from 'antd';

const Container = styled.div`
    z-index: 101;
    user-select: none;
    position: fixed;
    font-family: sans-serif, 'Lucida Sans', 'Microsoft YaHei';
    color: white;
`;

export interface DialogProps {
    text?: string;
    position?: Position;
    targetSelector?: string;
    hasConfirm?: boolean;
    onConfirm?: () => void;
}

export const Dialog: React.FC<DialogProps> = (props: DialogProps) => {
    const {
        text,
        position = { bottom: 24, right: 36 },
        targetSelector,
        hasConfirm = true,
        onConfirm
    } = props;
    useEffect(() => {
        if (targetSelector == null) {
            return;
        }

        const [x, y, w, h] = getElementAbsoluteOffsetBySelector(targetSelector);
    }, [targetSelector]);
    return (
        <Container
            style={{
                ...position
            }}
        >
            <Card style={{ borderRadius: 4 }}>
                <p style={{ fontSize: 18 }}>{text}</p>
            </Card>
            {hasConfirm ? <Button onClick={onConfirm}>Confirm</Button> : undefined}
        </Container>
    );
};
