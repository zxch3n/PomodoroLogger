import { Counter } from '../../../utils/Counter';
import { PomodoroRecord } from '../../monitor/type';

export const getPomodoroCalendarData = (pomodoros: PomodoroRecord[]) => {
    const counter = new Counter();
    pomodoros.forEach(v => {
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
