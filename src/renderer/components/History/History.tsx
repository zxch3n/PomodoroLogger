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
import { PomodoroNumView } from '../Timer/PomodoroNumView';
import { PomodoroRecord } from '../../monitor/type';
import { formatTimeYMD, formatTimeYmdHms } from '../Visualization/Timeline';
import dbs from '../../dbs';
import { AsyncDB } from '../../../utils/dbHelper';

const db = new AsyncDB(dbs.sessionDB);
const { Option } = Select;

const Container = styled.div`
    overflow-y: auto;
    margin: 0;
    padding: 20px;
    height: calc(100vh - 45px);
    ${fatScrollBar}
`;

const SubContainer = styled.div`
    max-width: 1200px;
    min-width: 736px;
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
    chooseRecord: (r: PomodoroRecord) => void;
}

export const History: React.FunctionComponent<Props> = (props: Props) => {
    const [targetDate, setTargetDate] = useState<undefined | [number, number, number]>(undefined);
    const [shownPomodoros, setPomodoros] = useState<undefined | PomodoroRecord[]>(undefined);
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
        db.find(searchArg, {})
            .then(docs => {
                return getAggPomodoroInfo(docs);
            })
            .then((ans: AggPomodoroInfo) => {
                setAggInfo(ans);
                console.log('set agg info');
            });
    }, [props.chosenId, props.expiringKey]);
    useEffect(() => {
        if (targetDate == null) {
            return;
        }

        console.log('Date Effect');
        const db = new DBWorker('sessionDB');
        const dateStart = new Date(`${targetDate[0]}-${targetDate[1]}-${targetDate[2]}`).getTime();
        const nextDay = dateStart + 24 * 3600 * 1000;
        db.find({ startTime: { $lt: nextDay, $gte: dateStart } }, {}).then(docs => {
            console.log('docs', docs);
            if (docs && docs.length) {
                setPomodoros(docs);
            }
        });
    }, [targetDate]);

    const onChange = (v: string) => {
        props.setChosenProjectId(v);
    };

    const onProjectClick = (name: string) => {
        const v = Object.values(props.boards).find(v => v.name === name);
        if (v) {
            props.setChosenProjectId(v._id);
        }
    };

    const clickDate = (year: number, month: number, day: number) => {
        setTargetDate([year, month, day]);
    };
    return (
        <Container>
            <SubContainer ref={container as any}>
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
                            <GridCalendar
                                data={aggInfo.calendarCount}
                                width={calendarWidth}
                                clickDate={clickDate}
                            />
                            {shownPomodoros ? (
                                <div style={{ margin: 10 }}>
                                    <span
                                        style={{
                                            fontSize: 14,
                                            color: '#7f7f7f',
                                            margin: '0 5px',
                                            display: 'inline-block'
                                        }}
                                    >
                                        {formatTimeYMD(shownPomodoros[0].startTime)}
                                    </span>
                                    <PomodoroNumView
                                        inline={true}
                                        pomodoros={shownPomodoros}
                                        showNum={false}
                                        chooseRecord={props.chooseRecord}
                                    />
                                </div>
                            ) : (
                                undefined
                            )}
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
