import * as utils from './utils';

describe('renderer.utils', () => {
    it('should format time in hour', () => {
        expect(utils.formatTime(6)).toBe('06h 00m');
        expect(utils.formatTime(6.5)).toBe('06h 30m');
        expect(utils.formatTime(16.3333333)).toBe('16h 20m');
        expect(utils.formatTime(0.3333333)).toBe('00h 20m');
        expect(utils.formatTime(0)).toBe('00h 00m');
    });

    it('should format time without leading zero', () => {
        expect(utils.formatTimeWithoutZero(6)).toBe('6h 0m');
        expect(utils.formatTimeWithoutZero(6.5)).toBe('6h 30m');
        expect(utils.formatTimeWithoutZero(0.5)).toBe('0h 30m');
        expect(utils.formatTimeWithoutZero(0)).toBe('0h 0m');
    });

    it('should parse time from string', () => {
        expect(utils.parseTime('10h 30m')).toBe(10.5);
        for (let i = 0; i < 1000; i += 1) {
            const time = Math.floor(Math.random() * 100) + Math.floor(Math.random() * 60) / 60;
            expect(utils.parseTime(utils.formatTimeWithoutZero(time))).toBeCloseTo(time);
            expect(utils.parseTime(utils.formatTime(time))).toBeCloseTo(time);
        }
    });

    it('parse number to 2 digit', () => {
        expect(utils.to2digits(10)).toEqual('10');
        expect(utils.to2digits(2)).toEqual('02');
        expect(utils.to2digits(8)).toEqual('08');
        expect(utils.to2digits(0)).toEqual('00');
        expect(utils.to2digits(4.8)).toEqual('04');
    });

    it('should get rid of application suffix', () => {
        expect(utils.getBetterAppName('Chrome.exe')).toBe('Chrome');
        expect(utils.getBetterAppName('Chrome')).toBe('Chrome');
        expect(utils.getBetterAppName('chrome')).toBe('Chrome');
        expect(utils.getBetterAppName('vs-code.exe')).toBe('Vs-code');
    });

    it('should generate random name', () => {
        const nameSet = new Set();
        for (let i = 0; i < 1e5; i += 1) {
            const name = utils.generateRandomName();
            expect(nameSet.has(name)).toBeFalsy();
            nameSet.add(name);
        }
    });

    it('should map actions dict to dispatch', async () => {
        const actions: any = {};
        for (let i = 0; i < 1000; i += 1) {
            const name = utils.generateRandomName();
            actions[name] = (...args: any) => [name, args];
        }

        const dispatchMap = utils.genMapDispatchToProp(actions);
        for (const key in actions) {
            const args = [Math.random()];
            await new Promise(resolve => {
                // @ts-ignore
                const dispatchDict = dispatchMap(([_name, _args]) => {
                    expect(_name).toEqual(key);
                    expect(_args).toStrictEqual(args);
                    resolve();
                }) as any;

                expect(dispatchDict.hasOwnProperty(key)).toBeTruthy();
                dispatchDict[key](...args);
            });
        }
    });
});
