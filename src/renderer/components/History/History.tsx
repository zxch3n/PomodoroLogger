import React, { useEffect, useRef, useState } from 'react';
import { Card, Col, Row, Statistic } from 'antd';
import { HistoryActionCreatorTypes, HistoryState } from './action';
import { GridCalendar } from '../Visualization/GridCalendar';
import styled from 'styled-components';
import { PomodoroDualPieChart } from '../Visualization/DualPieChart';
import { PomodoroRecord } from '../../monitor';
import { Counter } from '../../utils';

const Container = styled.div`
    max-width: 1200px;
    margin: 10px auto;
    padding: 30px;
`;

const mock = () => {
    let time = new Date().getTime();
    const ans: { [time: number]: { count: number } } = {};
    for (let i = 0; i < 365; i += 1, time -= 3600 * 1000 * 24) {
        ans[time] = {
            count: Math.floor(Math.random() * 10)
        };
    }

    return ans;
};

const mockTimeSpentData = () => {
    return {
        projectData: [
            { name: 'A', value: 10 },
            { name: 'B', value: 20 },
            { name: 'C', value: 30 },
            { name: 'D', value: 40 },
            { name: 'E', value: 50 }
        ],
        appData: [
            { name: 'A0', value: 10 },
            { name: 'B0', value: 20 },
            { name: 'C0', value: 30 },
            { name: 'D0', value: 40 },
            { name: 'E0', value: 50 }
        ]
    };
};

const getPomodoroCalendarData = (pomodoros: PomodoroRecord[]) => {
    const counter = new Counter();
    pomodoros.map(v => {
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

const getPomodoroCount = (days: number, pomodoros: PomodoroRecord[]): number => {
    const time = _getDateFromTimestamp(new Date().getTime()).getTime() - days * 24 * 3600 * 1000;
    let n = 0;
    for (const p of pomodoros) {
        if (p.startTime >= time) {
            n += 1;
        }
    }

    return n;
};

interface Props extends HistoryState, HistoryActionCreatorTypes {}
export const History: React.FunctionComponent<Props> = (props: Props) => {
    const container = useRef<HTMLDivElement>();
    const [calendarWidth, setCalendarWidth] = useState(800);

    const resizeEffect = () => {
        const setWidth = () => {
            const w = !container.current
                ? 800
                : container.current.clientWidth > 1060
                ? 1000
                : container.current.clientWidth - 60;
            setCalendarWidth(w);
        };
        setWidth();
        window.addEventListener('resize', setWidth);
        return () => {
            window.removeEventListener('resize', setWidth);
        };
    };

    useEffect(() => {
        props.fetchHistoryFromDisk();
    }, []);
    useEffect(resizeEffect, []);

    return (
        // @ts-ignore
        <Container ref={container}>
            <Row gutter={16}>
                <Col span={8}>
                    <Card>
                        <Statistic
                            title="Pomodoros Today"
                            value={getPomodoroCount(0, props.records)}
                            precision={0}
                            valueStyle={{ color: '#3f8600' }}
                        />
                    </Card>
                </Col>
                <Col span={8}>
                    <Card>
                        <Statistic
                            title="Pomodoros This Week"
                            value={getPomodoroCount(new Date().getDay(), props.records)}
                            precision={0}
                            valueStyle={{ color: '#3f8600' }}
                        />
                    </Card>
                </Col>
                <Col span={8}>
                    <Card>
                        <Statistic
                            title="Pomodoros This Month"
                            value={getPomodoroCount(new Date().getDate() - 1, props.records)}
                            precision={0}
                            valueStyle={{ color: '#cf1322' }}
                        />
                    </Card>
                </Col>
            </Row>
            {calendarWidth > 670 ? (
                <React.Fragment>
                    <GridCalendar
                        data={getPomodoroCalendarData(props.records)}
                        width={calendarWidth}
                    />
                    <PomodoroDualPieChart pomodoros={props.records} width={calendarWidth} />
                </React.Fragment>
            ) : (
                undefined
            )}
        </Container>
    );
};
