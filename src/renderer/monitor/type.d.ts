/**
 * Aggregated application spent time in a session
 *
 */
export interface ApplicationSpentTime {
    appName: string;
    spentTimeInHour: number;
    titleSpentTime: { [title: string]: { occurrence: number; normalizedWeight: number } };
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
