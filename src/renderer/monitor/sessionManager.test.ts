import { addSession, removeSession, getAllSession } from './sessionManager';
import { dbPaths } from '../../config';
import { existsSync, unlinkSync } from 'fs';
import { generateRandomName } from '../utils';
import { PomodoroRecord } from './type';
const { sessionDB } = dbPaths;

describe('sessionManager', () => {
    beforeAll(() => {
        if (existsSync(sessionDB)) {
            try {
                unlinkSync(sessionDB);
            } catch (e) {}
        }
    });

    it('addSession', async () => {
        const record: PomodoroRecord = {
            switchActivities: [],
            _id: generateRandomName(),
            boardId: generateRandomName(),
            startTime: new Date().getTime(),
            apps: {},
            switchTimes: 0,
            screenStaticDuration: 0,
            spentTimeInHour: 0
        };

        await addSession(record);
        const sessions = await getAllSession();
        const ans = sessions.find(v => v.boardId === record.boardId);
        expect(ans).toBeTruthy();
    });

    it('removeSession', async () => {
        const record: PomodoroRecord = {
            _id: generateRandomName(),
            boardId: generateRandomName(),
            startTime: new Date().getTime(),
            switchActivities: [],
            apps: {},
            switchTimes: 0,
            screenStaticDuration: 0,
            spentTimeInHour: 0
        };

        await addSession(record);
        await removeSession(record.startTime);
        const sessions = await getAllSession();
        const ans = sessions.find(v => v.boardId === record.boardId);
        expect(ans).toBeUndefined();
    });
});
