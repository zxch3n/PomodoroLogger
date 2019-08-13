import { Counter } from '../../utils/Counter';
import { PomodoroRecord } from '../../renderer/monitor/type';

interface AppProjectPair {
    apps: { appName: string; time: number }[];
    project?: string;
}

interface EncodingProjectPair {
    encoding: number[];
    project: string;
}

export class NameEncoder {
    public encodingLength: number;
    constructor(public appNameMap: { [appName: string]: number }) {
        this.encodingLength = Object.keys(appNameMap).length;
        if (this.encodingLength === 0) {
            throw new Error('[NameEncoder] appNameMap cannot be empty');
        }

        let sum = 0;
        for (const name in appNameMap) {
            sum += appNameMap[name];
        }

        if (sum !== ((this.encodingLength - 1) * this.encodingLength) / 2) {
            throw new Error('[NameEncoder] appNameMap target value must be ranged from 0 to n');
        }
    }

    public encode(apps: { appName: string; time: number }[]): number[] {
        const encoding = Array(this.encodingLength).fill(0);
        let timeSum = 0;
        for (const app of apps) {
            timeSum += app.time;
        }

        for (const app of apps) {
            const index = this.appNameMap[app.appName];
            if (index === undefined) {
                continue;
            }

            encoding[index] = app.time / timeSum;
        }

        return encoding;
    }

    public toJson() {
        return this.appNameMap;
    }

    public static fromJson(json: { [appName: string]: number }) {
        return new NameEncoder(json);
    }
}

export function getAppProjectPairs(records: PomodoroRecord[]): AppProjectPair[] {
    return records.map(v => {
        const pairs: { appName: string; time: number }[] = [];
        for (const app in v.apps) {
            pairs.push({
                appName: app,
                time: v.apps[app].spentTimeInHour
            });
        }

        const project: string | undefined = v.projectId;
        return {
            project,
            apps: pairs
        };
    });
}

export function encodeAppUsage(
    pairs: AppProjectPair[]
): {
    encodings: EncodingProjectPair[];
    encoder: NameEncoder;
} {
    function buildEncoder() {
        // TODO: set max apps num
        const nameMap: { [name: string]: number } = {};
        let index = 0;
        for (const pair of pairs) {
            for (const app of pair.apps) {
                if (app.appName in nameMap) {
                    continue;
                }

                nameMap[app.appName] = index;
                index += 1;
            }
        }

        return new NameEncoder(nameMap);
    }

    const encoder = buildEncoder();
    const encoding = pairs.map(
        pair =>
            ({
                project: pair.project,
                encoding: encoder.encode(pair.apps)
            } as EncodingProjectPair)
    );
    return {
        encoder,
        encodings: encoding
    };
}

function dist(a: number[], b: number[]) {
    let sum = 0;
    for (let i = 0; i < a.length; i += 1) {
        const v = a[i] - b[i];
        sum += v * v;
    }

    return sum / a.length;
}

export class KNN {
    private encoder?: NameEncoder;
    private encodings?: EncodingProjectPair[];

    constructor(public k: number = 5) {}

    public get isTrained() {
        return this.encodings !== undefined;
    }

    public get length() {
        if (!this.encodings) {
            return 0;
        }

        return this.encodings.length;
    }

    public fit = (records: PomodoroRecord[]) => {
        const pairs = getAppProjectPairs(records);
        const { encoder, encodings } = encodeAppUsage(pairs);
        const calc = records.length * encodings[0].encoding.length;
        if (calc > 1e8) {
            console.warn('Maybe you should not use KNN as learning algorithm');
        }
        if (calc > 1e9) {
            throw new Error('Maybe you should not use KNN as learning algorithm');
        }

        this.encoder = encoder;
        this.encodings = encodings;
    };

    public predict = (records: PomodoroRecord[]) => {
        if (!this.encoder || !this.encodings) {
            throw new Error('Must fit before predicting');
        }

        if (records.length === 0) {
            return [];
        }

        const pairs = getAppProjectPairs(records);
        const pred = [];
        for (const pair of pairs) {
            const encoding = this.encoder.encode(pair.apps);
            const topKManager = new TopKManager<[number, string]>(this.k, (a, b) => a[0] - b[0]);
            for (const enc of this.encodings) {
                topKManager.push([dist(encoding, enc.encoding), enc.project]);
            }

            pred.push(topKManager.vote(x => x[1]));
        }

        return pred;
    };

    public toJson() {
        if (!this.encoder || !this.encodings) {
            throw new Error('Must fit before saving');
        }

        return {
            encoder: this.encoder.toJson(),
            encodings: this.encodings,
            k: this.k
        };
    }

    public static fromJson(json: { encoder: any; encoding: any; k: number }) {
        const knn = new KNN(json.k);
        knn.encodings = json.encoding;
        knn.encoder = NameEncoder.fromJson(json.encoder);
        return knn;
    }
}

export class TopKManager<T> {
    public arr: T[] = [];
    private maxIndex: number | undefined = undefined;
    public constructor(public k: number, private compare: (a: T, b: T) => number) {
        if (process.env.NODE_ENV !== 'production' && k > 100) {
            throw new Error('You should use a better data structure');
        }

        if (k <= 0) {
            throw new Error('K should be positive number');
        }
    }

    public push(v: T) {
        if (this.maxIndex !== undefined) {
            if (this.compare(v, this.arr[this.maxIndex]) >= 0) {
                return;
            }

            this.arr[this.maxIndex] = v;
            let maxV = v;
            for (let i = 0; i < this.arr.length; i += 1) {
                if (i === this.maxIndex) {
                    continue;
                }

                if (this.compare(this.arr[i], maxV) > 0) {
                    maxV = this.arr[i];
                    this.maxIndex = i;
                }
            }
        } else {
            if (process.env.NODE_ENV !== 'production' && this.arr.length !== 0) {
                throw new Error('arr is not empty while maxIndex is undefined');
            }

            this.arr.push(v);
            this.maxIndex = 0;
        }
    }

    public vote(prop: (v: T) => string) {
        const counter = new Counter();
        for (const a of this.arr) {
            counter.add(prop(a));
        }

        let maxV = 0;
        let ans = '';
        const dict = counter.dict;
        for (const name in dict) {
            if (dict[name] > maxV) {
                maxV = dict[name];
                ans = name;
            }
        }

        return ans;
    }
}
