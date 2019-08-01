import React, { useEffect, useState } from 'react';
import { Checkbox, Dropdown, Icon, Input, List, Menu, message, Popconfirm, Table } from 'antd';
import { ProjectActionTypes, ProjectItem, ProjectState } from './action';
import { TodoItem } from '../TODO/action';
import { CheckboxChangeEvent } from 'antd/lib/checkbox';
import styled from 'styled-components';

const Container = styled.div`
    padding: 24px;
`;

interface EditableProps {
    record: any;
    value: any;
    editing: boolean;
    onChange: (value: any) => void;
    children?: React.ReactNodeArray;
}

const ListItem = styled(List.Item)`
    :hover {
        background-color: rbga(20, 20, 220, 0.1);
    }
`;

const EditableCell: React.FunctionComponent<EditableProps> = (props: EditableProps) => {
    const { editing, value, onChange, children } = props;
    return <td>{editing ? <Input value={value} onChange={onChange} /> : children}</td>;
};

const defaultRecord = {
    name: '',
    spentHours: 0,
    todoList: {},
    applicationSpentTime: {}
};

interface TodoListProps extends ProjectActionTypes {
    project: ProjectItem;
}

export const TodoList: React.FC<TodoListProps> = ({
    project,
    addTodoItem,
    setTodoFinished,
    removeTodoItem
}: TodoListProps) => {
    const [newTodo, setNewTodo] = useState('');
    const todos = Object.values(project.todoList);
    const render = (item: TodoItem) => {
        const onCheck = (v: CheckboxChangeEvent) => {
            setTodoFinished(project.name, item._id, v.target.checked);
        };

        const onDelete = () => {
            removeTodoItem(project.name, item._id);
        };

        const menu = (
            <Menu>
                <Menu.Item key="0">Set Expiry Date</Menu.Item>
                <Menu.Item key="1">Set Alert</Menu.Item>
                <Menu.Item key="2">More Info</Menu.Item>
                <Menu.Divider />
                <Menu.Item key="3" onClick={onDelete}>
                    <span style={{ color: 'red' }}>Delete</span>
                </Menu.Item>
            </Menu>
        );

        return (
            <ListItem>
                <Checkbox onChange={onCheck} checked={item.isFinished}>
                    <span style={{ color: item.isFinished ? 'rgb(180, 180, 180)' : undefined }}>
                        {item.isFinished ? <del>{item.title}</del> : item.title}
                    </span>
                </Checkbox>

                <Dropdown overlay={menu}>
                    <span style={{ position: 'absolute', right: 12, cursor: 'pointer' }}>
                        <Icon type="more" />
                    </span>
                </Dropdown>
            </ListItem>
        );
    };

    const onKeyDown = (event: any) => {
        if (event.key === 'Enter' || event.which === 13) {
            if (newTodo.length === 0) {
                message.warn('Todo title cannot be empty');
                return;
            }

            addTodoItem(project.name, newTodo);
            setNewTodo('');
            event.preventDefault();
            event.stopPropagation();
            return -1;
        }
    };

    const onChange = (event: any) => setNewTodo(event.target.value);
    return (
        <div>
            <List size={'small'} bordered={true} dataSource={todos} renderItem={render} />
            <List.Item>
                <Input
                    placeholder={'New TODO'}
                    onKeyDown={onKeyDown}
                    value={newTodo}
                    onChange={onChange}
                />
            </List.Item>
        </div>
    );
};

interface Props extends ProjectActionTypes, ProjectState {}
const Project: React.FC<Props> = (props: Props) => {
    const [editingRowName, setEditingRowName] = useState('');
    const [editingRecordRow, setEditingRecordRow] = useState(defaultRecord);

    const save = () => {
        if (editingRowName === 'New Project') {
            // Add new project
            props.addItem(editingRecordRow.name);
        } else {
            // Change old project
            if (editingRecordRow.name === 'New Project') {
                message.warn('Project name cannot be "New Project"');
            }

            props.setName(editingRowName, editingRecordRow.name);
        }

        setEditingRowName('');
        setEditingRecordRow(defaultRecord);
    };

    let columns = [
        {
            title: 'Project Name',
            dataIndex: 'name',
            editable: true,
            key: 'name'
        },
        {
            title: 'Hours',
            dataIndex: 'spentHours',
            key: 'spentHours',
            editable: false
        },
        {
            title: 'Todos',
            dataIndex: 'todoNum',
            key: 'todoNum',
            editable: false
        },
        {
            title: 'Operations',
            dataIndex: 'operation',
            key: 'operation',
            editable: false,
            render: (text: any, record: ProjectItem, index: number) => {
                if (editingRowName) {
                    if (editingRowName === record.name) {
                        return (
                            <span>
                                <a style={{ marginRight: 12 }} onClick={save}>
                                    Save
                                </a>
                            </span>
                        );
                    }

                    return undefined;
                }
                const del = () => {
                    props.removeItem(record.name);
                };
                const onClick = () => {
                    setEditingRowName(record.name);
                    setEditingRecordRow(record);
                };
                if (index === projects.length - 1) {
                    return (
                        <span>
                            <a style={{ marginRight: 12 }} onClick={onClick}>
                                New Project
                            </a>
                        </span>
                    );
                }

                return (
                    <span>
                        <a style={{ marginRight: 12 }} onClick={onClick}>
                            Edit
                        </a>
                        <Popconfirm title={'Sure to delete?'} onConfirm={del}>
                            <a>Delete</a>
                        </Popconfirm>
                    </span>
                );
            }
        }
    ];

    columns = columns.map(col => {
        if (!col.editable) {
            return col;
        }

        return {
            ...col,
            onCell: (record: ProjectItem): EditableProps => {
                if (editingRowName && record.name === editingRowName) {
                    return {
                        record,
                        // @ts-ignore
                        value: editingRecordRow[col.dataIndex],
                        onChange: (event: any) => {
                            const value = event.target.value;
                            setEditingRecordRow(state => {
                                return { ...state, [col.dataIndex]: value };
                            });
                        },
                        editing: true
                    };
                }

                return {
                    record,
                    // @ts-ignore
                    value: record[col.dataIndex],
                    onChange: value => {},
                    editing: false
                };
            }
        };
    });

    const todoRowRender = (record: ProjectItem, index: number, indent: any, expand: boolean) => {
        if (!expand || record.name === 'New Project') {
            return undefined;
        }

        return <TodoList project={record} {...props} />;
    };

    useEffect(() => {
        props.fetchAll();
    }, []);

    const projects: (ProjectItem & { todoNum?: string })[] = Object.values(props.projectList);
    for (const project of projects) {
        project.spentHours = Math.floor(project.spentHours * 100) / 100;
        const todos = Object.values(project.todoList);
        const unfinishedNum = todos.filter(v => !v.isFinished).length;
        project.todoNum = `${unfinishedNum} / ${todos.length}`;
    }

    // @ts-ignore
    projects.push({ ...defaultRecord, name: 'New Project', spentHours: undefined });
    return (
        <Container>
            <Table
                rowKey={'name'}
                components={{ body: { cell: EditableCell } }}
                columns={columns}
                dataSource={projects}
                pagination={false}
                expandedRowRender={todoRowRender}
                defaultExpandAllRows={false}
            />
        </Container>
    );
};

export default Project;
