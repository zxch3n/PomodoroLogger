import type { BaseResult } from 'active-win';
import { getScreen } from './screenshot';
export type ActiveWinListener = (result?: BaseResult, screenshot?: string) => void;
export class Monitor {
    timer?: any;
    screenshotTimer?: number;
    intervalTimeout: number;
    listener: ActiveWinListener;
    screenshotInterval: number | undefined;
    shouldTakeScreenshot: boolean = false;
    constructor(
        listener: ActiveWinListener,
        interval: number = 5000,
        screenshotInterval: number | undefined = undefined
    ) {
        this.timer = undefined;
        this.intervalTimeout = interval;
        this.listener = listener;
        this.screenshotInterval = screenshotInterval;
    }

    get isRunning() {
        return !!this.timer;
    }

    start = () => {
        if (this.timer) {
            return;
        }

        this.timer = setInterval(this.watch, this.intervalTimeout);
        if (this.screenshotInterval) {
            this.screenshotTimer = setInterval(() => {
                this.shouldTakeScreenshot = true;
            }, this.screenshotInterval);
        }

        this.watch();
    };

    watch = async () => {
        const data = await window.api.activeWin();
        if (data) {
            try {
                if (this.shouldTakeScreenshot) {
                    this.shouldTakeScreenshot = false;
                    const screenshot = await getScreen(500);
                    this.listener(data, screenshot);
                } else {
                    this.listener(data);
                }
            } catch (e) {
                console.error(e);
            }
        }
    };

    stop = () => {
        clearInterval(this.timer);
        if (this.screenshotTimer != null) {
            clearInterval(this.screenshotTimer);
        }
        this.timer = undefined;
    };
}
