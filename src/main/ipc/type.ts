import { SourceData } from '../../shared/dataMerger/dataMerger';

export enum IpcEventName {
    Quit = 'quit',
    Restart = 'restart-app',
    SetTray = 'set-tray',
    DownloadUpdate = 'download-update',
    ExportData = 'export-data',
    ImportData = 'import-data',
    ReleaseDB = 'release-db',
    LoadDB = 'load-db',
}

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
