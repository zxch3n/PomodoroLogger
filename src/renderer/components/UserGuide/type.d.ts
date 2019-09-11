import { RootState } from '../../reducers';

export interface Position {
    left?: number|string;
    right?: number|string;
    top?: number|string;
    bottom?: number|string;
}

export interface Story {
    name: string;
    setUpRootState?: Partial<RootState>;
    pointerTargetDomId?: string;
    pointerDirection?: number;
    targetJumping?: boolean; // let the target jump

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
