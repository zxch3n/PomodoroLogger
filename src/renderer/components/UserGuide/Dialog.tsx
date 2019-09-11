import React, {useEffect} from 'react';
import styled from 'styled-components';
import { getElementAbsoluteOffsetById } from './utils';
import { Position } from './type';
import { Button } from 'antd';

const Mask = styled.div`
  background-color: rgba(0, 0, 0, 0.2);
  position: fixed;
  height: 100vh;
  width: 100vw;
`;


const Container = styled.div`
  position: fixed;
`;


export interface DialogProps {
    text?: string;
    position?: Position;
    targetId?: string;
    hasConfirm?: boolean;
    onConfirm?: ()=>void;
}


export const Dialog: React.FC<DialogProps> = (props: DialogProps) => {
    const {text, position={bottom: 12, right: 12}, targetId, hasConfirm=true, onConfirm} = props;
    useEffect(()=>{
        if (targetId == null) {
            return;
        }

        const [x, y, w, h] = getElementAbsoluteOffsetById(targetId);
    } , [targetId]);
    return (
        <>
            <Container
                style={{
                    ...position
                }}
            >
                <p>
                    {text}
                </p>
                {
                    hasConfirm? (
                        <Button onClick={onConfirm}>Confirm</Button>
                    ) : undefined
                }
            </Container>

            <Mask/>
        </>
    );
};
