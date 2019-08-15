import React, { useState } from 'react';
import { TimerActionTypes, TimerState } from '../Timer/action';
import styled from 'styled-components';
import { Slider, Switch, notification, Icon, Button } from 'antd';

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
    const onChangeFocus = (v: number | [number, number]) => {
        if (v instanceof Array) {
            return;
        }

        props.setFocusDuration(v * 60);
    };

    const onChangeRest = (v: number | [number, number]) => {
        if (v instanceof Array) {
            return;
        }

        props.setRestDuration(v * 60);
    };

    const switchScreenshot = (v: boolean) => {
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
    };

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

            <h4>Idle Detection (Need Screenshot) </h4>
            <Switch onChange={switchScreenshot} checked={!!props.screenShotInterval} />

            <h4>Data Management</h4>
            <ButtonWrapper>
                <Button>Export Data</Button>
                <br />
            </ButtonWrapper>
            <ButtonWrapper>
                <Button type="danger">Delete All Data</Button>
            </ButtonWrapper>
        </Container>
    );
};
