import { Story } from './type';
import { actions } from './actions';
import React, { useEffect } from 'react';
import styled from 'styled-components';
import { Pointer } from './Pointer';
import { Dialog } from './Dialog';
import { connect } from 'react-redux';
import { RootState } from '../../reducers';
import { Dispatch } from 'redux';
import { Button } from 'antd';

const Mask = styled.div`
    top: 0;
    left: 0;
    position: fixed;
    background-color: rgba(0, 0, 0, 0.6);
    width: 100vw;
    height: 100vh;
    z-index: 100;
`;

export interface UserGuideProps {
    story?: Story;
    next: () => void;
    prev: () => void;
    exit: () => void;
}

const _UserGuide: React.FC<UserGuideProps> = (props: UserGuideProps) => {
    if (!props.story) {
        return <></>;
    }

    const {
        hint,
        minHeight,
        minWidth,
        name,
        dialogPosition,
        reactNode,
        targetJumping,
        useMask,
        confirmElementId,
        hasConfirm,
        blurId,
        pointerDirection,
        pointerTargetSelector
    } = props.story;
    const { next } = props;

    const onConfirm = () => {
        // need other UI elements to be ready
        setTimeout(next, 200);
    };

    const setZ = () => {
        if (!pointerTargetSelector) {
            return;
        }

        const elem = document.querySelector(pointerTargetSelector) as HTMLElement;
        if (!elem) {
            return;
        }

        const originalZ = elem.style.zIndex;
        const position = elem.style.position;
        elem.style.zIndex = '2008';
        elem.style.position = 'relative';
        elem.addEventListener('click', onConfirm);
        return () => {
            elem.style.position = position;
            elem.style.zIndex = originalZ;
            elem.removeEventListener('click', onConfirm);
        };
    };

    const setConfirmListener = () => {
        if (!confirmElementId) {
            return;
        }

        const elem = document.getElementById(confirmElementId);
        if (!elem) {
            return;
        }

        const listener = (event: any) => {
            next();
        };
        elem.addEventListener('click', listener);

        return () => {
            elem.removeEventListener('click', listener);
        };
    };

    useEffect(setConfirmListener, [confirmElementId]);
    useEffect(setZ, [pointerTargetSelector]);
    return (
        <>
            {pointerTargetSelector ? (
                <Pointer
                    targetSelector={pointerTargetSelector}
                    direction={pointerDirection}
                    animate={targetJumping}
                />
            ) : (
                undefined
            )}
            <Dialog
                text={hint}
                hasConfirm={hasConfirm}
                position={dialogPosition}
                onConfirm={onConfirm}
            />

            {useMask ? (
                <>
                    <Mask />
                    <Button
                        onClick={props.exit}
                        shape={'circle'}
                        icon={'close'}
                        color={'red'}
                        size={'small'}
                        type={'danger'}
                        style={{
                            position: 'fixed',
                            zIndex: 2000,
                            top: 16,
                            right: 16
                        }}
                    />
                </>
            ) : (
                undefined
            )}
        </>
    );
};

export const UserGuide = connect(
    ({ story: { name, index, stories } }: RootState) => ({
        story: name == null ? undefined : stories[name][index]
    }),
    (dispatch: Dispatch) => {
        return {
            next: () => dispatch(actions.nextStory()),
            prev: () => dispatch(actions.preStory()),
            exit: () => dispatch(actions.quit())
        };
    }
)(_UserGuide);
