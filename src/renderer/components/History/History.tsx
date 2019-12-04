import React, { useEffect, useRef, useState } from 'react';
import { Card, Col, Row, Select, Spin, Statistic } from 'antd';
import { HistoryActionCreatorTypes, HistoryState } from './action';
import { GridCalendar } from '../Visualization/GridCalendar';
import styled from 'styled-components';
import { DualPieChart } from '../Visualization/DualPieChart';
import { AggPomodoroInfo, getAggPomodoroInfo } from './op';
import { WordCloud } from '../Visualization/WordCloud';
import { KanbanBoardState } from '../Kanban/Board/action';
import { DBWorker } from '../../workers/DBWorker';
import { Loading } from '../utils/Loading';
import { debounce } from 'lodash';
import { fatScrollBar, tabMaxHeight, thinScrollBar } from '../../style/scrollbar';

const { Option } = Select;

const Container = styled.div`
    overflow-y: auto;
    margin: 0;
    padding: 20px;
    ${tabMaxHeight}
    ${fatScrollBar}
`;

const SubContainer = styled.div`
    max-width: 1200px;
    margin: 0 auto;
`;

const ChartContainer = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
`;

interface Props extends HistoryActionCreatorTypes, HistoryState {
    chosenId?: string;
    boards: KanbanBoardState;
}

export const History: React.FunctionComponent<Props> = (props: Props) => {
    const [aggInfo, setAggInfo] = useState<AggPomodoroInfo>({
        count: {
            day: undefined,
            month: undefined,
            week: undefined
        },
        calendarCount: undefined,
        pieChart: undefined,
        wordWeights: undefined
    });
    const container = useRef<HTMLDivElement>();
    const [calendarWidth, setCalendarWidth] = useState(800);

    const resizeEffect = () => {
        const setWidth = debounce(() => {
            const w = !container.current
                ? 800
                : container.current.clientWidth > 1060
                ? 1000
                : container.current.clientWidth - 60;
            setCalendarWidth(w);
        }, 200);
        setWidth();
        window.addEventListener('resize', setWidth);
        return () => {
            window.removeEventListener('resize', setWidth);
        };
    };

    useEffect(resizeEffect, []);
    useEffect(() => {
        const searchArg = props.chosenId === undefined ? {} : { boardId: props.chosenId };
        // Avoid using outdated cache
        const db = new DBWorker('sessionDB');
        db.find(searchArg, {})
            .then(docs => {
                return getAggPomodoroInfo(docs);
            })
            .then((ans: AggPomodoroInfo) => {
                setAggInfo(ans);
                console.log('set agg info');
            });
    }, [props.chosenId, props.expiringKey]);

    const onChange = (v: string) => {
        props.setChosenProjectId(v);
    };

    const onProjectClick = (name: string) => {
        const v = Object.values(props.boards).find(v => v.name === name);
        if (v) {
            props.setChosenProjectId(v._id);
        }
    };

    return (
        // @ts-ignore
        <Container ref={container}>
            <SubContainer>
                <Row style={{ marginBottom: 20 }}>
                    <Select
                        onChange={onChange}
                        value={props.chosenId}
                        style={{ width: 200 }}
                        placeholder={'Set Project Filter'}
                    >
                        <Option value={undefined} key="All Projects">
                            All Projects
                        </Option>
                        {Object.values(props.boards).map(v => {
                            return (
                                <Option value={v._id} key={v._id}>
                                    {v.name}
                                </Option>
                            );
                        })}
                    </Select>
                </Row>
                <Row gutter={16}>
                    <Col span={8}>
                        <Card>
                            {aggInfo.count.day != null ? (
                                <Statistic
                                    title="Pomodoros Today"
                                    value={aggInfo.count.day}
                                    precision={0}
                                    valueStyle={{ color: '#3f8600' }}
                                />
                            ) : (
                                <Loading hideBackground={true} />
                            )}
                        </Card>
                    </Col>
                    <Col span={8}>
                        <Card>
                            {aggInfo.count.week != null ? (
                                <Statistic
                                    title="Pomodoros This Week"
                                    value={aggInfo.count.week}
                                    precision={0}
                                    valueStyle={{ color: '#3f8600' }}
                                />
                            ) : (
                                <Loading hideBackground={true} />
                            )}
                        </Card>
                    </Col>
                    <Col span={8}>
                        <Card>
                            {aggInfo.count.month != null ? (
                                <Statistic
                                    title="Pomodoros This Month"
                                    value={aggInfo.count.month}
                                    precision={0}
                                    valueStyle={{ color: '#cf1322' }}
                                />
                            ) : (
                                <Loading hideBackground={true} />
                            )}
                        </Card>
                    </Col>
                </Row>
                {aggInfo.pieChart != null && aggInfo.wordWeights != null ? (
                    calendarWidth > 670 ? (
                        <ChartContainer>
                            <GridCalendar data={aggInfo.calendarCount} width={calendarWidth} />
                            <DualPieChart
                                {...aggInfo.pieChart}
                                width={calendarWidth}
                                onProjectClick={onProjectClick}
                            />
                            <WordCloud
                                weights={aggInfo.wordWeights}
                                width={calendarWidth}
                                height={calendarWidth * 0.6}
                            />
                        </ChartContainer>
                    ) : (
                        undefined
                    )
                ) : (
                    <Loading size={'large'} />
                )}
            </SubContainer>
        </Container>
    );
};
