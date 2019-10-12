import { PomodoroRecord } from './type';
import { ActiveWinListener } from './activeWinMonitor';
import { BaseResult } from 'active-win';
import shortid from 'shortid';

function removeAppSuffix(name: string) {
    return name.replace(/\.exe$/g, '');
}

export type Listener = (appName: string, data: PomodoroRecord, imgUrl?: string) => void;
export class UsageRecorder {
    private record: PomodoroRecord;
    private lastUsingApp?: string;
    private lock: boolean = false;

    private lastScreenShot?: ImageData;
    private lastScreenShotUrl?: string;
    private readonly monitorListener: Listener;

    constructor(monitorListener: Listener) {
        this.record = {
            _id: shortid.generate(),
            apps: {},
            spentTimeInHour: 0,
            switchTimes: 0,
            startTime: 0
        };

        this.monitorListener = monitorListener;
    }

    get sessionData() {
        this.normalizeTitleSpentTime();
        return this.record;
    }

    clear = () => {
        this.record = {
            _id: shortid.generate(),
            apps: {},
            spentTimeInHour: 0,
            switchTimes: 0,
            startTime: 0
        };
    };

    start = () => {
        this.record.startTime = new Date().getTime();
    };

    resume = () => {};

    stop = async () => {
        // TODO: test to make sure this is invoked
        await this.listener(undefined);
    };

    /**
     *
     * @param result, undefined means the timer is stopped
     */
    listener: ActiveWinListener = async (result?: BaseResult) => {
        // Because we await something here, and
        // this method is call at an interval, there are chances
        // that we run call the method before last call is done;
        // I use a lock to avoid that.
        if (this.lock) {
            console.warn('Locked! The update interval is too short.');
            return;
        }

        const now = new Date().getTime();
        const appName = result ? removeAppSuffix(result.owner.name) : undefined;
        if (this.lastUsingApp && appName !== this.lastUsingApp) {
            this.updateLastAppUsageInfo(this.lastUsingApp);
        }

        if (!appName || !result) {
            return;
        }

        this.lock = true;
        if (!(appName in this.record.apps)) {
            this.record.apps[appName] = {
                appName,
                spentTimeInHour: 0,
                titleSpentTime: {},
                switchTimes: 0,
                lastUpdateTime: now
            };
        }

        await this.updateThisAppUsageInfo(appName, result.title).catch(err => {
            if (err) {
                this.lock = false;
                throw err;
            }
        });
        this.lastUsingApp = appName;
        this.monitorListener(appName, this.record, this.lastScreenShotUrl);
        this.lock = false;
    };

    private updateLastAppUsageInfo = (lastAppName: string) => {
        const row = this.record.apps[lastAppName];
        if (!row) {
            throw new Error(
                `App "${lastAppName}" does not exists in ${JSON.stringify(this.record.apps)}`
            );
        }

        row.switchTimes += 1;
        this.record.switchTimes += 1;
        if (row.lastUpdateTime != null) {
            const spentTimeInHour = (new Date().getTime() - row.lastUpdateTime) / 1000 / 3600;
            row.spentTimeInHour += spentTimeInHour;
            this.record.spentTimeInHour += spentTimeInHour;
            row.lastUpdateTime = undefined;
        }

        this.lastUsingApp = undefined;
        this.lastScreenShot = undefined;
    };

    updateThisAppUsageInfo = async (appName: string, title: string) => {
        const row = this.record.apps[appName];
        const now = new Date().getTime();
        if (!row) {
            throw new Error();
        }

        // Count the title occurrences.
        // This should be normalized when session finished.
        if (!(title in row.titleSpentTime)) {
            row.titleSpentTime[title] = {
                normalizedWeight: 0,
                occurrence: 0
            };
        }
        row.titleSpentTime[title].occurrence += 1;

        if (row.lastUpdateTime != null) {
            const spentTimeInHour = (now - row.lastUpdateTime) / 1000 / 3600;
            row.spentTimeInHour += spentTimeInHour;
            this.record.spentTimeInHour += spentTimeInHour;
        }

        row.lastUpdateTime = now;
    };

    private normalizeTitleSpentTime = () => {
        let totalTitleOccurrences = 0;
        for (const app in this.record.apps) {
            const titles = this.record.apps[app].titleSpentTime;
            for (const title in titles) {
                totalTitleOccurrences += titles[title].occurrence;
            }
        }

        for (const app in this.record.apps) {
            const titles = this.record.apps[app].titleSpentTime;
            for (const title in titles) {
                titles[title].normalizedWeight = titles[title].occurrence / totalTitleOccurrences;
            }
        }
    };
}
