import { Story } from './type';
import React, {useEffect} from 'react';
import styled from 'styled-components';
import { Pointer } from './Pointer';
import { Dialog } from './Dialog';
import registerMap = echarts.registerMap;

const Container = styled.div``;
export interface UserGuideProps {
    story: Story;
    next: () => void;
    prev: () => void;
}


export const UserGuide: React.FC<UserGuideProps> = (props: UserGuideProps) => {
    const {
        hint, minHeight, minWidth, name, dialogPosition,
        reactNode, targetJumping, useMask,
        confirmElementId, hasConfirm, blurId, pointerDirection,
        pointerTargetDomId, setUpRootState
    } = props.story;

    const {next} = props;
    useEffect(()=>{
        
    }, [setUpRootState]);

    // TODO: register all the required events
    useEffect(()=>{
        if (confirmElementId == null) {
            return;
        }

        const node = document.getElementById(confirmElementId);
        if (node == null) {
            return;
        }

        node.addEventListener('click', onConfirm);

        return () => {
            node.removeEventListener('click', onConfirm);
        };
    }, [confirmElementId]);

    useEffect(()=>{

    }, []);

    const onConfirm = () => {
        next();
    };

    if (reactNode) {
        const Node = reactNode;
        return <Node/>
    }

    return (
        <>
            {
                pointerTargetDomId? (
                    <Pointer
                        targetDomId={pointerTargetDomId}
                        direction={pointerDirection}
                        animate={targetJumping}
                    />
                ) : undefined
            }
            <Dialog
                text={hint}
                hasConfirm={hasConfirm}
                position={dialogPosition}
                onConfirm={onConfirm}
            />
        </>
    )
};
