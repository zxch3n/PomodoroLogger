import React from 'react';
import { TimerActionTypes, TimerState } from '../Timer/action';
import styled from 'styled-components';
import { Button, Icon, message, notification, Popconfirm, Slider, Switch } from 'antd';
import { deleteAllUserData, exportDBData } from '../../monitor/sessionManager';
import { writeFile } from 'fs';
import { remote, app } from 'electron';
import { promisify } from 'util';

const dialog = remote.dialog;

const Container = styled.div`
    padding: 12px 36px;
`;

const SliderContainer = styled.div`
    padding: 4px 24px;
`;

const ButtonWrapper = styled.div`
    margin: 0.6em;
`;

const marks = {
    25: '25min',
    35: '35min',
    45: '45min'
};

const restMarks = {
    5: '5min',
    10: '10min',
    15: '15min',
    20: '20min'
};

interface Props extends TimerState, TimerActionTypes {}
export const Setting: React.FunctionComponent<Props> = (props: Props) => {
    const onChangeFocus = React.useCallback((v: number | [number, number]) => {
        if (v instanceof Array) {
            return;
        }

        props.setFocusDuration(v * 60);
    }, []);

    const onChangeRest = React.useCallback((v: number | [number, number]) => {
        if (v instanceof Array) {
            return;
        }

        props.setRestDuration(v * 60);
    }, []);

    const switchScreenshot = React.useCallback((v: boolean) => {
        if (v) {
            props.setScreenShotInterval(5000);
        } else {
            props.setScreenShotInterval(undefined);
        }

        notification.open({
            message: 'Restart App to Apply Changes',
            description: 'Screenshot setting change needs restart to be applied',
            duration: 0,
            icon: <Icon type="warning" />
        });
    }, []);

    const setStartOnBoot = React.useCallback((v: boolean) => {
        props.setStartOnBoot(v);
        if (v) {
            app.setLoginItemSettings({
                openAtLogin: true,
                openAsHidden: true
            });
        } else {
            app.setLoginItemSettings({
                openAtLogin: false
            });
        }
    }, []);

    function onDeleteData() {
        deleteAllUserData().then(() => {
            message.info('All user data is removed. Pomodoro needs to restart.');
        });
    }

    async function onExportingData() {
        const { canceled, filePath } = await dialog.showSaveDialog(remote.getCurrentWindow(), {
            title: 'Pomodoro Data Export',
            defaultPath: 'pomodoroDB.dat',
            filters: [
                {
                    name: 'Data File',
                    extensions: ['dat']
                }
            ]
        });

        if (!canceled && filePath) {
            console.log(filePath);
            const data = await exportDBData();
            await promisify(writeFile)(filePath, JSON.stringify(data), { encoding: 'utf-8' });
            message.success('Data Exported');
        }
    }

    return (
        <Container>
            <h4>Focus Duration</h4>
            <SliderContainer>
                <Slider
                    marks={marks}
                    step={1}
                    min={process.env.NODE_ENV === 'production' ? 15 : 2}
                    max={60}
                    value={props.focusDuration / 60}
                    onChange={onChangeFocus}
                />
            </SliderContainer>

            <h4>Rest Duration</h4>
            <SliderContainer>
                <Slider
                    marks={restMarks}
                    step={1}
                    min={process.env.NODE_ENV === 'production' ? 5 : 1}
                    max={20}
                    value={props.restDuration / 60}
                    onChange={onChangeRest}
                />
            </SliderContainer>

            <h4>Start On Boot </h4>
            <ButtonWrapper>
                <Switch onChange={setStartOnBoot} checked={props.startOnBoot} />
            </ButtonWrapper>

            {/*<h4>Idle Detection (Need Screenshot) </h4>*/}
            {/*<ButtonWrapper>*/}
            {/*    <Switch onChange={switchScreenshot} checked={!!props.screenShotInterval} />*/}
            {/*</ButtonWrapper>*/}

            <h4>Data Management</h4>
            <ButtonWrapper>
                <Button onClick={onExportingData}>Export Data</Button>
                <br />
            </ButtonWrapper>
            <ButtonWrapper>
                <Popconfirm title={'Sure to delete?'} onConfirm={onDeleteData}>
                    <Button type="danger">Delete All Data</Button>
                </Popconfirm>
            </ButtonWrapper>
        </Container>
    );
};
