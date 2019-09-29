import { RootState } from '../../reducers';

export interface Position {
    left?: number | string;
    right?: number | string;
    top?: number | string;
    bottom?: number | string;
}

export interface Story {
    name: string;
    pointerTargetSelector?: string;
    pointerDirection?: number;
    targetJumping?: boolean; // whether jumping up and down

    blurId?: string;

    useMask: boolean;
    hint?: string;
    dialogPosition?: Position;

    hasConfirm?: boolean; // use confirm button
    confirmElementId?: string; // confirm on element clicked

    minHeight?: number;
    minWidth?: number;

    reactNode?: any;
}

export interface UserGuideState {
    currentStoryIndex: number;
}
