import React, { Component, Fragment } from 'react';
import { Divider, Icon, Progress } from 'antd';
import { ActionCreatorTypes as ProjectActionTypes } from '../Project/action';
import { ActionCreatorTypes as ThisActionTypes } from './action';
import { RootState } from '../../reducers';
import { FocusSelector } from './FocusSelector';
import { ApplicationSpentTime, Monitor, PomodoroRecord } from '../../monitor';
import { UsagePieChart } from '../Visualization/UsagePieChart';
import styled from 'styled-components';
import { remote, nativeImage } from 'electron';
import RestIcon from '../../../res/rest.svg';
import WorkIcon from '../../../res/work.svg';
import AppIcon from '../../../res/TimeLogger.png';
import { setTrayImageWithMadeIcon } from './iconMaker';

const ProgressTextContainer = styled.div`
    padding: 12px;
    text-align: center;
    transform: translateY(0.3em);
`;

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

export interface Props extends ThisActionTypes, ProjectActionTypes, RootState {}

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
            leftTime: this.defaultLeftTime(),
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
        this.monitor = new Monitor(
            this.activeWinListener,
            1000,
            this.props.timer.screenShotInterval
        );
    }

    componentWillUnmount(): void {
        if (this.interval) {
            clearInterval(this.interval);
        }
    }

    updateLeftTime = () => {
        const { targetTime, isRunning } = this.props.timer;
        if (!targetTime) {
            this.setState((_, props) => ({
                leftTime: this.defaultLeftTime(props.timer.isFocusing)
            }));
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
            100 -
            timeSpan /
                10 /
                (this.props.timer.isFocusing
                    ? this.props.timer.focusDuration
                    : this.props.timer.restDuration);
        if (leftTime.slice(0, 2) !== this.state.leftTime.slice(0, 2)) {
            setTrayImageWithMadeIcon(leftTime.slice(0, 2));
        }

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

    private defaultLeftTime = (isFocusing?: boolean) => {
        if (isFocusing === undefined) {
            // tslint:disable-next-line:no-parameter-reassignment
            isFocusing = this.props.timer.isFocusing;
        }

        const duration = isFocusing
            ? this.props.timer.focusDuration
            : this.props.timer.restDuration;
        return `${to2digits(duration / 60)}:00`;
    };

    private clearStat = () => {
        setTrayImageWithMadeIcon(undefined);
        this.setState((_, props) => ({
            apps: {},
            currentAppName: undefined,
            screenShotUrl: undefined,
            leftTime: this.defaultLeftTime(props.timer.isFocusing),
            percent: 0
        }));
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
                const notification = new remote.Notification({
                    title: 'Focusing finished. Start resting.',
                    // TODO: session info
                    body: `Completed ${5} sessions today. \n\n`,
                    icon: nativeImage.createFromPath(`${__dirname}/${AppIcon}`)
                });
                notification.show();
                this.props.timerFinished(this.monitor.sessionData, this.props.timer.project);
                this.monitor.stop();
                this.monitor.clear();
            } else {
                this.props.timerFinished();
            }
        } else {
            const notification = new remote.Notification({
                title: 'Focusing finished. Start resting.',
                // TODO: session info
                body: `Completed ${5} sessions today. \n\n`,
                icon: nativeImage.createFromPath(`${__dirname}/${AppIcon}`)
            });
            notification.show();
            this.monitor = new Monitor(
                this.activeWinListener,
                1000,
                this.props.timer.screenShotInterval
            );
            this.monitor.start();
            this.props.timerFinished();
        }

        this.clearStat();
    };

    toggleMode = () => {
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

    switchMode = () => {
        this.props.switchFocusRestMode();
    };

    progressFormat = () => {
        return (
            <ProgressTextContainer>
                <div style={{ marginBottom: 12 }}>{this.state.leftTime}</div>
                <div style={{ fontSize: '0.6em', cursor: 'pointer' }} onClick={this.switchMode}>
                    {this.props.timer.isFocusing ? (
                        <Icon component={WorkIcon} />
                    ) : (
                        <Icon component={RestIcon} />
                    )}
                </div>
            </ProgressTextContainer>
        );
    };

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
                    <Icon type="more" title="Show More" onClick={this.toggleMode} />
                </ButtonRow>

                <FocusSelector {...this.props} />

                <MoreInfo
                    style={{
                        display: more ? 'block' : 'none',
                        margin: '10px auto'
                    }}
                >
                    <h2>Screen Shot</h2>
                    {this.state.screenShotUrl ? (
                        <Fragment>
                            <img src={this.state.screenShotUrl} height={100} width={100} />
                            <p id="current-using-app-name">{this.state.currentAppName}</p>
                        </Fragment>
                    ) : (
                        undefined
                    )}

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
