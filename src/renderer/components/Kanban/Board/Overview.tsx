import React, { FC, useEffect, useState } from 'react';
import { Table } from 'antd';
import { RootState } from '../../../reducers';
import { Dispatch } from 'redux';
import { KanbanBoard, KanbanBoardState } from './action';
import { ListsState } from '../List/action';
import { connect } from 'react-redux';
import { Card, CardsState } from '../Card/action';
import { IdTrend } from '../../Visualization/ProjectTrend';
import styled from 'styled-components';
import { formatTime, formatTimeWithoutZero } from '../../../utils';
import { BoardBrief } from './BoardBrief';
import { actions, SortType } from '../action';
import { workers } from '../../../workers';
import { PomodoroRecord } from '../../../monitor/type';

const Container = styled.div``;

interface Props {
    boards: KanbanBoardState;
    lists: ListsState;
    cards: CardsState;
}

interface AggBoardInfo {
    _id: string;
    name: string;
    estimatedLeftTimeSum: number;
    actualTimeSum: number;
    pomodoroCount: number;
    meanPercentageError?: number;
}

const columns = [
    {
        title: 'Board Name',
        dataIndex: 'name',
        editable: true,
        key: 'name'
    },
    {
        title: 'Estimated Left Time',
        dataIndex: 'estimatedLeftTimeSum',
        key: 'estimatedLeftTimeSum',
        render: formatTimeWithoutZero,
        sorter: (a: AggBoardInfo, b: AggBoardInfo) =>
            a.estimatedLeftTimeSum - b.estimatedLeftTimeSum
    },
    {
        title: 'Spent Time',
        dataIndex: 'actualTimeSum',
        key: 'actualTimeSum',
        render: formatTimeWithoutZero,
        sorter: (a: AggBoardInfo, b: AggBoardInfo) => a.actualTimeSum - b.actualTimeSum
    },
    {
        title: 'Pomodoros',
        dataIndex: 'pomodoroCount',
        key: 'pomodoroCount',
        sorter: (a: AggBoardInfo, b: AggBoardInfo) => a.pomodoroCount - b.pomodoroCount
    },
    {
        title: 'Mean Estimate Error',
        dataIndex: 'meanPercentageError',
        key: 'meanPercentageError',
        render: (text?: number) => {
            if (text === undefined) {
                return ``;
            }

            return `${text.toFixed(2)}%`;
        },
        sorter: (a: AggBoardInfo, b: AggBoardInfo) => {
            const va = a.meanPercentageError === undefined ? 1e8 : a.meanPercentageError;
            const vb = b.meanPercentageError === undefined ? 1e8 : b.meanPercentageError;
            return va - vb;
        }
    },
    {
        title: 'Trend',
        dataIndex: 'trend',
        key: 'trend',
        render: (text: any, record: AggBoardInfo) => {
            return <IdTrend boardId={record._id} />;
        }
    }
];

type NewCard = Card & { isDone?: boolean };
const _OverviewTable: FC<Props> = (props: Props) => {
    const { boards, lists: listsById, cards: cardsById } = props;
    const boardRows = Object.values(boards);

    const aggInfo: AggBoardInfo[] = boardRows.map(board => {
        const { name, lists, relatedSessions, _id } = board;
        const cards: NewCard[] = lists.reduce((l: NewCard[], listId) => {
            for (const cardId of listsById[listId].cards) {
                const card: NewCard = cardsById[cardId];
                card.isDone = listId === board.doneList;
                l.push(card);
            }
            return l;
        }, []);
        const [estimatedLeftTimeSum, actualTimeSum, errorSum, n] = cards.reduce(
            (l: number[], r: NewCard) => {
                let err = 0;
                const { actual, estimated } = r.spentTimeInHour;
                if (r.isDone && actual !== 0 && estimated !== 0) {
                    err = (Math.abs(estimated - actual) / actual) * 100;
                }

                return [
                    l[0] + (r.isDone ? 0 : Math.max(0, estimated - actual)),
                    l[1] + actual,
                    l[2] + err,
                    l[3] + (r.isDone ? 1 : 0)
                ];
            },
            [0, 0, 0, 0]
        );
        return {
            _id,
            name,
            estimatedLeftTimeSum,
            actualTimeSum,
            meanPercentageError: n ? errorSum / n : undefined,
            pomodoroCount: relatedSessions.length
        };
    });

    return (
        <Container>
            <Table rowKey={'name'} columns={columns} dataSource={aggInfo} />
        </Container>
    );
};

