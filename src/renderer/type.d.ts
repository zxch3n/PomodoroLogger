import type { BaseResult } from 'active-win';

declare global {
    interface Window {
        api: {
            activeWin(): Promise<BaseResult>;
            setOpenAtLogin(on: boolean): void;
        };
    }
}
