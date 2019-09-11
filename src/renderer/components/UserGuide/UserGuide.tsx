import { Story } from './type';
import React, {useEffect} from 'react';
import styled from 'styled-components';
import { Pointer } from './Pointer';
import { Dialog } from './Dialog';

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

    // TODO: register all the required events

    useEffect(()=>{

    }, []);

    const onConfirm = () => {
        next();
    };

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
