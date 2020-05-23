import { createActionCreator, createReducer } from 'deox';
import { Dispatch } from 'redux';
import { addSession } from '../../monitor/sessionManager';
import { actions as boardActions } from '../Kanban/Board/action';
import { actions as kanbanActions } from '../Kanban/action';
import { actions as historyActions } from '../History/action';
import { throttle } from 'lodash';
import { promisify } from 'util';
import dbs from '../../dbs';
import { PomodoroRecord } from '../../monitor/type';
import { workers } from '../../workers';
import { DEBUG_TIME_SCALE, __DEV__ } from '../../../config';
import { AsyncDB } from '../../../utils/dbHelper';
import { getNameFromBoardId } from '../../utils';

export const LONG_BREAK_INTERVAL = 4;
const settingDB = new AsyncDB(dbs.settingDB);
export const TABS: tabType[] = ['timer', 'kanban', 'history', 'setting'];
if (process.env.NODE_ENV !== 'production') {
    TABS.push('analyser');
}
export type tabType = 'timer' | 'kanban' | 'history' | 'setting' | 'analyser';
export type DistractingRow = { app?: string; title?: string };
export interface Setting {
    autoUpdate: boolean;
    focusDuration: number;
    restDuration: number;
    longBreakDuration: number;
    monitorInterval: number;
    screenShotInterval?: number;
    startOnBoot: boolean;
    useHardwareAcceleration: boolean;
    distractingList: DistractingRow[];
}

export interface TimerManager {
    start: () => void;
    pause: () => void;
    clear: () => void;
}

export interface TimerState extends Setting {
    timerManager?: TimerManager;
    chosenRecord?: PomodoroRecord;
    targetTime?: number;
    leftTime?: number;
    isFocusing: boolean;
    isRunning: boolean;
    boardId?: string;
    iBreak: number; // i-th break session, if i can be divided by 4, start longer break

    currentTab: tabType;
}

export const defaultState: TimerState = {
    distractingList: [
        {
            app: 'Chrome|Edge|Iexplore|Safari|Firefox|Brave',
            title: 'Facebook|微博|Twitter|哔哩哔哩|YouTube|Twitch|微信',
        },
        {
            app: 'WeChatStore',
        },
        {
            title: '邮件|Mail',
        },
    ],
    autoUpdate: true,
    targetTime: undefined,
    focusDuration: 25 * 60,
    restDuration: 5 * 60,
    iBreak: 0,
    longBreakDuration: 15 * 60,
    isRunning: false,
    isFocusing: true,
    startOnBoot: false,
    useHardwareAcceleration: false,

    monitorInterval: 1000,
    screenShotInterval: undefined,
    currentTab: 'timer',
};

export const uiStateNames = [
    'focusDuration',
    'restDuration',
    'longBreakDuration',
    'monitorInterval',
    'screenShotInterval',
    'chosenRecord',
    'targetTime',
    'leftTime',
    'isFocusing',
    'isRunning',
    'boardId',
    'iBreak',
];

if (__DEV__) {
    defaultState.currentTab = 'analyser';
}

