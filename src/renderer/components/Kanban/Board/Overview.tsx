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

const Container = styled.div``;

interface Props {
    boards: KanbanBoardState;
    lists: ListsState;
    cards: CardsState;
}

interface AggBoardInfo {
    _id: string;
    name: string;
    estimatedTimeSum: number | string;
    actualTimeSum: number | string;
    pomodoroCount: number | string;
    meanPercentageError: number | string;
}

const columns = [
    {
        title: 'Board Name',
        dataIndex: 'name',
        editable: true,
        key: 'name'
    },
    {
        title: 'Estimated Hours',
        dataIndex: 'estimatedTimeSum',
        key: 'estimatedTimeSum'
    },
    {
        title: 'Actual Hours',
        dataIndex: 'actualTimeSum',
        key: 'actualTimeSum'
    },
    {
        title: 'Pomodoros',
        dataIndex: 'pomodoroCount',
        key: 'pomodoroCount'
    },
    {
        title: 'Mean Estimate Error',
        dataIndex: 'meanPercentageError',
        key: 'meanPercentageError'
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

const _Overview: FC<Props> = (props: Props) => {
    const { boards, lists: listsById, cards: cardsById } = props;
    const boardRows = Object.values(boards);

    const aggInfo: AggBoardInfo[] = boardRows.map(board => {
        const { name, lists, relatedSessions, _id } = board;
        const cards: Card[] = lists.reduce((l: Card[], r) => {
            for (const cardId of listsById[r].cards) {
                l.push(cardsById[cardId]);
            }
            return l;
        }, []);
        const [estimatedTimeSum, actualTimeSum, errorSum, n] = cards.reduce(
            (l: number[], r: Card) => {
                let err = 0;
                const { actual, estimated } = r.spentTimeInHour;
                if (actual !== 0 && estimated !== 0) {
                    err = (Math.abs(estimated - actual) / actual) * 100;
                }

                return [
                    l[0] + r.spentTimeInHour.estimated,
                    l[1] + r.spentTimeInHour.actual,
                    l[2] + err,
                    l[3] + 1
                ];
            },
            [0, 0, 0, 0]
        );
        return {
            _id,
            name,
            estimatedTimeSum: estimatedTimeSum.toFixed(2),
            actualTimeSum: actualTimeSum.toFixed(2),
            meanPercentageError: (errorSum / n).toFixed(2),
            pomodoroCount: relatedSessions.length
        };
    });

    return (
        <Container>
            <Table rowKey={'name'} columns={columns} dataSource={aggInfo} />
        </Container>
    );
};

export const Overview = connect(
    (state: RootState) => ({
        boards: state.kanban.boards,
        lists: state.kanban.lists,
        cards: state.kanban.cards
    }),
    (dispatch: Dispatch) => ({})
)(_Overview);
