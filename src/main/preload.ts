import { contextBridge, ipcRenderer } from 'electron';
import { IpcEventName } from './ipc/type';

const dict: { [event: string]: Function } = {};
/**
 * This file is not used right now
 */
for (const name of Object.keys(IpcEventName)) {
    dict[name] = (...args: any) => ipcRenderer.invoke(name, ...args);
}

contextBridge.exposeInMainWorld('api', dict);
