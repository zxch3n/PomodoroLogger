import * as React from 'react';
import {Button, Input, Table} from 'antd'
import styled from 'styled-components';
import {actions, ActionCreatorTypes, ProjectState} from './action'
import {useEffect} from 'react';


interface Props extends ActionCreatorTypes, ProjectState{}
const columns = [
    {
        title: 'Project Name',
        dataIndex: 'name',
    },
    {
        title: 'Hours',
        dataIndex: 'spentHours'
    }
];

const Project: React.FC<Props> = (props: Props) => {
    const onClick = ()=>{props.addItem('name')};
    useEffect(()=>{
        props.fetchAll();
    }, []);
    return (
        <div>
            <Table columns={columns} dataSource={Object.values(props.projectList)}/>
            <Input />
            <Button onClick={onClick}/>
        </div>
    )
};

export default Project;
