import type { BaseResult } from 'active-win';
import { SourceData } from '../../shared/dataMerger/dataMerger';

export enum IpcEventName {
    Quit = 'quit',
    Restart = 'restart-app',
    SetTray = 'set-tray',
    DownloadUpdate = 'download-update',
    ExportData = 'export-data',
    ImportData = 'import-data',
    ActiveWin = 'activeWin',
    OpenAtLogin = 'openAtLogin',
    MinimizeWindow = 'minimizeWindow',
    OpenDevTools = 'openDevTools',
    Notify = 'notify',
    FocusOnWindow = 'focusOnWindow',
}

export type ExposedAPI = {
    [IpcEventName.ActiveWin](): Promise<BaseResult | undefined>;
    [IpcEventName.OpenAtLogin](on: boolean): void;
    [IpcEventName.MinimizeWindow](on: boolean, contentHeight: number): void;
    [IpcEventName.OpenDevTools](): void;
    [IpcEventName.Notify](title: string, body: string, iconPath: string): void;
    [IpcEventName.FocusOnWindow](): void;
};

export enum WorkerMessageType {
    MergeData = 'MergeData',
}

export type WorkerMessagePayload = {
    [WorkerMessageType.MergeData]: {
        source: 'local' | SourceData;
        external: SourceData;
    };
};

export type WorkerResponsePayload = {
    [WorkerMessageType.MergeData]: {
        merged: SourceData;
        warning?: string;
    };
};

export type WorkerMessage<T extends WorkerMessageType = WorkerMessageType> = {
    type: T;
    payload: WorkerMessagePayload[T];
    id?: number;
};

export type WorkerResponse<T extends WorkerMessageType = WorkerMessageType> = {
    type: T;
    payload: WorkerResponsePayload[T];
    id: number;
};
