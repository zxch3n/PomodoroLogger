import * as React from 'react';
import { Component, useEffect, useState } from 'react';
import { Button } from 'antd';


export interface Props {
    targetTime?: number; // date
    focusDuration: number,
    restDuration: number,
    isFocusing: boolean,
    isRunning: boolean;
    project: string;
    startTimer: () => any;
    stopTimer: () => any;
    clearTimer: () => any;
    timerFinished: () => any;
    continueTimer: () => any;
    setFocusDuration: (duration: number) => any,
    setRestDuration: (duration: number) => any
}


function to2digits(num: number) {
    if (num < 10) {
        return `0${num.toString()}`;
    }

    return num;
}


class Counter extends Component<Props> {
    state: {leftTime: string};
    interval?: any;
    constructor(props: Props) {
        super(props);
        this.state = {
            leftTime: '00:00'
        };
    }
    componentDidMount(): void {
        this.interval = setInterval(() => {
            const {targetTime, isRunning} = this.props;
            if (!targetTime) {
                this.setState({leftTime: '00:00'});
                return;
            }

            if (!isRunning) {
                return;
            }

            const now = new Date().getTime();
            const timeSpan = (targetTime - now);
            const sec = Math.floor(timeSpan / 1000);
            if (sec < 0) {
                this.setState({leftTime: '00:00'});
                this.onDone();
                return;
            }

            const leftTime = (`${to2digits(Math.floor(sec / 60))}:${to2digits(sec % 60)}`);
            this.setState({leftTime});
        }, 300);
    }

    componentWillUnmount(): void {
        if (this.interval) {
            clearInterval(this.interval);
        }
    }

    onStop = () => {
        if (this.props.isRunning){
            this.props.stopTimer();
        } else {
            this.props.continueTimer();
        }
    };

    onStart = () => {
        this.props.startTimer();
    };


    onClear = () => {
        this.props.clearTimer();
    };

    onDone = () => {
        this.props.timerFinished();
    };

    render() {
        const { leftTime } = this.state;

        return (
            <div>
                <span id="left-time-text">{leftTime}</span>
                <Button onClick={this.onStop} id="stop-timer-button">
                    {this.props.isRunning? 'Stop' : 'Continue'}
                </Button>
                <Button onClick={this.onStart} id="start-timer-button">Start</Button>
                <Button onClick={this.onClear}>Clear</Button>
            </div>
        );
    }
}


export default Counter;
