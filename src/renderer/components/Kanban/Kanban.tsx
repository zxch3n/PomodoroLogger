import React, { FunctionComponent, useEffect } from 'react';
import { KanbanActionTypes } from './action';
import { KanbanState } from './reducer';
import { BoardActionTypes } from './Board/action';
import { Button, Select, Layout, Menu, Icon } from 'antd';
import shortid from 'shortid';
import Board from './Board';
import styled from 'styled-components';
import { SelectParam } from 'antd/lib/menu';

const { Option } = Select;
const { Sider, Content } = Layout;

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

    const onSelect = async (param: SelectParam) => {
        await props.setChosenBoardId(param.key);
    };

    const selectedKey = props.kanban.chosenBoardId || 'undefined';
    return (
        <Layout>
            <Sider theme="light" collapsible={true} style={{ height: '100vh' }}>
                <div className="logo" />
                <Menu theme="light" mode="inline" onSelect={onSelect} selectedKeys={[selectedKey]}>
                    <Menu.Item key={'undefined'}>
                        <span>Overview</span>
                    </Menu.Item>
                    {Object.values(props.boards).map(board => (
                        <Menu.Item key={board._id}>
                            <span>{board.name}</span>
                        </Menu.Item>
                    ))}
                    <Button onClick={addBoard}>Add Board</Button>
                </Menu>
            </Sider>
            <Content
                style={{
                    padding: 4,
                    height: '100vh'
                }}
            >
                {props.kanban.chosenBoardId === undefined ? (
                    undefined
                ) : (
                    <Board boardId={props.kanban.chosenBoardId} key={props.kanban.chosenBoardId} />
                )}
            </Content>
        </Layout>
    );
};
