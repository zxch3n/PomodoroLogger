import React, { FunctionComponent, useEffect } from 'react';
import { KanbanActionTypes } from './action';
import { KanbanState } from './reducer';
import { BoardActionTypes } from './Board/action';
import { Button, Select } from 'antd';
import shortid from 'shortid';
import Board from './Board';
import styled from 'styled-components';

const { Option } = Select;

const Main = styled.div`
    background-color: #dedede;
`;

interface Props extends KanbanState, KanbanActionTypes, BoardActionTypes {}
export const Kanban: FunctionComponent<Props> = (props: Props) => {
    useEffect(() => {
        props.fetchBoards();
    }, []);

    const addBoard = async () => {
        const _id = shortid.generate();
        await props.addBoard(_id, 'test');
        await props.setChosenBoardId(_id);
    };

    const onSelect = async (_id: string) => {
        await props.setChosenBoardId(_id);
    };

    return (
        <Main>
            <h1>Hello World</h1>
            {props.kanban.chosenBoardId === undefined ? (
                undefined
            ) : (
                <Board boardId={props.kanban.chosenBoardId} key={props.kanban.chosenBoardId} />
            )}

            <Button onClick={addBoard}>Add Board</Button>
            <Select onChange={onSelect}>
                {Object.values(props.boards).map(board => (
                    <Option key={board._id} value={board._id}>
                        {board.name}
                    </Option>
                ))}
            </Select>
            <ol>
                {Object.values(props.boards).map(board => (
                    <li key={board.name}>{board.name}</li>
                ))}
            </ol>
        </Main>
    );
};
