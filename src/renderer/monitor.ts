import { remote } from 'electron';
import { Monitor as BaseMonitor } from '../main/activeWinMonitor';

export const Monitor: typeof BaseMonitor = remote ? remote.getGlobal('sharedMonitor') : BaseMonitor;
export type Monitor = BaseMonitor;
