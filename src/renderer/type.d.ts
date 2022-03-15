import type { BaseResult } from 'active-win';

declare global {
    interface Window {
        api: {
            activeWin(): Promise<BaseResult>;
            openAtLogin(on: boolean): void;
            minimizeWindow(on: boolean, contentHeight: number): void;
        };
    }
}
