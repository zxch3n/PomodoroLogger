import { createActionCreator, createReducer } from 'deox';
import { PomodoroRecord } from '../../monitor';
import { Dispatch } from 'redux';
import { addSession } from '../../monitor/sessionManager';
import { actions as projectActions } from '../Project/action';
import { promisify } from 'util';
import dbs from '../../dbs';

export interface Setting {
    focusDuration: number;
    restDuration: number;
    monitorInterval: number;
    screenShotInterval?: number;
}

export interface TimerState extends Setting {
    targetTime?: number;
    leftTime?: number;
    isFocusing: boolean;
    isRunning: boolean;
    project?: string;
}

export const defaultState: TimerState = {
    targetTime: undefined,
    focusDuration: 25 * 60,
    restDuration: 5 * 60,
    isRunning: false,
    isFocusing: true,

    monitorInterval: 1000,
    screenShotInterval: 5000
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
export const setProject = createActionCreator('[Timer]SET_PROJECT', resolve => (project?: string) =>
    resolve(project)
);
export const setMonitorInterval = createActionCreator(
    '[Timer]SET_MONITOR_INTERVAL',
    resolve => (interval: number) => resolve(interval)
);
export const setScreenShotInterval = createActionCreator(
    '[Timer]SET_SCREEN_SHOT_INTERVAL',
    resolve => (interval?: number) => resolve(interval)
);
export const switchFocusRestMode = createActionCreator('[Timer]SWITCH_FOCUS_MODE');

const throwError = (err: Error) => {
    if (err) {
        throw err;
    }
};
export const actions = {
    stopTimer,
    continueTimer,
    clearTimer,
    setProject,
    startTimer,
    switchFocusRestMode,
    fetchSettings: () => async (dispatch: Dispatch) => {
        const settings: Partial<Setting> = await promisify(
            dbs.settingDB.findOne.bind(dbs.settingDB)
        )({ name: 'setting' });
        const settingKeywords = [
            ['focusDuration', setFocusDuration],
            ['restDuration', setRestDuration],
            ['monitorInterval', setMonitorInterval],
            ['screenShotInterval', setScreenShotInterval]
        ];
        for (const key of settingKeywords) {
            if (key[0] in settings) {
                // @ts-ignore
                const action = key[1](settings[key[0]]);
                dispatch(action);
            }
        }
    },
    setFocusDuration: (focusDuration: number) => async (dispatch: Dispatch) => {
        dispatch(setFocusDuration(focusDuration));
        dbs.settingDB.update(
            { name: 'setting' },
            { $set: { focusDuration } },
            { upsert: true },
            throwError
        );
    },
    setRestDuration: (restDuration: number) => async (dispatch: Dispatch) => {
        dispatch(setRestDuration(restDuration));
        dbs.settingDB.update(
            { name: 'setting' },
            { $set: { restDuration } },
            { upsert: true },
            throwError
        );
    },
    setMonitorInterval: (monitorInterval: number) => async (dispatch: Dispatch) => {
        dispatch(setMonitorInterval(monitorInterval));
        dbs.settingDB.update(
            { name: 'setting' },
            { $set: { monitorInterval } },
            { upsert: true },
            throwError
        );
    },
    setScreenShotInterval: (screenShotInterval?: number) => async (dispatch: Dispatch) => {
        dispatch(setScreenShotInterval(screenShotInterval));
        dbs.settingDB.update(
            { name: 'setting' },
            { $set: { screenShotInterval } },
            { upsert: true },
            throwError
        );
    },
    timerFinished: (sessionData?: PomodoroRecord, project?: string) => async (
        dispatch: Dispatch
    ) => {
        dispatch(timerFinished());
        if (sessionData) {
            await addSession(sessionData).catch(err => console.error(err));
            if (project) {
                projectActions.updateOnTimerFinished(project, sessionData)(dispatch);
            }
        }
    }
};

export type TimerActionTypes = { [key in keyof typeof actions]: typeof actions[key] };
export const reducer = createReducer<TimerState, any>(defaultState, handle => [
    handle(startTimer, (state: TimerState) => {
        const duration: number = state.isFocusing ? state.focusDuration : state.restDuration;
        const now = new Date().getTime();
        if (process.env.NODE_ENV !== 'production') {
            return { ...state, isRunning: true, targetTime: now + (duration * 1000) / 60 };
        }

        return { ...state, isRunning: true, targetTime: now + duration * 1000 };
    }),

    handle(stopTimer, state => ({
        ...state,
        isRunning: false,
        leftTime: state.targetTime ? state.targetTime - new Date().getTime() : undefined
    })),
    handle(continueTimer, state => ({
        ...state,
        isRunning: true,
        targetTime: state.leftTime ? new Date().getTime() + state.leftTime : state.targetTime
    })),
    handle(clearTimer, state => ({ ...state, isRunning: false, targetTime: undefined })),
    handle(timerFinished, (state: TimerState) => {
        if (!state.isRunning) {
            throw new Error('is not running');
        }

        const now = new Date().getTime();
        const duration = state.isFocusing ? state.restDuration : state.focusDuration;
        if (process.env.NODE_ENV !== 'production') {
            return {
                ...state,
                isRunning: true,
                targetTime: now + (duration * 1000) / 60,
                isFocusing: !state.isFocusing
            };
        }

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
    ),

    handle(setMonitorInterval, (state, { payload }) => ({ ...state, monitorInterval: payload })),

    handle(setScreenShotInterval, (state, { payload }) => ({
        ...state,
        screenShotInterval: payload
    })),

    handle(switchFocusRestMode, state => ({
        ...state,
        isFocusing: !state.isFocusing
    })),

    handle(setProject, (state, { payload }) => ({ ...state, project: payload }))
]);
