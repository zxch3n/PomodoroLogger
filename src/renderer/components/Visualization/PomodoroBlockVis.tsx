import * as React from 'react';
import styled from 'styled-components';
import { PomodoroRecord } from '../../monitor/type';
import { getIndexToTitleApp } from '../../monitor/sessionManager';
import { EfficiencyAnalyser } from '../../../efficiency/efficiency';
import { ColorScheme } from './ColorEncoder';
import { formatTimeHMS } from './Timeline';

const Svg = styled.svg`
    transition: all 0.4s;
    .row {
        transition: transform 2.4s;
    }
`;

interface Props {
    record: PomodoroRecord;
    efficiencyAnalyser: EfficiencyAnalyser;
    sortBy?: string;
}

interface Row {
    app: string;
    title: string;
    activityIndex: number;
    isDistracting: boolean;
    time: number;
    ratio: number;
}

function getState(props: Props): Row[] {
    const ans: Row[] = [];
    let time = props.record.startTime;
    const indexToTitle = getIndexToTitleApp(props.record);
    for (let i = 0; i < props.record.stayTimeInSecond!.length; i += 1) {
        const stay = props.record.stayTimeInSecond![i];
        const index = props.record.switchActivities![i];
        const [title, app] = indexToTitle[index];
        const isDistracting = props.efficiencyAnalyser.getIsDistracting(app, title);
        ans.push({
            app,
            title,
            isDistracting,
            time,
            ratio: stay / props.record.spentTimeInHour / 3600,
            activityIndex: index
        });

        time += stay;
    }

    switch (props.sortBy) {
        case 'app':
            ans.sort((a, b) => (a.app < b.app ? -1 : 1));
            break;
        case 'title':
            ans.sort((a, b) => (a.title < b.title ? -1 : 1));
            break;
        case 'index':
            ans.sort((a, b) => a.activityIndex - b.activityIndex);
            break;
        case 'isDistracting':
            ans.sort((a, b) => (a.isDistracting < b.isDistracting ? -1 : 1));
    }

    return ans;
}

export const PomodoroBlockVis = (props: Props) => {
    const [state, setState] = React.useState(getState(props));
    React.useEffect(() => {
        setState(getState(props));
    }, [props.efficiencyAnalyser, props.record]);
    const [appColor, titleColor, isDistractingColor, indexColor] = React.useMemo(() => {
        return [new ColorScheme(), new ColorScheme(), new ColorScheme(), new ColorScheme()];
    }, [props.record]);

    const W = 1100;
    const axisMargin = 100;
    const itemWidth = (W - axisMargin) / 4;
    const H = 1000;
    const blocks = [];
    let y = 0;
    for (const row of state) {
        const itemHeight = row.ratio * H;
        blocks.push(
            <g transform={`translate(${0} ${y})`} key={row.activityIndex} className={'row'}>
                <title>{`${row.app}\n${row.title}\n${formatTimeHMS(row.time)}`}</title>
                <rect
                    fill={indexColor.get(row.activityIndex.toString())}
                    x={0}
                    y={0}
                    width={itemWidth}
                    height={itemHeight}
                />
                <rect
                    fill={appColor.get(row.app)}
                    x={itemWidth}
                    y={0}
                    width={itemWidth}
                    height={itemHeight}
                />
                <rect
                    fill={titleColor.get(row.title)}
                    x={itemWidth * 2}
                    y={0}
                    width={itemWidth}
                    height={itemHeight}
                />
                <rect
                    fill={isDistractingColor.get(row.isDistracting.toString())}
                    x={itemWidth * 3}
                    y={0}
                    width={itemWidth}
                    height={itemHeight}
                />
            </g>
        );

        y += itemHeight;
    }
    return (
        <Svg viewBox={'0 0 1100 1100'}>
            <g transform={`translate(${0} ${axisMargin})`}>{blocks}</g>
        </Svg>
    );
};
