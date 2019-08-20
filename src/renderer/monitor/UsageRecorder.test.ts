import { UsageRecorder } from './UsageRecorder';

const realDate = Date;
function mockDate(targetDate: string | number) {
    const DATE_TO_USE = new realDate(targetDate);
    // @ts-ignore
    global.Date = jest.fn(() => DATE_TO_USE);
    global.Date.UTC = realDate.UTC;
    global.Date.parse = realDate.parse;
    global.Date.now = realDate.now;
}

afterEach(() => {
    global.Date = realDate;
});

function createResult(appName: string, title: string = appName) {
    return {
        title,
        bounds: { height: 100, width: 100, x: 0, y: 0 },
        id: 123,
        memoryUsage: 100,
        owner: {
            name: appName,
            path: `/path/to/${appName}.exe`,
            processId: 123
        }
    };
}

describe('monitor/UsageRecorder', () => {
    it('app spent hours are recorded correctly', async () => {
        const recorder = new UsageRecorder(() => {});
        mockDate(0);
        recorder.start();
        await recorder.listener(createResult('a'));
        mockDate(30000);
        await recorder.listener(createResult('b'));
        mockDate(60000);
        await recorder.listener(createResult('a'));
        mockDate(90000);
        await recorder.stop();
        const sessionData = recorder.sessionData;
        expect(sessionData.apps).toHaveProperty('a');
        expect(sessionData.apps).toHaveProperty('b');
        expect(sessionData.apps.b.spentTimeInHour).toBeCloseTo(30000 / 1000 / 3600, 5);
        expect(sessionData.apps.a.spentTimeInHour).toBeCloseTo((30000 * 2) / 1000 / 3600, 5);
        expect(sessionData.apps.a.switchTimes).toBe(2);
    });

    it('app spent hours are recorded correctly (complicated case)', async () => {
        const recorder = new UsageRecorder(() => {});
        let aSum = 0;
        let i = 0;
        for (; i < 3000000; i += 3001) {
            mockDate(i);
            if (Math.random() > 0.5) {
                await recorder.listener(createResult('b'));
            } else {
                await recorder.listener(createResult('a'));
                aSum += 3001;
            }
        }

        mockDate(i);
        await recorder.stop();
        const sessionData = recorder.sessionData;
        expect(sessionData.apps.a.spentTimeInHour).toBeCloseTo(aSum / 1000 / 3600, 5);
    });
});
