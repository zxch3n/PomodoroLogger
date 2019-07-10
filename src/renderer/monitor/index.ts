import { remote } from 'electron';
import { ActiveWinListener, Monitor as BaseWindowMonitor } from '../../main/activeWinMonitor';
import { getScreen } from './screenshot';

// This module may not be available in electron renderer
let WindowMonitor: typeof BaseWindowMonitor = remote.getGlobal('sharedMonitor');
if (!WindowMonitor) {
    WindowMonitor = BaseWindowMonitor;
}

type WindowMonitor = BaseWindowMonitor;

class UsageRecorder {
    public record: PomodoroRecord;
    private readonly screenShotInterval?: number;
    private lastUsingApp?: string;
    private lastScreenShotTime: number = 0;
    private lock: boolean = false;

    private lastScreenShot?: ImageData;
    private monitorListener: (data: PomodoroRecord) => void;

    constructor(monitorListener: (data: PomodoroRecord) => void, screenShotInterval?: number) {
        this.record = {
            apps: {},
            durationInHour: 0,
            switchTimes: 0,
            screenStaticDuration: screenShotInterval === undefined ? undefined : 0
        };

        this.screenShotInterval = screenShotInterval;
        this.monitorListener = monitorListener;
    }

    onSwitchApp = (lastAppName: string) => {
        const row = this.record.apps[lastAppName];
        if (!row) {
            throw new Error();
        }

        row.switchTimes += 1;
        if (row.lastUpdateTime) {
            row.spentTimeInHour += (new Date().getTime() - row.lastUpdateTime) / 1000 / 3600;
            row.lastUpdateTime = undefined;
        }

        this.lastUsingApp = undefined;
        this.lastScreenShot = undefined;
    };

    onUpdateApp = (appName: string) => {
        const row = this.record.apps[appName];
        if (!row) {
            throw new Error();
        }

        if (row.lastUpdateTime) {
            const now = new Date().getTime();
            const spentTimeInHour = (now - row.lastUpdateTime) / 1000 / 3600;
            row.spentTimeInHour += spentTimeInHour;
            row.lastUpdateTime = now;
            this.record.durationInHour += spentTimeInHour;
        }
    };

    getImageData = (canvas: HTMLCanvasElement): ImageData => {
        const context = canvas.getContext('2d');
        if (!context) {
            throw new Error('cannot get context');
        }

        return context.getImageData(0, 0, canvas.width, canvas.height);
    };

    didScreenShotChange = (newScreenShot: HTMLCanvasElement): boolean => {
        const oldImg = this.lastScreenShot;
        if (!oldImg) {
            return true;
        }

        const newImg = this.getImageData(newScreenShot);
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

    listener: ActiveWinListener = async result => {
        // Because we await something here, and
        // this method is call at an interval, there are chances
        // that we run call the method before last call is done;
        // I use a lock to avoid that.
        if (this.lock) {
            // TODO raise warning
            return;
        }

        this.lock = true;
        const now = new Date().getTime();
        const appName = result.owner.name;
        if (this.lastUsingApp && appName !== this.lastUsingApp) {
            this.onSwitchApp(this.lastUsingApp);
        }

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

        this.lastUsingApp = appName;
        const appRow = this.record.apps[appName];
        appRow.titleSpentTime[result.title] = 1;
        this.onUpdateApp(appName);
        if (this.screenShotInterval && this.lastScreenShotTime + this.screenShotInterval < now) {
            const duration = this.lastScreenShotTime;
            this.lastScreenShotTime = now;
            const canvas = await getScreen().catch(err => undefined);
            if (!canvas) {
                throw new Error();
            }

            if (this.lastScreenShot) {
                if (this.didScreenShotChange(canvas)) {
                } else {
                    if (appRow.screenStaticDuration !== undefined) {
                        appRow.screenStaticDuration += duration;
                    } else {
                        throw new Error();
                    }
                }
            }
        }

        this.monitorListener(this.record);
        this.lock = false;
    };
}

export class Monitor {
    recorder: UsageRecorder;
    monitorInterval: number;
    screenShotInterval?: number;

    private winMonitor?: WindowMonitor;

    constructor(
        monitorListener: (data: PomodoroRecord) => void,
        monitorInterval: number = 500,
        screenShotInterval: number | undefined = undefined
    ) {
        if (screenShotInterval && monitorInterval > screenShotInterval) {
            throw new Error('monitorInterval must be less than screenShotInterval ');
        }

        this.monitorInterval = monitorInterval;
        this.screenShotInterval = screenShotInterval;
        this.recorder = new UsageRecorder(monitorListener, this.screenShotInterval);
    }

    start = () => {
        if (this.winMonitor && this.winMonitor.isRunning) {
            return;
        }

        this.winMonitor = new WindowMonitor(this.recorder.listener, this.monitorInterval);
        this.winMonitor.start();
    };

    stop = () => {
        if (this.winMonitor) {
            this.winMonitor.stop();
        }
    };
}

/**
 * Aggregated application spent time in a session
 *
 */
interface ApplicationSpentTime {
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
    durationInHour: number;
    switchTimes: number;
    screenStaticDuration?: number;
}
