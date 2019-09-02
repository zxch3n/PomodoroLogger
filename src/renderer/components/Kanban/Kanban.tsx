import React, { FunctionComponent, useEffect } from 'react';
import { KanbanActionTypes } from './action';
import { KanbanState } from './reducer';
import { BoardActionTypes } from './Board/action';
import { Button, Select, Layout, Menu, Icon, Dropdown, Popconfirm } from 'antd';
import shortid from 'shortid';
import Board from './Board';
import styled from 'styled-components';
import { SelectParam } from 'antd/lib/menu';

const { Option } = Select;
const { Sider, Content } = Layout;

const Main = styled.div`
    background-color: #dedede;
`;

const CreateButton = styled.div`
    display: flex;
    justify-content: center;
    border: 1px dashed rgba(0, 0, 0, 0.2);
    border-radius: 6px;
    margin: 0 12px;
    padding: 4px;

    :hover {
        background-color: rgba(34, 45, 250, 0.1);
    }
`;

const MenuNameSpan = styled.span`
    float: left;
`;

const MenuIconSpan = styled.span`
    float: right;
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

    const overview = 'overview-default';
    const onSelect = async (param: SelectParam) => {
        if (param.key === overview) {
            await props.setChosenBoardId(undefined);
            return;
        }

        await props.setChosenBoardId(param.key);
    };

    const selectedKey = props.kanban.chosenBoardId || overview;
    return (
        <Layout>
            <Sider
                theme="light"
                style={{ height: 'calc(100vh - 45px)' }}
                breakpoint="md"
                collapsedWidth="0"
            >
                <div className="logo" />
                <Menu theme="light" mode="inline" onSelect={onSelect} selectedKeys={[selectedKey]}>
                    <Menu.Item key={overview}>
                        <span>Overview</span>
                    </Menu.Item>
                    {Object.values(props.boards).map(board => {
                        const onDelete = (event: any) => {
                            props.deleteBoard(board._id);
                            event.stopPropagation();
                        };

                        const onEdit = () => {
                            // TODO: Imp
                        };

                        return (
                            <Menu.Item key={board._id}>
                                <MenuNameSpan>{board.name}</MenuNameSpan>
                                <MenuIconSpan>
                                    <Icon type={'menu'} />
                                </MenuIconSpan>
                            </Menu.Item>
                        );
                    })}
                    <CreateButton>
                        <Button
                            icon="plus"
                            shape="circle-outline"
                            onClick={addBoard}
                            title={'Create A New Kanban'}
                        />
                    </CreateButton>
                </Menu>
            </Sider>
            <Content
                style={{
                    padding: 4,
                    height: 'calc(100vh - 45px)'
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
