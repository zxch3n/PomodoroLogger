import * as React from 'react';
import {Button, Input, Table} from 'antd'
import styled from 'styled-components';
import {actions, ActionCreatorTypes, TodoState} from './action'
import {useEffect} from 'react';


interface Props extends ActionCreatorTypes, TodoState{}
const columns = [
    {
        title: 'Title',
        dataIndex: 'title',
    },
    {
        title: 'Project',
        dataIndex: 'project'
    }
];

const TODO: React.FC<Props> = (props: Props) => {
    const onClick = ()=>{props.addItem('123', '345')};
    useEffect(()=>{
        props.fetchAll();
    }, []);
    return (
        <div>
            <Table columns={columns} dataSource={props.todoList}/>
            <Input />
            <Button onClick={onClick}/>
        </div>
    )
};

export default TODO;
