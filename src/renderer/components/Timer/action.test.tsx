import {
    actions,
    reducer,
    setFocusDuration,
    setRestDuration,
    startTimer,
    stopTimer
} from './action';
import { generateRandomName } from '../../utils';
import { getAllSession } from '../../monitor/sessionManager';
import { dbPaths } from '../../../config';
import { existsSync, unlinkSync } from 'fs';
import { PomodoroRecord } from '../../monitor/type';

const { projectDBPath } = dbPaths;

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
});

describe('On timerFinished', () => {
    beforeAll(() => {
        if (existsSync(projectDBPath)) {
            unlinkSync(projectDBPath);
        }
    });

    it('will add data to DB', async () => {
        const record: PomodoroRecord = {
            startTime: new Date().getTime(),
            todoId: generateRandomName(),
            projectId: generateRandomName(),
            spentTimeInHour: 10,
            apps: {
                Chrome: {
                    spentTimeInHour: 10,
                    appName: 'Chrome',
                    screenStaticDuration: 5,
                    titleSpentTime: {},
                    switchTimes: 3
                }
            },
            screenStaticDuration: 5,
            switchTimes: 3
        };

        const thunk = actions.timerFinished(record);
        await thunk(x => x);
        const sessions = await getAllSession();
        const found = sessions.find(
            v => v.startTime === record.startTime && v.todoId === record.todoId
        );
        expect(found).not.toBeUndefined();
    });
});