export const startTimer = createActionCreator('[Timer]START_TIMER');
export const stopTimer = createActionCreator('[Timer]STOP_TIMER');
export const continueTimer = createActionCreator('[Timer]CONTINUE_TIMER');
export const clearTimer = createActionCreator('[Timer]CLEAR_TIMER');
export const timerFinished = createActionCreator('[Timer]TIMER_FINISHED');
export const setAutoUpdate = createActionCreator(
    '[Timer]SET_AUTO_UPDATE',
    (resolve) => (value: boolean) => resolve(value)
);
export const setTimerManager = createActionCreator(
    '[Timer]StartOrResumeTimer',
    (resolve) => (manager?: TimerManager) => resolve({ manager })
);
export const setChosenRecord = createActionCreator(
    '[Timer]SET_CHOSEN_RECORD',
    (resolve) => (record?: PomodoroRecord) => resolve({ record })
);
export const setDistractingList = createActionCreator(
    '[Setting]SET_DISTRACTING_LIST',
    (resolve) => (rows: DistractingRow[]) => resolve(rows)
);
export const extendCurrentSession = createActionCreator(
    '[Timer]EXTEND_CURRENT_SESSION',
    (resolve) => (time: number) => resolve(time)
);
export const setLongBreakDuration = createActionCreator(
    '[Timer]SET_LONG_BREAK',
    (resolve) => (longBreakDuration: number) => resolve({ longBreakDuration })
);
export const setStartOnBoot = createActionCreator(
    '[Timer]SWITCH_START_ON_BOOT',
    (resolve) => (check: boolean) => resolve(check)
);
export const setUseHardwareAcceleration = createActionCreator(
    '[Timer]SWITCH_SET_USE_HARDWARE_ACCELERATION',
    (resolve) => (check: boolean) => resolve(check)
);
export const setFocusDuration = createActionCreator(
    '[Timer]SET_FOCUS_DURATION',
    (resolve) => (duration: number) => resolve(duration)
);
export const setRestDuration = createActionCreator(
    '[Timer]SET_REST_DURATION',
    (resolve) => (duration: number) => resolve(duration)
);
export const setBoardId = createActionCreator(
    '[Timer]SET_BOARD_ID',
    (resolve) => (boardId?: string) => resolve({ boardId })
);
export const setMonitorInterval = createActionCreator(
    '[Timer]SET_MONITOR_INTERVAL',
    (resolve) => (interval: number) => resolve(interval)
);
export const setScreenShotInterval = createActionCreator(
    '[Timer]SET_SCREEN_SHOT_INTERVAL',
    (resolve) => (interval?: number) => resolve(interval)
);
export const switchFocusRestMode = createActionCreator('[Timer]SWITCH_FOCUS_MODE');
export const changeAppTab = createActionCreator(
    '[App]CHANGE_APP_TAB',
    (resolve) => (tab: tabType) => resolve(tab)
);
export const switchTab = createActionCreator('[App]SWITCH_TAB', (resolve) => (direction: 1 | -1) =>
    resolve(direction)
);

