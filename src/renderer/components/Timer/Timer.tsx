import React, { Component, Fragment } from 'react';
import { Divider, Icon, Progress, Row, Col, Layout, message } from 'antd';
import { ActionCreatorTypes as ProjectActionTypes, ProjectItem } from '../Project/action';
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
import { getTodaySessions } from '../../monitor/sessionManager';
import { finished } from 'stream';
import { TodoList } from '../Project/Project';
const { Sider } = Layout;

const ProgressTextContainer = styled.div`
    padding: 12px;
    text-align: center;
    transform: translateY(0.3em);
`;

const TimerLayout = styled.div`
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

const MoreInfo = styled.div`
    margin: 10px auto;
`;

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
    currentAppName?: string;
    percent: number;
    more: boolean;
    pomodorosToday: PomodoroRecord[];
}

class Timer extends Component<Props, State> {
    interval?: any;
    monitor?: Monitor;

    constructor(props: Props) {
        super(props);
        this.state = {
            leftTime: this.defaultLeftTime(),
            percent: 0,
            screenShotUrl: undefined,
            more: false,
            pomodorosToday: []
        };
    }

    activeWinListener = (appName: string, data: PomodoroRecord, imgUrl?: string) => {
        if (imgUrl) {
            this.setState({ screenShotUrl: imgUrl });
        }

        this.setState({
            currentAppName: appName
        });
    };

    componentDidMount(): void {
        this.interval = setInterval(this.updateLeftTime, 500);
        this.updateLeftTime();
        this.monitor = new Monitor(
            this.activeWinListener,
            1000,
            this.props.timer.screenShotInterval
        );

        getTodaySessions().then(finishedSessions => {
            this.setState({ pomodorosToday: finishedSessions });
        });
    }

    componentWillUnmount(): void {
        if (this.interval) {
            clearInterval(this.interval);
        }
    }

    updateLeftTime = () => {
        const { targetTime, isRunning } = this.props.timer;
        if (!isRunning) {
            return;
        }

        if (!targetTime) {
            this.setState({
                leftTime: this.defaultLeftTime(this.props.timer.isFocusing)
            });
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

    onDone = async () => {
        if (this.props.timer.isFocusing) {
            if (this.monitor) {
                const finishedSessions = await getTodaySessions();
                const thisSession = this.monitor.sessionData;
                finishedSessions.push(thisSession);

                const notification = new remote.Notification({
                    title: 'Focusing finished. Start resting.',
                    body: `Completed ${finishedSessions.length} sessions today. \n\n`,
                    icon: nativeImage.createFromPath(`${__dirname}/${AppIcon}`)
                });
                notification.show();
                this.props.timerFinished(thisSession, this.props.timer.project);
                this.monitor.stop();
                this.monitor.clear();
                this.setState({ pomodorosToday: finishedSessions });
            } else {
                this.props.timerFinished();
            }
        } else {
            const notification = new remote.Notification({
                title: 'Focusing finished. Start resting.',
                body: `Completed ${this.state.pomodorosToday.length} sessions today. \n\n`,
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
        if (this.props.timer.isRunning || this.state.percent !== 0) {
            message.warn('Cannot switch mode when timer is running');
            return;
        }

        this.props.switchFocusRestMode();
        this.clearStat();
    };

    progressFormat = () => {
        return (
            <ProgressTextContainer>
                <div style={{ marginBottom: 12 }} key="leftTime">
                    {this.state.leftTime}
                </div>
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
        const { leftTime, percent, more, pomodorosToday } = this.state;
        const { isRunning } = this.props.timer;
        const apps: { [appName: string]: { appName: string; spentHours: number } } = {};
        const projectItem: ProjectItem | undefined = this.props.timer.project
            ? this.props.project.projectList[this.props.timer.project]
            : undefined;
        for (const pomodoro of pomodorosToday) {
            for (const appName in pomodoro.apps) {
                if (!(appName in apps)) {
                    apps[appName] = {
                        appName,
                        spentHours: 0
                    };
                }

                apps[appName].spentHours += pomodoro.apps[appName].spentTimeInHour;
            }
        }

        return (
            <Layout style={{ backgroundColor: 'white' }}>
                {projectItem ? (
                    <Sider
                        breakpoint="md"
                        collapsedWidth="0"
                        theme="light"
                        style={{ border: '1px solid rgb(240, 240, 240)', borderRadius: 8 }}
                    >
                        <div style={{ padding: 12 }}>
                            <h1 style={{ fontSize: '2em', paddingLeft: 12 }}>
                                {this.props.timer.project}
                            </h1>
                            <TodoList {...this.props} project={projectItem} />
                        </div>
                    </Sider>
                ) : (
                    undefined
                )}
                <TimerLayout>
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
                            <Icon
                                type="play-circle"
                                title="Start"
                                onClick={this.onStopResumeOrStart}
                            />
                        )}
                        <Icon type="close-circle" title="Clear" onClick={this.onClear} />
                        <Icon type="more" title="Show More" onClick={this.toggleMode} />
                    </ButtonRow>

                    <FocusSelector {...this.props} />

                    <MoreInfo>
                        <h2>Pomodoros Today</h2>
                        <Row style={{ padding: 12 }}>
                            <Col span={4} style={{ lineHeight: '1em' }}>
                                <h4>{this.state.pomodorosToday.length}</h4>
                            </Col>
                            <Col span={20} style={{ color: 'red' }}>
                                {Array.from(Array(this.state.pomodorosToday.length).keys()).map(
                                    v => (
                                        <svg
                                            key={v}
                                            width="1em"
                                            height="1em"
                                            fill="currentColor"
                                            focusable="false"
                                            viewBox="0 0 100 100"
                                            style={{ margin: '0.1em' }}
                                        >
                                            <circle r={50} cx={50} cy={50} color="red">
                                                <title>
                                                    {`Completed ${this.state.pomodorosToday.length} pomodoros today`}
                                                </title>
                                            </circle>
                                        </svg>
                                    )
                                )}
                            </Col>
                        </Row>
                    </MoreInfo>

                    <MoreInfo
                        style={{
                            display: more ? 'block' : 'none'
                        }}
                    >
                        <h2>Application Usage</h2>
                        <UsagePieChart
                            rows={Object.values(apps).map(row => ({
                                name: row.appName,
                                value: row.spentHours * 60
                            }))}
                            unit={'Min'}
                            size={100}
                        />

                        <Divider />

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
                    </MoreInfo>
                </TimerLayout>
            </Layout>
        );
    }
}

export default Timer;
