import { TimerState } from './action';
import { Button, List, Popover, Row } from 'antd';
import { PomodoroNumView } from './PomodoroNumView';
import React from 'react';
import styled from 'styled-components';

const Mask = styled.div`
    left: 0;
    top: 0;
    height: 100%;
    width: 100%;
    position: fixed;
    background-color: #dd5339;
    text-align: center;
    color: white !important;
    z-index: 1000;
    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: column;
`;

const MaskInnerContainer = styled.div`
    max-width: 500px;
`;

const ProjectName = styled.h1`
    font-size: 4em;
    transition: color 0.4s;
    color: black;
    cursor: pointer;
    line-height: 1em;
    margin: 0;
    :hover {
        color: white;
    }
`;

const ListItem = styled.span`
    cursor: pointer;
    color: #0074d9;
    transition: color 0.3s;
    :hover {
        color: #000088;
    }
`;

export interface MaskProps {
    showMask: boolean;
    onCancel: () => void;
    timer: TimerState;
    onStart: () => void;
    pomodoroNum: number;
    setProject?: (project: string) => any;
    projects?: string[];
}

export const TimerMask = (props: MaskProps) => {
    const { projects = [], setProject = () => {} } = props;
    const renderItem = (item: string) => {
        const onClick = (event: React.MouseEvent) => {
            setProject(item);
            event.stopPropagation();
            event.preventDefault();
        };
        return (
            <List.Item>
                <ListItem onClick={onClick}>{item}</ListItem>
            </List.Item>
        );
    };

    const content = projects.length ? (
        <List size="small" bordered={true} dataSource={projects} renderItem={renderItem} />
    ) : (
        undefined
    );

    const onProjectClick = (event: React.MouseEvent) => {
        event.stopPropagation();
    };
    const onStartClick = (event: React.MouseEvent) => {
        event.stopPropagation();
        props.onStart();
    };

    return (
        <Mask style={{ display: props.showMask ? 'flex' : 'none' }} onClick={props.onCancel}>
            <MaskInnerContainer>
                <Row onClick={onProjectClick}>
                    {props.timer.isFocusing ? (
                        <Popover title="Project Name" content={content}>
                            <ProjectName>{props.timer.project}</ProjectName>
                        </Popover>
                    ) : (
                        <ProjectName>Resting</ProjectName>
                    )}
                    <h1 style={{ color: 'white', fontSize: '3.5em', marginBottom: '1em' }}>
                        Session Finished
                    </h1>
                </Row>
                <Button size="large" onClick={onStartClick}>
                    Start {props.timer.isFocusing ? 'Resting' : 'Focusing'}
                </Button>
                <Row style={{ marginTop: '2em' }}>
                    <h1 style={{ color: 'white' }}>Today Pomodoros</h1>
                    <PomodoroNumView num={props.pomodoroNum} color={'#f9ec52'} showNum={false} />
                </Row>
            </MaskInnerContainer>
        </Mask>
    );
};
