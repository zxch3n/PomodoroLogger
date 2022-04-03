import type { ExposedAPI } from '../main/ipc/type';

declare global {
    interface Window {
        api: ExposedAPI;
    }
}
