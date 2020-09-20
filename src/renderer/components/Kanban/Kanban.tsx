import React, { FunctionComponent, useCallback, useEffect, useRef, useState } from 'react';
import { KanbanActionTypes } from './action';
import { KanbanState, uiStateNames } from './reducer';
import { BoardActionTypes } from './Board/action';
import { message, Button, Form, Icon, Layout, Select, Switch } from 'antd';
import Board from './Board';
import styled from 'styled-components';
import { SearchBar } from './SearchBar';
import { Overview } from './Board/Overview';
import { LabelButton } from '../../style/form';
import backIcon from '../../../res/back.svg';
import { Label } from './style/Form';
import Hotkeys from 'react-hot-keys';
import shortid from 'shortid';
import { TimerActionTypes, TimerManager } from '../Timer/action';
import { isShallowEqualByKeys } from '../../utils';
import { thinScrollBar } from '../../style/scrollbar';
import { EditKanbanForm } from './BoardEditor';
import { PlayPauseButton } from './Board/PlayPauseButton';
import { Search } from '../../../components/common/Search/Search';

const { Option } = Select;

const Content = styled.main`
    margin: 0;
    overflow: auto;
    ::-webkit-scrollbar {
        width: 8px;
        height: 8px;
        background-color: #f5f5f5;
    }
    ::-webkit-scrollbar-thumb {
        border-radius: 8px;
        background-color: rgba(50, 50, 50, 0.3);
    }
    ::-webkit-scrollbar-track {
        border-radius: 8px;
        background-color: rgba(200, 200, 200, 0.5);
    }
`;

export const TextAreaContainer = styled.div`
    textarea {
        ${thinScrollBar}
    }
`;

const Title = styled.h1`
    user-select: none;
    max-width: calc(100vw - 380px);
    overflow: hidden;
    text-overflow: ellipsis;
    display: inline-block;
    margin: 0;
    font-size: 22px;
    vertical-align: bottom;
`;

const Header = styled.div`
    margin: 0 16px;
    position: relative;

    .header-right {
        position: absolute;
        top: 0;
        right: 0;
    }
`;

interface FormValue {
    name: string;
    description: string;
}

interface Props extends KanbanState, KanbanActionTypes, BoardActionTypes, TimerActionTypes {
    timerManager?: TimerManager;
    isFocusingOnChosenBoard: boolean;
    isTimerRunning: boolean;
}

