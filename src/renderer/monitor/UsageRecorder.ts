import { PomodoroRecord } from './type';
import { ActiveWinListener } from './activeWinMonitor';
import type { BaseResult } from 'active-win';
import { cloneDeep } from 'lodash';
import shortid from 'shortid';

function removeAppSuffix(name: string) {
    return name.replace(/\.exe$/g, '');
}

export type Listener = (appName: string, data: PomodoroRecord, imgUrl?: string) => void;
export class UsageRecorder {
    private record: PomodoroRecord;
    private lastUsingApp?: string;
    private lock: boolean = false;
    private maxIndex: number = 0;
    private lastUpdateTime: number | undefined = undefined;
    public isRunning: boolean = false;

    private lastScreenShotUrl?: string;
    private readonly monitorListener: Listener;

    constructor(monitorListener: Listener) {
        this.record = {
            _id: shortid.generate(),
            switchActivities: [],
            stayTimeInSecond: [],
            apps: {},
            spentTimeInHour: 0,
            switchTimes: 0,
            startTime: 0,
        };

        this.monitorListener = monitorListener;
    }

    get sessionData() {
        if (this.isRunning) {
            this.stop();
        }

        this.normalizeTitleSpentTime();
        return cloneDeep(this.record);
    }

    clear = () => {
        this.record = {
            _id: shortid.generate(),
            switchActivities: [],
            stayTimeInSecond: [],
            apps: {},
            spentTimeInHour: 0,
            switchTimes: 0,
            startTime: 0,
        };

        this.maxIndex = 0;
        this.isRunning = false;
        this.lastUpdateTime = undefined;
    };

    start = () => {
        this.record.startTime = new Date().getTime();
        this.lastUpdateTime = this.record.startTime;
        this.isRunning = true;
    };

    resume = () => {
        this.lastUpdateTime = new Date().getTime();
        this.isRunning = true;
    };

    stop = () => {
        if (this.isRunning) {
            this.updateThisAppUsageInfo(this.lastUsingApp!);
        }

        this.lastUpdateTime = undefined;
        this.isRunning = false;
        this.listener(undefined);
    };

    /**
     *
     * @param result, undefined means the timer is stopped, letting recorder to record the last app info
     * @param screenshot, the path to screenshot
     */
    listener: ActiveWinListener = async (result?: BaseResult, screenshot?: string) => {
        // Because we await something here, and
        // this method is call at an interval, there are chances
        // that we run call the method before last call is done;
        // I use a lock to avoid that.
        if (screenshot) {
            if (this.record.screenshots == null) {
                this.record.screenshots = [];
            }

            this.record.screenshots.push({
                time: new Date().getTime(),
                path: screenshot,
            });
        }

        if (this.lock) {
            console.warn('Locked! The update interval is too short.');
            return;
        }

        const appName = result ? removeAppSuffix(result.owner.name) : undefined;
        if (this.lastUsingApp && appName !== this.lastUsingApp) {
            this.updateLastAppUsageInfo(this.lastUsingApp);
        }

        if (!appName || !result || !this.isRunning) {
            // the app may have stopped, but the listener may still be invoked
            return;
        }

        this.lock = true;
        if (!(appName in this.record.apps)) {
            this.record.apps[appName] = {
                appName,
                spentTimeInHour: 0,
                titleSpentTime: {},
            };
        }

        this.updateThisAppUsageInfo(appName, result.title);
        this.lastUsingApp = appName;
        this.monitorListener(appName, this.record, this.lastScreenShotUrl);
        this.lock = false;
    };

    private updateLastAppUsageInfo = (lastAppName: string) => {
        const row = this.record.apps[lastAppName];
        if (!row) {
            console.error(
                `App "${lastAppName}" does not exists in ${JSON.stringify(this.record.apps)}`
            );
        }

        this.record.switchTimes += 1;
        this.lastUsingApp = undefined;
    };

    updateThisAppUsageInfo = (appName: string, title: string = appName) => {
        const row = this.record.apps[appName];
        const now = new Date().getTime();
        if (!row) {
            throw new Error();
        }

        // Count the title occurrences.
        // This should be normalized when session finished.
        if (!(title in row.titleSpentTime)) {
            row.titleSpentTime[title] = {
                index: this.maxIndex,
                normalizedWeight: 0,
                occurrence: 0,
            };

            this.maxIndex += 1;
        }

        row.titleSpentTime[title].occurrence += 1;

        if (this.lastUpdateTime == null) {
            throw new Error('You should start recorder before using it');
        }

        const spentTimeInHour = (now - this.lastUpdateTime!) / 1000 / 3600;
        row.spentTimeInHour += spentTimeInHour;
        this.record.spentTimeInHour += spentTimeInHour;
        this.updateSwitchActivity(row.titleSpentTime[title].index, now);
        this.lastUpdateTime = now;
    };

    private updateSwitchActivity = (index: number, now: number) => {
        const last = this.record.switchActivities!.length - 1;
        const stayTimeArr = this.record.stayTimeInSecond!;
        if (stayTimeArr.length !== 0) {
            stayTimeArr[stayTimeArr.length - 1] += (now - this.lastUpdateTime!) / 1000;
        }

        if (this.record.switchActivities![last] !== index) {
            this.record.switchActivities!.push(index);
            this.record.stayTimeInSecond!.push(0);
        }
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
