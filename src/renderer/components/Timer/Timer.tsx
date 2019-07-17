import React, { Component } from 'react';
import { Button, Divider, Icon, Progress } from 'antd';
import { ActionCreatorTypes } from '../TODO/action';
import { RootState } from '../../reducers';
import { FocusSelector } from './FocusSelector';
import { ApplicationSpentTime, Monitor, PomodoroRecord } from '../../monitor';
import { UsagePieChart } from '../Visualization/UsagePieChart';
import styled from 'styled-components';
import { remote } from 'electron';

const Layout = styled.div`
    max-width: 400px;
    margin: 10px auto;
`;

const ProgressContainer = styled.div`
    width: 100%;
    display: block;
    position: relative;
    padding: 10px;
    display: flex;
    justify-content: center;
`;

const ButtonRow = styled.div`
    width: 100%;
    max-width: 200px;
    display: flex;
    justify-content: space-around;
    font-size: 32px;
    margin: 0px auto 22px auto;
    color: darkslategray;

    i {
        transition: transform 0.2s;
    }

    i:hover {
        transform: scale(1.2);
    }
`;

const MoreInfo = styled.div``;

interface BasicProps {
    startTimer: () => any;
    stopTimer: () => any;
    clearTimer: () => any;
    timerFinished: (sessionData?: PomodoroRecord) => any;
    continueTimer: () => any;
    setFocusDuration: (duration: number) => any;
    setRestDuration: (duration: number) => any;
}

export interface Props extends BasicProps, ActionCreatorTypes, RootState {}

function to2digits(num: number) {
    if (num < 10) {
        return `0${num}`;
    }

    return num;
}

interface State {
    leftTime: string;
    screenShotUrl?: string;
    apps: { [appName: string]: ApplicationSpentTime };
    currentAppName?: string;
    percent: number;
    more: boolean;
}

class Timer extends Component<Props, State> {
    interval?: any;
    monitor?: Monitor;

    constructor(props: Props) {
        super(props);
        this.state = {
            leftTime: '00:00',
            percent: 0,
            apps: {},
            screenShotUrl: undefined,
            more: false
        };
    }

    activeWinListener = (appName: string, data: PomodoroRecord, imgUrl?: string) => {
        if (imgUrl) {
            this.setState({ screenShotUrl: imgUrl });
        }

        this.setState({
            apps: data.apps,
            currentAppName: appName
        });
    };

    componentDidMount(): void {
        this.interval = setInterval(this.updateLeftTime, 200);
        this.updateLeftTime();
        this.monitor = new Monitor(this.activeWinListener, 1000, 5000);
    }

    componentWillUnmount(): void {
        if (this.interval) {
            clearInterval(this.interval);
        }
    }

    updateLeftTime = () => {
        const { targetTime, isRunning } = this.props.timer;
        if (!targetTime) {
            this.setState({ leftTime: '00:00' });
            return;
        }

        if (!isRunning) {
            return;
        }

        const now = new Date().getTime();
        const timeSpan = targetTime - now;
        const sec = Math.floor(timeSpan / 1000 + 0.5);
        if (sec < 0) {
            this.onDone();
            return;
        }

        const leftTime = `${to2digits(Math.floor(sec / 60))}:${to2digits(sec % 60)}`;
        const percent =
            timeSpan /
            60 /
            1000 /
            (this.props.timer.isFocusing
                ? this.props.timer.focusDuration
                : this.props.timer.restDuration);
        this.setState({ leftTime, percent });
    };

    onStopResumeOrStart = () => {
        if (this.state.percent === 0) {
            return this.onStart();
        }

        if (this.props.timer.isRunning) {
            this.props.stopTimer();
            if (this.monitor) {
                this.monitor.stop();
            }
        } else {
            this.props.continueTimer();
            if (this.monitor) {
                this.monitor.resume();
            }
        }
    };

    onStart = () => {
        this.props.startTimer();
        if (this.monitor) {
            this.monitor.start();
        }

        this.updateLeftTime();
    };

    private clearStat = () => {
        this.setState({
            apps: {},
            currentAppName: undefined,
            screenShotUrl: undefined,
            leftTime: '00:00',
            percent: 0
        });
    };

    onClear = () => {
        this.props.clearTimer();
        if (this.monitor) {
            this.monitor.stop();
            this.monitor.clear();
        }

        this.clearStat();
    };

    onDone = () => {
        if (this.props.timer.isFocusing) {
            if (this.monitor) {
                // TODO: Alert user?
                this.monitor.stop();
                this.props.timerFinished(this.monitor.sessionData);
            }
        } else {
            if (this.monitor) {
                // TODO: Alert user?
                this.monitor.start();
            }

            this.props.timerFinished();
        }

        this.clearStat();
    };

    toggleMore = () => {
        this.setState(state => {
            // TODO: need better control
            const more = !state.more;
            const win = remote.getCurrentWindow();
            const [w, h] = win.getSize();
            if (more) {
                win.setSize(w, h + 300, true);
            } else {
                win.setSize(w, h - 300, true);
            }

            return { more };
        });
    };

    progressFormat = () => this.state.leftTime;

    render() {
        const { leftTime, percent, more } = this.state;
        const { isRunning } = this.props.timer;

        return (
            <Layout>
                <ProgressContainer>
                    <Progress
                        type="circle"
                        strokeColor={{
                            '0%': '#108ee9',
                            '100%': '#87d068'
                        }}
                        percent={percent}
                        format={this.progressFormat}
                        width={300}
                        style={{
                            margin: '0 auto'
                        }}
                    />
                    <span style={{ display: 'none' }} id="left-time-text">
                        {leftTime}
                    </span>
                </ProgressContainer>

                <ButtonRow>
                    {isRunning ? (
                        <Icon
                            type="pause-circle"
                            title="Pause"
                            onClick={this.onStopResumeOrStart}
                        />
                    ) : (
                        <Icon type="play-circle" title="Start" onClick={this.onStopResumeOrStart} />
                    )}
                    <Icon type="close-circle" title="Clear" onClick={this.onClear} />
                    <Icon type="more" title="Show More" onClick={this.toggleMore} />
                </ButtonRow>

                <FocusSelector {...this.props} />

                <MoreInfo
                    style={{
                        display: more ? 'block' : 'none',
                        margin: '10px auto'
                    }}
                >
                    <h2>Screen Shot</h2>
                    <img src={this.state.screenShotUrl} height={100} width={100} />
                    <p id="current-using-app-name">{this.state.currentAppName}</p>

                    <Divider />

                    <h2>Application Usage</h2>
                    <UsagePieChart
                        rows={Object.values(this.state.apps).map(row => ({
                            name: row.appName,
                            value: row.spentTimeInHour * 60
                        }))}
                        unit={'Min'}
                        size={100}
                    />
                </MoreInfo>
            </Layout>
        );
    }
}

export default Timer;