interface InputProps {
    showTable?: boolean;
    showConfigById?: (boardId: string) => void;
}

const OverviewTable = connect((state: RootState) => ({
    boards: state.kanban.boards,
    lists: state.kanban.lists,
    cards: state.kanban.cards
}))(_OverviewTable);

const BriefContainer = styled.div`
    display: flex;
    align-items: flex-start;
    flex-wrap: wrap;
`;

const sortFunc: Map<SortType, (a: KanbanBoard, b: KanbanBoard) => number> = new Map();
sortFunc.set('alpha', (a, b) => {
    return a.name < b.name ? -1 : 1;
});
sortFunc.set('due', (a, b) => {
    if (!a.dueTime) {
        return -1;
    }

    if (!b.dueTime) {
        return 1;
    }

    return a.dueTime - b.dueTime;
});
sortFunc.set('spent', (a, b) => {
    return a.spentHours - b.spentHours;
});

interface OverviewCardsProps {
    boards: KanbanBoard[];
    sortedBy: SortType;
    setId: (_id: string) => void;
    lists: ListsState;
    cards: CardsState;
    showConfigById?: (boardId: string) => void;
}

const OverviewCards = connect(
    (state: RootState) => ({
        boards: Object.values(state.kanban.boards),
        sortedBy: state.kanban.kanban.sortedBy,
        lists: state.kanban.lists,
        cards: state.kanban.cards
    }),
    (dispatch: Dispatch) => ({
        setId: (_id: string) => dispatch(actions.setChosenBoardId(_id))
    })
)(((props: OverviewCardsProps) => {
    const { boards, setId } = props;
    const [ids, setIds] = useState<string[]>([]);
    useEffect(() => {
        if (props.sortedBy === 'due' || props.sortedBy === 'alpha' || props.sortedBy === 'spent') {
            boards.sort(sortFunc.get(props.sortedBy));
        } else if (props.sortedBy === 'recent') {
            const sess = workers.dbWorkers['sessionDB'];
            const promises = boards.map(b => {
                return sess.findOne(b.relatedSessions[b.relatedSessions.length - 1]);
            });
            Promise.all(promises).then((sessions: (PomodoroRecord | undefined)[]) => {
                const p: { [_id: string]: number } = {};
                for (let i = 0; i < sessions.length; i += 1) {
                    const v = sessions[i];
                    if (v == null) {
                        p[boards[i]._id] = 0;
                    } else {
                        p[boards[i]._id] = v.startTime;
                    }
                }

                boards.sort((a, b) => p[a._id] - p[b._id]);
                setIds(boards.map(b => b._id));
            });
            return;
        } else if (props.sortedBy === 'remaining') {
            const boardsMap: { [_id: string]: number } = {};
            for (let i = 0; i < boards.length; i += 1) {
                if (boardsMap[boards[i]._id] == null) {
                    boardsMap[boards[i]._id] = 0;
                }

                const board = boards[i];
                let leftSum = 0;
                for (const j of board.lists) {
                    if (j === board.doneList) {
                        continue;
                    }

                    for (const card of props.lists[j].cards) {
                        const h = props.cards[card].spentTimeInHour;
                        const left = h.estimated - h.actual;
                        leftSum += Math.max(0, left);
                    }
                }

                boardsMap[boards[i]._id] = leftSum;
            }

            boards.sort((a, b) => {
                return boardsMap[a._id] - boardsMap[b._id];
            });
        }
        setIds(boards.map(b => b._id));
    }, [props.sortedBy, props.boards, props.sortedBy === 'remaining' && props.cards]);

    return (
        <BriefContainer>
            {ids.map(_id => {
                const onClick = () => setId(_id);
                const onSettingClick = props.showConfigById
                    ? () => {
                        props.showConfigById!(_id);
                    }
                    : undefined;
                return (
                    <BoardBrief
                        key={_id}
                        boardId={_id}
                        onClick={onClick}
                        onSettingClick={onSettingClick}
                    />
                );
            })}
        </BriefContainer>
    );
}) as FC<OverviewCardsProps>);

export const Overview: FC<InputProps> = ({ showTable = false, showConfigById }: InputProps) =>
    showTable ? <OverviewTable /> : <OverviewCards showConfigById={showConfigById} />;