export const Kanban: FunctionComponent<Props> = React.memo(
    (props: Props) => {
        const ref = useRef<Form>();
        const [visible, setVisible] = useState(false);
        const [showTable, setShowTable] = useState(false);
        const [editingBoardId, setEditingBoardId] = useState<string | undefined>('');
        const onShowTableChange = (value: boolean) => {
            setShowTable(value);
        };
        const valueHandler: (values: FormValue) => void = ({ name, description }: FormValue) => {
            if (editingBoardId === undefined) {
                props.addBoard(shortid.generate(), name, description);
            } else {
                // Edit board
                props.editBoard(editingBoardId, name, description);
            }
        };
        const handleSave = () => {
            if (ref.current === undefined) {
                return;
            }

            const form: any = ref.current.props.form;
            form.validateFields((err: Error, values: any) => {
                if (err) {
                    throw err;
                }

                valueHandler(values);
                setTimeout(() => form.resetFields(), 200);
                setVisible(false);
            });
        };
        const handleCancel = () => {
            setVisible(false);
        };
        useEffect(() => {
            props.fetchBoards();
        }, []);

        const showConfigById = (id?: string) => {
            setEditingBoardId(id);
            setVisible(true);
            if (ref.current === undefined) {
                return;
            }

            const form: any = ref.current.props.form;
            if (id === undefined) {
                form.setFieldsValue(
                    {
                        name: '',
                        description: '',
                    },
                    (err: Error) => {
                        if (err) throw err;
                    }
                );
            } else {
                const board = props.boards[id];
                form.setFieldsValue(
                    {
                        name: board.name,
                        description: board.description,
                    },
                    (err: Error) => {
                        if (err) throw err;
                    }
                );
            }
        };

        const addBoard = useCallback(() => {
            showConfigById();
        }, []);

        const showBoardSettingMenu = () => {
            showConfigById(props.kanban.chosenBoardId);
        };

        const onDelete = () => {
            if (props.kanban.chosenBoardId) {
                props.deleteBoard(props.kanban.chosenBoardId);
            } else if (props.kanban.configuringBoardId) {
                props.deleteBoard(props.kanban.configuringBoardId);
            }

            setVisible(false);
        };

        const boardNameValidator = (name: string) => {
            return -1 === Object.values(props.boards).findIndex((v) => v.name === name);
        };

        const goBack = () => {
            props.setChosenBoardId(undefined);
        };

        const choose = React.useCallback(() => {
            if (!props.kanban.chosenBoardId) {
                return;
            }

            props.focusOn(props.kanban.chosenBoardId);
            if (!props.timerManager) {
                return;
            }

            if (props.isFocusingOnChosenBoard && props.isTimerRunning) {
                message.info('Paused');
                props.timerManager.pause();
            } else {
                message.success('Start Focusing');
                props.timerManager.start();
            }
        }, [props.kanban.chosenBoardId, props.timerManager, props.isTimerRunning]);

        const onKeyDown = React.useCallback(
            (name: string) => {
                switch (name) {
                    case 'esc':
                        if (props.kanban.chosenBoardId) {
                            goBack();
                        } else {
                            props.changeAppTab('timer');
                        }
                        break;
                    case 'ctrl+n':
                        if (!props.kanban.chosenBoardId) {
                            addBoard();
                        }
                        break;
                }
            },
            [props.kanban.chosenBoardId, addBoard, goBack]
        );

        const onCollapsedChange = React.useCallback(
            (v: boolean) => {
                if (props.kanban.chosenBoardId) {
                    props.setCollapsed(props.kanban.chosenBoardId, v);
                }
            },
            [props.kanban.chosenBoardId]
        );

        return (
            <Layout style={{ padding: 4, height: 'calc(100vh - 45px)' }}>
                <Header>
                    <Hotkeys keyName={'ctrl+n'} onKeyDown={onKeyDown} />
                    {props.kanban.chosenBoardId ? (
                        <>
                            <Title>{props.boards[props.kanban.chosenBoardId].name}</Title>
                            <Button
                                style={{ paddingLeft: 10, paddingRight: 10, marginLeft: 10 }}
                                onClick={goBack}
                            >
                                <Icon component={backIcon} />
                            </Button>
                        </>
                    ) : (
                        <>
                            <Title>Kanban Boards Overview</Title>
                            <Button
                                style={{
                                    paddingLeft: 10,
                                    paddingRight: 10,
                                    margin: '0 4px 0 16px',
                                }}
                                onClick={addBoard}
                                id={'create-kanban-button'}
                            >
                                <Icon type={'plus'} />
                            </Button>

                            <Label>Sorted by:</Label>
                            <Select
                                value={props.kanban.sortedBy}
                                onChange={props.setSortedBy}
                                style={{
                                    width: 140,
                                }}
                            >
                                <Option value="recent">Last Visit</Option>
                                <Option value="alpha">Alphabet</Option>
                                {/* TODO: Due time */}
                                {/*<Option value="due">Due Time</Option>*/}
                                <Option value="spent">Spent Time</Option>
                                <Option value="remaining">Remaining Time</Option>
                            </Select>
                        </>
                    )}
                    <div className="header-right">
                        {props.kanban.chosenBoardId ? (
                            <>
                                <LabelButton>
                                    <Search setSearchStr={props.setSearchReg} />
                                    <div
                                        style={{
                                            display: 'flex',
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                            paddingTop: 6,
                                        }}
                                    >
                                        <label>Collapse View</label>
                                        <Switch
                                            checked={
                                                props.boards[props.kanban.chosenBoardId].collapsed
                                            }
                                            onChange={onCollapsedChange}
                                            size={'small'}
                                        />
                                    </div>
                                    <PlayPauseButton
                                        showPlay={
                                            !(props.isFocusingOnChosenBoard && props.isTimerRunning)
                                        }
                                        onClick={choose}
                                    />
                                    <Button
                                        shape={'circle'}
                                        icon={'setting'}
                                        onClick={showBoardSettingMenu}
                                    />
                                </LabelButton>
                            </>
                        ) : (
                            <LabelButton>
                                <label>Show Table: </label>
                                <Switch onChange={onShowTableChange} checked={showTable} />
                            </LabelButton>
                        )}
                    </div>
                </Header>
                <Content
                    style={{
                        padding: 4,
                        height: 'calc(100vh - 45px)',
                    }}
                >
                    {props.kanban.chosenBoardId === undefined ? (
                        <Overview showConfigById={showConfigById} showTable={showTable} />
                    ) : (
                        <Board
                            boardId={props.kanban.chosenBoardId}
                            key={props.kanban.chosenBoardId}
                        />
                    )}
                </Content>
                <EditKanbanForm
                    boardId={editingBoardId || ''}
                    wrappedComponentRef={ref as any}
                    visible={visible}
                    onSave={handleSave}
                    onCancel={handleCancel}
                    isCreating={!editingBoardId}
                    onDelete={onDelete}
                    nameValidator={boardNameValidator}
                />
            </Layout>
        );
    },
    (prevProps, nextProps) => {
        return isShallowEqualByKeys(
            prevProps,
            nextProps,
            uiStateNames.concat(['isFocusingOnChosenBoard', 'isTimerRunning'])
        );
    }
);
