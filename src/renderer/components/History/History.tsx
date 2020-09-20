import React, { useEffect, useRef, useState } from 'react';
import { Card, Col, Row, Select, Statistic } from 'antd';
import { HistoryActionCreatorTypes, HistoryState } from './action';
import { GridCalendar } from '../../../components/Visualization/GridCalendar/GridCalendar';
import styled from 'styled-components';
import { AggPomodoroInfo, getAggPomodoroInfo } from './op';
import { WordCloud } from '../Visualization/WordCloud';
import { KanbanBoardState } from '../Kanban/Board/action';
import { Loading } from '../utils/Loading';
import { debounce } from 'lodash';
import { fatScrollBar } from '../../style/scrollbar';
import { PomodoroNumView } from '../Timer/PomodoroNumView';
import { PomodoroRecord } from '../../monitor/type';
import { formatTimeYMD } from '../Visualization/Timeline';
import { BadgeHolder } from '../Kanban/style/Badge';
import { PomodoroDot } from '../Visualization/PomodoroDot';
import { TimeBadge } from '../Kanban/Card/Badge';
import { workers } from '../../workers';
import { Card as CardState } from '../Kanban/type';
import { DualPieChart } from '../../../components/Visualization/DualPieChart';

const { Option } = Select;

const Container = styled.div`
    overflow-y: auto;
    margin: 0;
    padding: 20px;
    height: calc(100vh - 45px);
    ${fatScrollBar}

    & .visible-pomodoros-view {
        transform-origin: 0 0;
        transition: transform 150ms;
        margin: 6px;
        height: 28px;
    }

    & .invisible-pomodoros-view {
        transform: scale(1, 0);
        margin: 6px;
        height: 28px;
    }
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
    getCardsByBoardId: (boardId: string | undefined) => CardState[];
}

export const History: React.FunctionComponent<Props> = React.memo((props: Props) => {
    const { expiringKey } = props;
    const [targetDate, setTargetDate] = useState<undefined | [number, number, number]>(undefined);
    const [shownPomodoros, setPomodoros] = useState<undefined | PomodoroRecord[]>(undefined);
    const [aggInfo, setAggInfo] = useState<AggPomodoroInfo>({
        count: {
            day: undefined,
            month: undefined,
            week: undefined,
        },
        total: {
            count: undefined,
            usedTime: undefined,
        },
        calendarCount: undefined,
        pieChart: undefined,
        wordWeights: undefined,
    });
    const container = useRef<HTMLDivElement>();
    const [calendarWidth, setCalendarWidth] = useState(document.body.clientWidth - 40);

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
        const boardId = props.chosenId;
        const searchArg = props.chosenId === undefined ? {} : { boardId };
        // Avoid using outdated cache; And use worker to avoid db blocking the process
        const db = workers.dbWorkers.sessionDB;
        db.find(searchArg, {})
            .then((docs) => {
                return getAggPomodoroInfo(docs, props.getCardsByBoardId(boardId));
            })
            .then((ans: AggPomodoroInfo) => {
                setAggInfo(ans);
                setPomodoros(undefined);
            });
    }, [props.chosenId, expiringKey]);
    useEffect(() => {
        if (targetDate == null) {
            return;
        }

        const db = workers.dbWorkers.sessionDB;
        const dateStart = new Date(`${targetDate[0]}-${targetDate[1]}-${targetDate[2]}`).getTime();
        const nextDay = dateStart + 24 * 3600 * 1000;
        setPomodoros(undefined);
        db.find({ startTime: { $lt: nextDay, $gte: dateStart } }, {}).then((docs) => {
            if (docs && docs.length) {
                setPomodoros(docs);
            }
        });
    }, [targetDate]);

    const onChange = (v: string) => {
        props.setChosenProjectId(v);
    };

    const onProjectClick = (name: string) => {
        const v = Object.values(props.boards).find((v) => v.name === name);
        if (v) {
            props.setChosenProjectId(v._id);
        }
    };

    const clickDate = React.useCallback((year: number, month: number, day: number) => {
        setTargetDate([year, month, day]);
    }, []);
    return (
        <Container>
            <SubContainer ref={container as any}>
                <Row style={{ marginBottom: 20, display: 'flex', alignItems: 'center' }}>
                    <Select
                        onChange={onChange}
                        value={props.chosenId}
                        style={{ width: 200 }}
                        placeholder={'Set Project Filter'}
                    >
                        <Option value={undefined} key="All Projects">
                            All Projects
                        </Option>
                        {Object.values(props.boards).map((v) => {
                            return (
                                <Option value={v._id} key={v._id}>
                                    {v.name}
                                </Option>
                            );
                        })}
                    </Select>
                    <BadgeHolder style={{ marginLeft: 10 }}>
                        {aggInfo.total.count != null ? (
                            <PomodoroDot num={aggInfo.total.count} />
                        ) : undefined}
                        {aggInfo.total.usedTime != null ? (
                            <TimeBadge spentTime={aggInfo.total.usedTime} leftTime={0} />
                        ) : undefined}
                    </BadgeHolder>
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
                            <div
                                className={
                                    shownPomodoros
                                        ? 'visible-pomodoros-view'
                                        : 'invisible-pomodoros-view'
                                }
                            >
                                <span
                                    style={{
                                        fontSize: 14,
                                        color: '#7f7f7f',
                                        margin: '0 5px',
                                        display: 'inline-block',
                                    }}
                                >
                                    {shownPomodoros
                                        ? formatTimeYMD(shownPomodoros[0].startTime)
                                        : 'No Data'}
                                </span>
                                <PomodoroNumView
                                    inline={true}
                                    pomodoros={shownPomodoros || []}
                                    showNum={false}
                                    chooseRecord={props.chooseRecord}
                                />
                            </div>
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
                    ) : undefined
                ) : (
                    <Loading size={'large'} />
                )}
            </SubContainer>
        </Container>
    );
});
