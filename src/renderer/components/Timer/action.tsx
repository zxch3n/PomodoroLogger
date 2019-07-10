import { createActionCreator, createReducer } from 'deox';

export interface TimerState {
    targetTime?: number;
    focusDuration: number;
    restDuration: number;
    isFocusing: boolean;
    isRunning: boolean;
    project?: string;
}

export const defaultState: TimerState = {
    targetTime: undefined,
    focusDuration: 25 * 60,
    restDuration: 5 * 60,
    isRunning: true,
    isFocusing: true
};

export const startTimer = createActionCreator('[Timer]START_TIMER');
export const stopTimer = createActionCreator('[Timer]STOP_TIMER');
export const continueTimer = createActionCreator('[Timer]CONTINUE_TIMER');
export const clearTimer = createActionCreator('[Timer]CLEAR_TIMER');
export const timerFinished = createActionCreator('[Timer]TIMER_FINISHED');
export const setFocusDuration = createActionCreator(
    '[Timer]SET_FOCUS_DURATION',
    resolve => (duration: number) => resolve(duration)
);
export const setRestDuration = createActionCreator(
    '[Timer]SET_REST_DURATION',
    resolve => (duration: number) => resolve(duration)
);
export const setProject = createActionCreator('[Timer]SET_PROJECT', resolve => (project: string) =>
    resolve(project)
);

export const actions = {
    startTimer,
    stopTimer,
    continueTimer,
    clearTimer,
    timerFinished,
    setFocusDuration,
    setRestDuration,
    setProject
};

export const reducer = createReducer<TimerState, any>(defaultState, handle => [
    handle(startTimer, (state: TimerState) => {
        const duration: number = state.isFocusing ? state.focusDuration : state.restDuration;
        const now = new Date().getTime();
        return { ...state, isRunning: true, targetTime: now + duration * 1000 };
    }),

    handle(stopTimer, state => ({ ...state, isRunning: false })),
    handle(continueTimer, state => ({ ...state, isRunning: true })),
    handle(clearTimer, state => ({ ...state, isRunning: false, targetTime: undefined })),
    handle(timerFinished, (state: TimerState) => {
        if (!state.isRunning) {
            throw new Error('is not running');
        }

        const now = new Date().getTime();
        const duration = state.isFocusing ? state.restDuration : state.focusDuration;
        return {
            ...state,
            isRunning: true,
            targetTime: now + duration * 1000,
            isFocusing: !state.isFocusing
        };
    }),

    handle(setFocusDuration, (state, { payload }) =>
        // Project: persistence
        ({ ...state, focusDuration: payload })
    ),

    handle(setRestDuration, (state, { payload }) =>
        // Project: persistence
        ({ ...state, restDuration: payload })
    )
]);
