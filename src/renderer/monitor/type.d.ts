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
    index: number;
    // how long the screen shot stay the same in this app
    screenStaticDuration?: number;
}

export interface PomodoroRecord {
    _id: string;
    apps: {
        [appName: string]: ApplicationSpentTime;
    };
    spentTimeInHour: number;
    switchTimes: number;
    startTime: number;
    screenStaticDuration?: number;
    boardId?: string;
    isRotten?: boolean;
    stayTimeInSecond?: number[];
    switchActivities?: number[];
}
