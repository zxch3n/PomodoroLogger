import { Counter } from '../../../utils/Counter';
import { PomodoroRecord } from '../../monitor/type';
import { getBetterAppName, getNameFromBoardId } from '../../utils';
import { workers } from '../../workers';
import { Card } from '../Kanban/type';

export const getPomodoroCalendarData = (pomodoros: PomodoroRecord[]) => {
    const counter = new Counter();
    pomodoros.forEach((v) => {
        const date = _getDateFromTimestamp(v.startTime).getTime();
        counter.add(date);
    });

    const ans: Record<string, any> = counter.dict;
    for (const key in ans) {
        ans[key] = { count: ans[key] };
    }

    return ans;
};

const _getDateFromTimestamp = (time: number): Date => {
    const datetime = new Date(time);
    const dateStr = `${datetime.getFullYear()}-${datetime.getMonth() + 1}-${datetime.getDate()}`;
    return new Date(dateStr);
};

export const getPomodoroCount = (days: number, pomodoros: PomodoroRecord[]): number => {
    const time = _getDateFromTimestamp(new Date().getTime()).getTime() - days * 24 * 3600 * 1000;
    let n = 0;
    for (const p of pomodoros) {
        if (p.startTime >= time) {
            n += 1;
        }
    }

    return n;
};

export interface TimeSpentData {
    projectData: { name: string; value: number }[];
    appData: { name: string; value: number }[];
}

export const getTimeSpentDataFromRecords = async (
    pomodoros: PomodoroRecord[]
): Promise<TimeSpentData> => {
    const appTimeCounter = new Counter();
    const projectTimeCounter = new Counter();
    const UNK = 'UNK[qqwe]';
    for (const pomodoro of pomodoros) {
        if (pomodoro.boardId) {
            projectTimeCounter.add(pomodoro.boardId, pomodoro.spentTimeInHour);
        } else {
            projectTimeCounter.add(UNK, pomodoro.spentTimeInHour);
        }

        const apps = pomodoro.apps;
        for (const app in apps) {
            appTimeCounter.add(apps[app].appName, apps[app].spentTimeInHour);
        }
    }

    const projectData = projectTimeCounter.getNameValuePairs({ toFixed: 2, topK: 10 });
    for (const v of projectData) {
        if (v.name === UNK) {
            v.name = 'Unknown';
            continue;
        }

        v.name = await getNameFromBoardId(v.name).catch(() => 'Unknown');
    }

    const appData = appTimeCounter
        .getNameValuePairs({ toFixed: 2, topK: 10 })
        .map((v) => ({ ...v, name: getBetterAppName(v.name) }));

    return {
        projectData,
        appData,
    };
};

export interface AggPomodoroInfo {
    count: {
        day?: number;
        week?: number;
        month?: number;
    };
    total: {
        count?: number;
        usedTime?: number;
    };
    calendarCount?: any;
    wordWeights?: [string, number][];
    pieChart?: TimeSpentData;
}

export async function getAggPomodoroInfo(
    pomodoros: PomodoroRecord[],
    cards: Card[]
): Promise<AggPomodoroInfo> {
    return {
        count: {
            day: getPomodoroCount(0, pomodoros),
            week: getPomodoroCount(new Date().getDay(), pomodoros),
            month: getPomodoroCount(new Date().getDate() - 1, pomodoros),
        },
        total: {
            count: pomodoros.length,
            usedTime: cards.reduce((a, b) => a + b.spentTimeInHour.actual, 0),
        },
        wordWeights: await workers.tokenizer.tokenize(pomodoros, cards),
        pieChart: await getTimeSpentDataFromRecords(pomodoros),
        calendarCount: getPomodoroCalendarData(pomodoros),
    };
}
