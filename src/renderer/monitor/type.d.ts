/**
 * Aggregated application spent time in a session
 *
 */

export interface TitleSpentTime {
    occurrence: number;
    normalizedWeight: number;
}

export type TitleSpentTimeDict = { [title: string]: TitleSpentTime };
export interface ApplicationSpentTime {
    appName: string;
    spentTimeInHour: number;
    titleSpentTime: TitleSpentTimeDict;
    // how many times user switched to this app
    switchTimes: number;
    // how long the screen shot stay the same in this app
    screenStaticDuration?: number;
    lastUpdateTime?: number;
}

export interface PomodoroRecord {
    apps: {
        [appName: string]: ApplicationSpentTime;
    };
    spentTimeInHour: number;
    switchTimes: number;
    startTime: number;
    screenStaticDuration?: number;
    todoId?: string;
    projectId?: string;
}
