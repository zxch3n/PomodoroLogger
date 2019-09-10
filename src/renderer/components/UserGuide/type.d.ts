import { RootState } from '../../reducers';
import { Component } from 'react';

export interface Story {
    setUpRootState?: Partial<RootState>;
    pointerTargetDomId?: string;
    pointerDirection?: number;
    targetJumping?: boolean; // let the target jump

    useMask: boolean;
    hint?: string;
    dialogPosition?: string;

    hasConfirm?: boolean; // use confirm button
    confirmElementId?: string; // confirm on element clicked

    minHeight?: number;
    minWidth?: number;

    reactComponent?: Component;
}
