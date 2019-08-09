import { join } from 'path';
const dirPath = './__test__perf_db/';
import * as config from '../../src/config';
config.dbPaths.projectDBPath = join(dirPath, 'projects.nedb');
config.dbPaths.sessionDBPath = join(dirPath, 'session.nedb');

import { getPomodoroCalendarData } from '../../src/renderer/components/History/op';
import { generateAndSave } from './fakeDataGenerator';
import { existsSync } from 'fs';
import { getAllSession } from '../../src/renderer/monitor/sessionManager';

jest.setTimeout(30 * 1000);
beforeAll(async () => {
    if (!existsSync(dirPath)) {
        await generateAndSave(dirPath);
    }
});

describe('Records Agg in History', () => {
    it('Calendar Agg is fast enough', async () => {
        const startTime = new Date().getTime();
        const sessions = await getAllSession();
        console.log(sessions.length);
        getPomodoroCalendarData(sessions);
        expect(new Date().getTime() - startTime).toBeLessThan(5000);
    });
});
