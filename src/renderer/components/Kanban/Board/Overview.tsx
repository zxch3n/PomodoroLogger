import React, { FC, useEffect, useState } from 'react';
import { Table } from 'antd';
import { RootState } from '../../../reducers';
import { Dispatch } from 'redux';
import { KanbanBoardState } from './action';
import { ListsState } from '../List/action';
import { connect } from 'react-redux';
import { Card, CardsState } from '../Card/action';
import { IdTrend } from '../../Visualization/ProjectTrend';
import styled from 'styled-components';
import { formatTime, formatTimeWithoutZero } from '../../../utils';
import { BoardBrief } from './BoardBrief';
import { actions } from '../action';

const Container = styled.div``;

interface Props{
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
    showConfigById?: (boardId: string)=>void;
}

const OverviewTable = connect(
    (state: RootState) => ({
        boards: state.kanban.boards,
        lists: state.kanban.lists,
        cards: state.kanban.cards
    }),
)(_OverviewTable);

const BriefContainer = styled.div`
  display: flex;
  align-items: flex-start;
  flex-wrap: wrap;
`;

interface OverviewCardsProps {
    boards: string[];
    setId: (_id: string)=>void;
    showConfigById?: (boardId: string)=>void;
}

const OverviewCards = connect(
    (state: RootState) => ({
        boards: Object.keys(state.kanban.boards)
    }),
    (dispatch: Dispatch) => ({
        setId: (_id: string) => dispatch(actions.setChosenBoardId(_id))
    })
)(((props: OverviewCardsProps)=>{
    const {boards, setId} = props;

    return (
        <BriefContainer>
            {boards.map(_id=>{
                const onClick = ()=>setId(_id);
                const onSettingClick = props.showConfigById? (()=>{
                    props.showConfigById!(_id);
                }) : undefined;
                return (
                    <BoardBrief key={_id} boardId={_id} onClick={onClick} onSettingClick={onSettingClick}/>
                )
            }) }
        </BriefContainer>
    );
}) as FC<OverviewCardsProps>);

export const Overview: FC<InputProps> = ({showTable = false, showConfigById}: InputProps)=> (
    showTable? <OverviewTable/> : <OverviewCards showConfigById={showConfigById}/>
);
