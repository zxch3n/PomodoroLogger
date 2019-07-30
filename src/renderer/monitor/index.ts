import { ActiveWinListener, Monitor as WindowMonitor } from './activeWinMonitor';
import { getScreen } from './screenshot';
import { BaseResult } from 'active-win';
import { removeRedundantField, renameIllegalName } from './sessionManager';

// This module may not be available in electron renderer
type Listener = (appName: string, data: PomodoroRecord, imgUrl?: string) => void;
class UsageRecorder {
    private record: PomodoroRecord;
    private readonly screenShotInterval?: number;
    private lastUsingApp?: string;
    private lastScreenShotTime: number = 0;
    private lock: boolean = false;

    private lastScreenShot?: ImageData;
    private lastScreenShotUrl?: string;
    private readonly monitorListener: Listener;

    constructor(monitorListener: Listener, screenShotInterval?: number) {
        this.record = {
            apps: {},
            spentTimeInHour: 0,
            switchTimes: 0,
            screenStaticDuration: screenShotInterval === undefined ? undefined : 0,
            startTime: 0
        };

        this.screenShotInterval = screenShotInterval;
        this.monitorListener = monitorListener;
    }

    get sessionData() {
        return this.record;
    }

    clear = () => {
        this.record = {
            apps: {},
            spentTimeInHour: 0,
            switchTimes: 0,
            screenStaticDuration: this.screenShotInterval === undefined ? undefined : 0,
            startTime: 0
        };
    };

    start = () => {
        this.record.startTime = new Date().getTime();
    };

    resume = () => {};

    stop = () => {
        // TODO: test to make sure this is invoked
        this.listener(undefined);
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
        const appName = result ? result.owner.name : undefined;
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
                screenStaticDuration: this.screenShotInterval === undefined ? undefined : 0,
                lastUpdateTime: now
            };
        }

        await this.updateThisAppUsageInfo(appName, result.title).catch(err => {
            this.lock = false;
            throw err;
        });
        this.monitorListener(appName, this.record, this.lastScreenShotUrl);
        this.lock = false;
    };

    updateLastAppUsageInfo = (lastAppName: string) => {
        const row = this.record.apps[lastAppName];
        if (!row) {
            throw new Error();
        }

        row.switchTimes += 1;
        this.record.switchTimes += 1;
        if (row.lastUpdateTime) {
            const spentTimeInHour = (new Date().getTime() - row.lastUpdateTime) / 1000 / 3600;
            row.spentTimeInHour += spentTimeInHour;
            this.record.spentTimeInHour += spentTimeInHour;
            row.lastUpdateTime = undefined;
        }

        this.lastUsingApp = undefined;
        this.lastScreenShot = undefined;
    };

    updateThisAppUsageInfo = async (appName: string, title: string) => {
        const appRow = this.record.apps[appName];
        const row = this.record.apps[appName];
        const now = new Date().getTime();
        // TODO: add time info?
        appRow.titleSpentTime[title] = 1;
        if (!row) {
            throw new Error();
        }

        if (row.lastUpdateTime) {
            const spentTimeInHour = (now - row.lastUpdateTime) / 1000 / 3600;
            row.spentTimeInHour += spentTimeInHour;
            this.record.spentTimeInHour += spentTimeInHour;
        }

        row.lastUpdateTime = now;
        await this.takeCareOfScreenShot(appRow).catch(err => {
            if (err) {
                console.error(err);
                throw err;
            }
        });
        this.lastUsingApp = appName;
    };

    takeCareOfScreenShot = async (appRow: ApplicationSpentTime) => {
        // Screen Shot
        const now = new Date().getTime();
        if (this.screenShotInterval && this.lastScreenShotTime + this.screenShotInterval < now) {
            const duration = (now - this.lastScreenShotTime) / 3600 / 1000;
            this.lastScreenShotTime = now;
            const canvas = await getScreen().catch(err => {
                throw err;
            });
            if (!canvas) {
                throw new Error();
            }

            const newScreenShot = this.getImageData(canvas);
            if (this.lastScreenShot) {
                console.log('Comparing screenshot');
                if (this.didScreenShotChange(newScreenShot)) {
                    console.log('screenshot changed');
                } else {
                    console.log('screenshots are the same');
                    if (appRow.screenStaticDuration !== undefined) {
                        appRow.screenStaticDuration += duration;
                        if (this.record.screenStaticDuration !== undefined) {
                            this.record.screenStaticDuration += duration;
                        }
                    } else {
                        throw new Error();
                    }
                }
            }

            this.lastScreenShot = newScreenShot;
            this.lastScreenShotUrl = canvas.toDataURL('image/png');
        }
    };

    getImageData = (canvas: HTMLCanvasElement): ImageData => {
        const context = canvas.getContext('2d');
        if (!context) {
            throw new Error('cannot get context');
        }

        return context.getImageData(0, 0, canvas.width, canvas.height);
    };

    didScreenShotChange = (newImg: ImageData): boolean => {
        const oldImg = this.lastScreenShot;
        if (!oldImg) {
            return true;
        }

        if (newImg.data.length !== oldImg.data.length) {
            return true;
        }

        for (let i = 0; i < newImg.data.length; i += 1) {
            if (oldImg.data[i] !== newImg.data[i]) {
                return true;
            }
        }

        return false;
    };
}

export class Monitor {
    recorder: UsageRecorder;
    monitorInterval: number;
    screenShotInterval?: number;
    winMonitor: WindowMonitor;

    constructor(
        monitorListener: Listener,
        monitorInterval: number = 500,
        screenShotInterval: number | undefined = undefined
    ) {
        if (screenShotInterval && monitorInterval > screenShotInterval) {
            throw new Error('monitorInterval must be less than screenShotInterval ');
        }

        this.monitorInterval = monitorInterval;
        this.screenShotInterval = screenShotInterval;
        this.recorder = new UsageRecorder(monitorListener, this.screenShotInterval);
        this.winMonitor = new WindowMonitor(this.recorder.listener, this.monitorInterval);
    }

    start = () => {
        if (this.winMonitor.isRunning) {
            return;
        }

        this.recorder.start();
        this.winMonitor.start();
    };

    resume = () => {
        if (this.winMonitor.isRunning) {
            return;
        }

        this.recorder.resume();
        this.winMonitor.start();
    };

    stop = () => {
        this.winMonitor.stop();
        this.recorder.stop();
    };

    /**
     * Clear the data of current session
     */
    clear = () => {
        this.winMonitor.stop();
        this.recorder.stop();
        this.recorder.clear();
    };

    get sessionData(): PomodoroRecord {
        const data = this.recorder.sessionData;
        removeRedundantField(data);
        renameIllegalName(data);
        return data;
    }
}

/**
 * Aggregated application spent time in a session
 *
 */
export interface ApplicationSpentTime {
    appName: string;
    spentTimeInHour: number;
    titleSpentTime: { [title: string]: number };
    // how many times user switched to this app
    switchTimes: number;
    // how long the screen shot stay the same in this app
    screenStaticDuration?: number;
    lastUpdateTime?: number;
}

export interface PomodoroRecord {
    apps: {
        [appName: string]: ApplicationSpentTime;
    };
    spentTimeInHour: number;
    switchTimes: number;
    startTime: number;
    screenStaticDuration?: number;
    todoId?: string;
    projectId?: string;
}
