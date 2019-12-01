import { Monitor as WindowMonitor } from './activeWinMonitor';
import { renameIllegalName } from './sessionManager';
import { PomodoroRecord } from './type';
import { Listener, UsageRecorder } from './UsageRecorder';

// This module may not be available in electron renderer
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
        this.recorder = new UsageRecorder(monitorListener);
        this.winMonitor = new WindowMonitor(
            this.recorder.listener,
            this.monitorInterval,
            screenShotInterval
        );
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
        renameIllegalName(data);
        return data;
    }
}
