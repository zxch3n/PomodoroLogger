import React, { useEffect } from 'react';
import { Button, Input, Table } from 'antd';
import styledComponents from 'styled-components';
import { actions, TodoActionTypes, TodoState } from './action';

interface Props extends TodoActionTypes, TodoState {}
const columns = [
    {
        title: 'Title',
        dataIndex: 'title'
    },
    {
        title: 'Project',
        dataIndex: 'project'
    },
    {
        title: 'id',
        dataIndex: '_id'
    },
    {
        title: 'Content',
        dataIndex: 'content'
    }
];

const TODO: React.FC<Props> = (props: Props) => {
    const onClick = () => {
        props.addItem('123', '345');
    };
    useEffect(() => {
        props.fetchAll();
    }, []);
    return (
        <div>
            <Table columns={columns} dataSource={props.todoList} />
            <Input />
            <Button onClick={onClick} />
        </div>
    );
};

export default TODO;
