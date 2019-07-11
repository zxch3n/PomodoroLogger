import { remote } from 'electron';
import { BaseResult } from 'active-win';
let activeWin: any;

if (process.env.NODE_ENV === 'test' && !remote) {
    // Node Environment
    activeWin = require('active-win');
} else {
    // renderer env
    activeWin = remote.require('active-win');
}

export type ActiveWinListener = (result?: BaseResult) => void;
export class Monitor {
    timer?: number;
    intervalTimeout: number;
    listener: ActiveWinListener;
    constructor(listener: ActiveWinListener, interval: number = 5000) {
        this.timer = undefined;
        this.intervalTimeout = interval;
        this.listener = listener;
    }

    get isRunning() {
        return !!this.timer;
    }

    start = () => {
        if (this.timer) {
            return;
        }

        this.timer = setInterval(this.watch, this.intervalTimeout);
        this.watch();
    };

    watch = async () => {
        const data = await activeWin();
        if (data) {
            this.listener(data);
        } else {
        }
    };

    stop = () => {
        clearInterval(this.timer);
        this.timer = undefined;
    };
}
