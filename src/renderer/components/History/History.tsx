import React, { useState, useEffect, useRef } from 'react';
import { Statistic, Card, Icon, Row, Col } from 'antd';
import { HistoryActionCreatorTypes, actions, HistoryState } from './action';
import { GridCalendar } from '../Visualization/GridCalendar';
import styled from 'styled-components';
import { DualPieChart } from '../Visualization/DualPieChart';

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

interface Props extends HistoryState, HistoryActionCreatorTypes {}
export const History: React.FunctionComponent<Props> = (props: Props) => {
    const container = useRef<HTMLDivElement>();
    const [calendarWidth, setCalendarWidth] = useState(800);
    useEffect(() => {
        const setWidth = () => {
            const w = !container.current
                ? 800
                : container.current.clientWidth > 1200
                ? 1200 - 60
                : container.current.clientWidth - 60;
            setCalendarWidth(w);
        };
        setWidth();
        window.addEventListener('resize', setWidth);
        return () => {
            window.removeEventListener('resize', setWidth);
        };
    }, []);
    return (
        // @ts-ignore
        <Container ref={container}>
            <Row gutter={16}>
                <Col span={8}>
                    <Card>
                        <Statistic
                            title="Pomodoros Today"
                            value={8}
                            precision={0}
                            valueStyle={{ color: '#3f8600' }}
                        />
                    </Card>
                </Col>
                <Col span={8}>
                    <Card>
                        <Statistic
                            title="Pomodoros This Week"
                            value={20}
                            precision={0}
                            valueStyle={{ color: '#3f8600' }}
                        />
                    </Card>
                </Col>
                <Col span={8}>
                    <Card>
                        <Statistic
                            title="Pomodoros This Month"
                            value={103}
                            precision={0}
                            valueStyle={{ color: '#cf1322' }}
                        />
                    </Card>
                </Col>
            </Row>
            {calendarWidth > 670 ? <GridCalendar data={mock()} width={calendarWidth} /> : undefined}

            <DualPieChart width={calendarWidth} {...mockTimeSpentData()} />
        </Container>
    );
};