const throwError = (err: Error) => {
    if (err) {
        throw err;
    }
};
export const actions = {
    stopTimer,
    continueTimer,
    clearTimer,
    startTimer,
    setBoardId,
    changeAppTab,
    extendCurrentSession,
    setChosenRecord,
    setTimerManager,
    switchFocusRestMode,
    switchTab: throttle((direction: 1 | -1) => switchTab(direction), 100),
    fetchSettings: () => async (dispatch: Dispatch) => {
        const settings: Partial<Setting> = await promisify(
            dbs.settingDB.findOne.bind(dbs.settingDB)
        )({ name: 'setting' });
        if (settings == null) {
            return;
        }

        const settingKeywords = [
            ['focusDuration', setFocusDuration],
            ['restDuration', setRestDuration],
            ['monitorInterval', setMonitorInterval],
            ['screenShotInterval', setScreenShotInterval],
            ['startOnBoot', setStartOnBoot],
            ['useHardwareAcceleration', setUseHardwareAcceleration],
            ['longBreakDuration', setLongBreakDuration],
            ['distractingList', setDistractingList],
            ['autoUpdate', setAutoUpdate],
        ];
        for (const key of settingKeywords) {
            if (key[0] in settings) {
                // @ts-ignore
                const action = key[1](settings[key[0]]);
                dispatch(action);
            }
        }
    },
    setAutoUpdate: (value: boolean) => async (dispatch: Dispatch) => {
        dispatch(setAutoUpdate(value));
        dbs.settingDB.update(
            { name: 'setting' },
            { $set: { autoUpdate: value } },
            { upsert: true },
            throwError
        );
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
    setDistractingList: (distractingList: DistractingRow[]) => async (dispatch: Dispatch) => {
        dispatch(setDistractingList(distractingList));
        await settingDB.update(
            { name: 'setting' },
            { $set: { distractingList } },
            { upsert: true }
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
    setLongBreakDuration: (longBreakDuration: number) => async (dispatch: Dispatch) => {
        dispatch(setLongBreakDuration(longBreakDuration));
        dbs.settingDB.update(
            { name: 'setting' },
            { $set: { longBreakDuration } },
            { upsert: true },
            throwError
        );
    },
    setStartOnBoot: (check: boolean) => async (dispatch: Dispatch) => {
        dispatch(setStartOnBoot(check));
        dbs.settingDB.update(
            { name: 'setting' },
            { $set: { startOnBoot: check } },
            { upsert: true },
            throwError
        );
    },
    setUseHardwareAcceleration: (check: boolean) => async (dispatch: Dispatch) => {
        dispatch(setUseHardwareAcceleration(check));
        dbs.settingDB.update(
            { name: 'setting' },
            { $set: { useHardwareAcceleration: check } },
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
    timerFinished: (
        sessionData?: PomodoroRecord,
        cardIds: string[] = [],
        boardId?: string | undefined
    ) => async (dispatch: Dispatch) => {
        dispatch(timerFinished());
        dispatch(historyActions.setExpiringKey(new Date().toString()));
        if (sessionData) {
            await addSession(sessionData).catch((err) => console.error(err));
            if (boardId !== undefined) {
                await boardActions.onTimerFinished(
                    boardId,
                    sessionData._id,
                    sessionData.spentTimeInHour,
                    cardIds
                )(dispatch);
            }
        }
    },
    /* istanbul ignore next */
    inferProject: (sessionData: PomodoroRecord) => async (dispatch: Dispatch) => {
        // Predict session's project
        const newProjectId = (await workers.knn.predict(sessionData).catch((err) => {
            console.error('predicting error', err);
            return undefined;
        })) as string | undefined;

        if (newProjectId !== undefined) {
            const newProject = await getNameFromBoardId(newProjectId);
            dispatch(setBoardId(newProject));
        }
    },
    switchToKanban: (kanbanId: string) => (dispatch: Dispatch) => {
        dispatch(actions.changeAppTab('kanban'));
        kanbanActions.setChosenBoardId(kanbanId)(dispatch);
    },
};

export type TimerActionTypes = { [key in keyof typeof actions]: typeof actions[key] };
export const reducer = createReducer<TimerState, any>(defaultState, (handle) => [
    handle(startTimer, (state: TimerState) => {
        const duration: number = state.isFocusing
            ? state.focusDuration
            : state.iBreak % LONG_BREAK_INTERVAL === 0
            ? state.longBreakDuration
            : state.restDuration;
        const now = new Date().getTime();
        if (process.env.NODE_ENV !== 'production') {
            return {
                ...state,
                isRunning: true,
                targetTime: now + (duration * 1000) / DEBUG_TIME_SCALE,
            };
        }

        return { ...state, isRunning: true, targetTime: now + duration * 1000 };
    }),

    handle(stopTimer, (state) => ({
        ...state,
        isRunning: false,
        leftTime: state.targetTime ? state.targetTime - new Date().getTime() : undefined,
    })),

    handle(continueTimer, (state) => ({
        ...state,
        isRunning: true,
        targetTime: state.leftTime ? new Date().getTime() + state.leftTime : state.targetTime,
    })),
    handle(clearTimer, (state) => ({
        ...state,
        leftTime: undefined,
        isRunning: false,
        targetTime: undefined,
    })),
    handle(timerFinished, (state: TimerState) => {
        return {
            ...state,
            isRunning: false,
            targetTime: undefined,
            isFocusing: !state.isFocusing,
            iBreak: state.iBreak + (state.isFocusing ? 1 : 0),
            leftTime: undefined,
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
    handle(setAutoUpdate, (state, { payload }) => ({
        ...state,
        autoUpdate: payload,
    })),
    handle(setMonitorInterval, (state, { payload }) => ({ ...state, monitorInterval: payload })),

    handle(setScreenShotInterval, (state, { payload }) => ({
        ...state,
        screenShotInterval:
            payload == null
                ? payload
                : process.env.NODE_ENV !== 'development'
                ? payload
                : payload / DEBUG_TIME_SCALE,
    })),

    handle(switchFocusRestMode, (state) => ({
        ...state,
        isFocusing: !state.isFocusing,
        leftTime: undefined,
        targetTime: undefined,
        isRunning: false,
    })),

    handle(setBoardId, (state, { payload: { boardId } }) => ({ ...state, boardId })),
    handle(changeAppTab, (state, { payload }) => ({ ...state, currentTab: payload })),
    handle(setStartOnBoot, (state, { payload }) => ({
        ...state,
        startOnBoot: payload,
    })),
    handle(setUseHardwareAcceleration, (state, { payload }) => ({
        ...state,
        useHardwareAcceleration: payload,
    })),
    handle(setLongBreakDuration, (state, { payload: { longBreakDuration } }) => ({
        ...state,
        longBreakDuration,
    })),
    handle(extendCurrentSession, (state, { payload }) => ({
        ...state,
        targetTime: new Date().getTime() + payload * 1000,
        isFocusing: true,
        isRunning: true,
    })),
    handle(setDistractingList, (state, { payload }) => ({
        ...state,
        distractingList: payload,
    })),
    handle(switchTab, (state, { payload }) => {
        const index = (TABS.indexOf(state.currentTab) + payload + TABS.length) % TABS.length;
        return {
            ...state,
            currentTab: TABS[index],
        };
    }),
    handle(setChosenRecord, (state, { payload: { record } }) => ({
        ...state,
        chosenRecord: record,
    })),
    handle(setTimerManager, (state, { payload: { manager } }) => ({
        ...state,
        timerManager: manager,
    })),
]);
