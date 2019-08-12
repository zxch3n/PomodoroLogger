import { PomodoroRecord } from '../../renderer/monitor';

interface AppProjectPair {
    apps: { appName: string; time: number }[];
    project: string;
}

interface EncodingProjectPair {
    encoding: number[];
    project: string;
}

export class Encoder {
    public encodingLength: number;
    constructor(public appNameMap: { [appName: string]: number }) {
        this.encodingLength = Object.keys(appNameMap).length;
    }

    public encode(projectPair: AppProjectPair): EncodingProjectPair {
        const encoding = Array(this.encodingLength).fill(0);
        let timeSum = 0;
        for (const app of projectPair.apps) {
            timeSum += app.time;
        }

        for (const app of projectPair.apps) {
            const index = this.appNameMap[app.appName];
            if (index === undefined) {
                continue;
            }

            encoding[index] = app.time / timeSum;
        }

        return {
            encoding,
            project: projectPair.project
        };
    }
}

export function getAppProjectPairs(records: PomodoroRecord[]): AppProjectPair[] {
    return records
        .filter(v => v.projectId !== undefined)
        .map(v => {
            const pairs: { appName: string; time: number }[] = [];
            for (const app in v.apps) {
                pairs.push({
                    appName: app,
                    time: v.apps[app].spentTimeInHour
                });
            }

            // @ts-ignore
            const project: string = v.projectId;
            return {
                project,
                apps: pairs
            };
        });
}

export function encodeAppUsage(
    pairs: AppProjectPair[]
): {
    encoding: EncodingProjectPair[];
    encoder: Encoder;
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

        return new Encoder(nameMap);
    }

    const encoder = buildEncoder();
    const encoding = pairs.map(pair => encoder.encode(pair));
    return {
        encoder,
        encoding
    };
}
