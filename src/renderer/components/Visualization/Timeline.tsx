import { Timeline } from 'antd';
import * as React from 'react';
import { PomodoroRecord } from '../../monitor/type';
import { getIndexToTitleApp } from '../../monitor/sessionManager';
import { EfficiencyAnalyser } from '../../../shared/efficiency/efficiency';
import { to2digits } from '../../utils';

interface Props {
    record: PomodoroRecord;
    efficiencyAnalyser: EfficiencyAnalyser;
}

export function formatTimeHMS(time: number) {
    const date = new Date(time);
    const hour = to2digits(date.getHours());
    const m = to2digits(date.getMinutes());
    const s = to2digits(date.getSeconds());
    return `${hour}:${m}:${s}`;
}

export function formatTimeYMD(time: number) {
    const date = new Date(time);
    const y = date.getFullYear();
    return `${y}-${date.getMonth() + 1}-${date.getDate()}`;
}

export function formatTimeYmdHms(time: number) {
    return `${formatTimeYMD(time)} ${formatTimeHMS(time)}`;
}

export const PomodoroTimeline = (props: Props) => {
    const data: any[] = [];
    let time = props.record.startTime;
    const indexToTitle = getIndexToTitleApp(props.record);
    for (let i = 0; i < props.record.stayTimeInSecond!.length; i += 1) {
        const stay = props.record.stayTimeInSecond![i];
        const index = props.record.switchActivities![i];
        const [title, app] = indexToTitle[index];
        const isDistracting = props.efficiencyAnalyser.getIsDistracting(app, title);
        const sTime = formatTimeHMS(time);

        data.push(
            <Timeline.Item color={isDistracting ? 'red' : 'green'}>
                <p>{app}</p>
                <p>{title}</p>
                <p>{sTime}</p>
            </Timeline.Item>
        );

        time += stay;
    }

    return <Timeline>{data}</Timeline>;
};
