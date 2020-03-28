import { getWeightsFromPomodoros, Tokenizer } from './tokenizer';
import { PomodoroRecord, TitleSpentTimeDict } from '../renderer/monitor/type';
import { generateRandomName } from '../renderer/utils';

const tokenizer = new Tokenizer();

function expectTokenizer(input: string, output: string[]) {
    expect(tokenizer.tokenize(input)).toStrictEqual(output);
}

describe('Tokenizer', () => {
    it('tokenizes path', () => {
        expectTokenizer('zxch3n/react-trend: Simple, elegant spark lines - Google Chrome', [
            'zxch3n',
            'react-trend',
            'Simple',
            'elegant',
            'spark',
            'lines',
            'Google',
            'Chrome',
        ]);

        expectTokenizer('C:\\CODE\\js\\pomodoro-logger', ['C', 'CODE', 'js', 'pomodoro-logger']);

        expectTokenizer('/home/dat/project/pomodoro-logger', [
            'home',
            'dat',
            'project',
            'pomodoro-logger',
        ]);

        expectTokenizer('/home/.bin/.vscode', ['home', 'bin', 'vscode']);
    });

    it('hard case', () => {
        expectTokenizer('Issues · aaabbb/bbbaaa - Google Chrome', [
            'Issues',
            'aaabbb',
            'bbbaaa',
            'Google',
            'Chrome',
        ]);

        expectTokenizer('time-logger [C:\\a\\b\\c-d] - ...\\.circleci\\config.yml - WebStorm', [
            'time-logger',
            'C',
            'a',
            'b',
            'c-d',
            'circleci',
            'config.yml',
            'WebStorm',
        ]);
    });

    it("doesn't ignore suffix", () => {
        expectTokenizer('Editing vis/README.md at master · abcd/pppp - Google Chrome', [
            'Editing',
            'vis',
            'README.md',
            'at',
            'master',
            'abcd',
            'pppp',
            'Google',
            'Chrome',
        ]);

        expectTokenizer('App.exe a.jpg b.test.js c.test.jpg End.', [
            'App.exe',
            'a.jpg',
            'b.test.js',
            'c.test.jpg',
            'End',
        ]);
    });

    it('tokenize number', () => {
        expectTokenizer('Untitled-1 @ 8.33% (Layer 8, RGB/8) *', [
            'Untitled-1',
            '8.33',
            'Layer',
            '8',
            'RGB',
            '8',
        ]);
    });
});

function createRecordFromTitlesAndWeights(pairs: [string, number][]) {
    const record: PomodoroRecord = {
        switchActivities: [],
        _id: generateRandomName(),
        apps: {},
        switchTimes: 10,
        startTime: 100,
        spentTimeInHour: 0.3,
    };

    let index = 0;
    for (let i = 0; i < pairs.length; i += 10) {
        const titleSpentTime: TitleSpentTimeDict = {};
        for (let j = i; j < pairs.length && j < i + 10; j += 1) {
            const pair = pairs[j];
            titleSpentTime[pair[0]] = {
                index,
                normalizedWeight: pair[1],
                occurrence: pair[1] * 100,
            };

            index += 1;
        }

        record.apps[i.toString()] = {
            titleSpentTime,
            spentTimeInHour: 0.1,
            appName: i.toString(),
        };
    }

    return record;
}

function pairToDict(pairs: [string, number][]): { [name: string]: number } {
    const ans: { [n: string]: number } = {};
    for (const pair of pairs) {
        ans[pair[0]] = pair[1];
    }

    return ans;
}

function expectWeights(records: PomodoroRecord[], weights: { [n: string]: number }) {
    const pred = getWeightsFromPomodoros(records);
    expect(pairToDict(pred)).toStrictEqual(weights);
}

describe('Tokenizer.getTokenWeightsFromRecords', () => {
    it('aggregates empty data correctly', () => {
        expect(getWeightsFromPomodoros([])).toStrictEqual([]);
    });

    it('aggregates one record correctly', () => {
        const record = createRecordFromTitlesAndWeights([
            ['expect(getWeightsFromPomodoros([])).toStrictEqual([]);', 1],
        ]);

        expectWeights([record], {
            expect: 42,
            getWeightsFromPomodoros: 42,
            toStrictEqual: 42,
        });
    });

    it('aggregates records correctly', () => {
        const records = [
            createRecordFromTitlesAndWeights([
                ['const weight normalizedWeight;', 3],
                ['Math.min--;', 1],
            ]),
            createRecordFromTitlesAndWeights([
                ['targetMin: number = 12', 3],
                ['MiddleSize', 2],
                ['targetMax', 1],
            ]),
        ];

        expectWeights(records, {
            const: 42,
            weight: 42,
            normalizedWeight: 42,
            'Math.min': 12,
            targetMin: 42,
            number: 42,
            '12': 42,
            targetMax: 12,
            MiddleSize: (12 + 42) / 2,
        });
    });
});

describe('Tokenizer.getTokenWeightsFromCards', () => {
    it('should calc cards weight correctly', () => {});
});
