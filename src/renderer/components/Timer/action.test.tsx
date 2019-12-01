import {
    actions,
    defaultState,
    reducer,
    setFocusDuration,
    setLongBreakDuration,
    setRestDuration,
    setScreenShotInterval,
    setStartOnBoot,
    startTimer,
    stopTimer,
    timerFinished,
    TimerState
} from './action';
import { generateRandomName } from '../../utils';
import { getAllSession } from '../../monitor/sessionManager';
import { dbPaths } from '../../../config';
import { existsSync, unlinkSync } from 'fs';
import { PomodoroRecord } from '../../monitor/type';
import { Dispatch } from 'redux';
import { boardReducer } from '../Kanban/Board/action';
import set = Reflect.set;

const { projectDB } = dbPaths;

describe('Reducer', () => {
    it('has default state', () => {
        const state = reducer(undefined, stopTimer());
        expect(state).toHaveProperty('targetTime');
        expect(state).toHaveProperty('focusDuration');
        expect(state).toHaveProperty('restDuration');
        expect(state).toHaveProperty('isRunning');
        expect(state).toHaveProperty('isFocusing');
    });

    it('works when applying start_timer, stop_timer', () => {
        let state = reducer(undefined, startTimer());
        expect(state.isRunning).toBeTruthy();
        state = reducer(state, stopTimer());
        expect(state.isRunning).toBeFalsy();
        state = reducer(state, startTimer());
        expect(state.isRunning).toBeTruthy();
    });

    it('works with user config setting', () => {
        let state = reducer(undefined, setFocusDuration(100));
        expect(state.focusDuration).toBe(100);
        state = reducer(state, setRestDuration(123));
        expect(state.restDuration).toBe(123);
    });

    it('records break count', async () => {
        let state: TimerState = reducer(undefined, setLongBreakDuration(100));
        expect(state.longBreakDuration).toBe(100);
        state = reducer(state, timerFinished());
        expect(state.iBreak).toBe(1);
        state = reducer(state, timerFinished());
        expect(state.iBreak).toBe(1);
        state = reducer(state, timerFinished());
        expect(state.iBreak).toBe(2);
        state = reducer(state, timerFinished());
        state = reducer(state, timerFinished());
        expect(state.iBreak).toBe(3);
    });

    it('should update', async () => {
        let state: TimerState = Object.assign(defaultState, {});
        // @ts-ignore
        const dispatch: Dispatch = (action: any) => {
            try {
                state = reducer(state, action);
            } catch (e) {}
        };

        await actions.switchToKanban('n_id')(dispatch);
        expect(state.currentTab).toBe('kanban');
        await dispatch(actions.setBoardId('nn_i'));
        expect(state.boardId).toBe('nn_i');
        await actions.setScreenShotInterval(10)(dispatch);
        expect(state.screenShotInterval).toBe(10);
        await actions.setMonitorInterval(999)(dispatch);
        expect(state.monitorInterval).toBe(999);
        await actions.setStartOnBoot(false)(dispatch);
        expect(state.startOnBoot).toBeFalsy();
        await actions.setStartOnBoot(true)(dispatch);
        expect(state.startOnBoot).toBeTruthy();
        await actions.setFocusDuration(9018)(dispatch);
        expect(state.focusDuration).toBe(9018);
        await actions.setRestDuration(9991)(dispatch);
        expect(state.restDuration).toBe(9991);
        await actions.setLongBreakDuration(99991)(dispatch);
        expect(state.longBreakDuration).toBe(99991);
        await actions.setScreenShotInterval(91111)(dispatch);
        expect(state.screenShotInterval).toBe(91111);
        await dispatch(actions.startTimer());
        expect(state.targetTime).not.toBeUndefined();
        expect(state.isRunning).toBeTruthy();
        const leftTime = state.targetTime! - new Date().getTime();
        await dispatch(actions.stopTimer());
        expect(state.isRunning).toBeFalsy();
        await new Promise(r => setTimeout(r, 1000));
        const targetTime = new Date().getTime() + leftTime;
        await dispatch(actions.continueTimer());
        expect(state.isRunning).toBeTruthy();
        expect(state.targetTime! / 1000).toBeCloseTo(targetTime / 1000, 1);
        await dispatch(actions.clearTimer());
        expect(state.targetTime).toBeUndefined();
        expect(state.isRunning).toBeFalsy();

        const oldState = Object.assign(state, {});
        state = defaultState;
        await actions.fetchSettings()(dispatch);
        const settings = [
            'focusDuration',
            'restDuration',
            'monitorInterval',
            'screenShotInterval',
            'startOnBoot',
            'longBreakDuration'
        ];
        for (const setting of settings) {
            // @ts-ignore
            expect(state[setting]).toEqual(oldState[setting]);
        }
    });
});

describe('On timerFinished', () => {
    beforeAll(() => {
        if (existsSync(projectDB)) {
            unlinkSync(projectDB);
        }
    });

    it('will add data to DB', async () => {
        const record: PomodoroRecord = {
            _id: '_id',
            startTime: new Date().getTime(),
            boardId: generateRandomName(),
            spentTimeInHour: 10,
            switchActivities: [],
            apps: {
                Chrome: {
                    index: 0,
                    spentTimeInHour: 10,
                    appName: 'Chrome',
                    screenStaticDuration: 5,
                    titleSpentTime: {}
                }
            },
            screenStaticDuration: 5,
            switchTimes: 3
        };

        const thunk = actions.timerFinished(record);
        await thunk(x => {
            return x;
        });
        const sessions = await getAllSession();
        const found = sessions.find(v => v.startTime === record.startTime);
        expect(found).not.toBeUndefined();
    });
});
