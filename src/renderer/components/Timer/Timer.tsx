import React, { Component } from 'react';
import { Button, Divider, Icon, Layout, message, Row } from 'antd';
import Progress from './Progress';
import { ProjectActionTypes, ProjectItem } from '../Project/action';
import { TimerActionTypes as ThisActionTypes } from './action';
import { RootState } from '../../reducers';
import { FocusSelector } from './FocusSelector';
import { Monitor } from '../../monitor';
import styled from 'styled-components';
import { BrowserWindow, nativeImage, remote } from 'electron';
import RestIcon from '../../../res/rest.svg';
import WorkIcon from '../../../res/work.svg';
import AppIcon from '../../../res/TimeLogger.png';
import { setTrayImageWithMadeIcon } from './iconMaker';
import { getTodaySessions } from '../../monitor/sessionManager';
import { TodoList } from '../Project/Project';
import { getIdFromProjectName } from '../../dbs';
import { PomodoroDualPieChart } from '../Visualization/DualPieChart';
import { PomodoroNumView } from './PomodoroNumView';
import { PomodoroRecord } from '../../monitor/type';

const { Sider } = Layout;
const setMenuItems: (...args: any) => void = remote.getGlobal('setMenuItems');

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

const ProgressTextContainer = styled.div`
    padding: 12px;
    text-align: center;
    transform: translateY(0.4em);
`;

const TimerLayout = styled.div`
    max-width: 1080px;
    margin: 10px auto;
`;

const ProgressContainer = styled.div`
    max-width: 800px;
    margin: 0 auto;
    width: 100%;
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
    margin: 0 auto 22px auto;
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

function joinDict<T>(maps: { [key: string]: T }[]): { [key: string]: T } {
    const dict: { [key: string]: T } = {};
    for (const d of maps) {
        for (const key in d) {
            dict[key] = d[key];
        }
    }

    return dict;
}

interface State {
    leftTime: string;
    currentAppName?: string;
    percent: number;
    more: boolean;
    pomodorosToday: PomodoroRecord[];
    showMask: boolean;
}

class Timer extends Component<Props, State> {
    interval?: any;
    monitor?: Monitor;
    win?: BrowserWindow;
    mainDiv: React.RefObject<HTMLDivElement>;

    constructor(props: Props) {
        super(props);
        this.state = {
            leftTime: '',
            percent: 0,
            more: false,
            pomodorosToday: [],
            showMask: false
        };
        this.mainDiv = React.createRef<HTMLDivElement>();
    }

    activeWinListener = (appName: string, data: PomodoroRecord, imgUrl?: string) => {
        this.setState({
            currentAppName: appName
        });
    };

    componentDidMount(): void {
        this.interval = setInterval(this.updateLeftTime, 500);
        this.win = remote.getCurrentWindow();
        this.updateLeftTime();
        getTodaySessions().then(finishedSessions => {
            this.setState({ pomodorosToday: finishedSessions });
        });

        this.addMenuItems();
    }

    addMenuItems(): void {
        setMenuItems([
            {
                label: 'Start Focusing',
                type: 'normal',
                click: () => {
                    if (!this.props.timer.isFocusing) {
                        this.switchMode();
                    }

                    if (!this.props.timer.isRunning) {
                        this.onStopResumeOrStart();
                    }
                }
            },
            {
                label: 'Start Resting',
                type: 'normal',
                click: () => {
                    if (this.props.timer.isFocusing) {
                        this.switchMode();
                    }

                    if (!this.props.timer.isRunning) {
                        this.onStopResumeOrStart();
                    }
                }
            },
            {
                label: 'Stop',
                type: 'normal',
                click: () => {
                    if (this.props.timer.isRunning) {
                        this.onStopResumeOrStart();
                    }
                }
            },
            {
                label: 'Clear',
                type: 'normal',
                click: this.onClear
            }
        ]);
    }

    componentWillUnmount(): void {
        this.onClear();
        if (this.interval) {
            clearInterval(this.interval);
        }
    }

    updateLeftTime = () => {
        // TODO: refactor this and add small tests
        const { targetTime, isRunning } = this.props.timer;
        if (!isRunning || !targetTime) {
            return;
        }

        const now = new Date().getTime();
        const timeSpan = targetTime - now;
        const sec = Math.floor(timeSpan / 1000 + 0.5);
        if (sec < 0) {
            this.onDone().catch(console.error);
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
            setTrayImageWithMadeIcon(leftTime.slice(0, 2)).catch(console.error);
        }

        if (leftTime !== this.state.leftTime) {
            this.setState({ leftTime });
        }

        if (Math.abs(percent - this.state.percent) > 2 || percent === 0) {
            this.setState({ percent });
        }
    };

    onStopResumeOrStart = () => {
        if (this.state.percent === 0) {
            return this.onStart();
        }

        if (this.props.timer.isRunning) {
            this.onStop();
        } else {
            this.onResume();
        }
    };

    private onResume() {
        this.props.continueTimer();
        if (this.monitor) {
            this.monitor.resume();
        }
    }

    private onStop() {
        this.props.stopTimer();
        if (this.monitor) {
            this.monitor.stop();
        }
    }

    onStart = () => {
        if (this.props.timer.isFocusing) {
            this.monitor = new Monitor(
                this.activeWinListener,
                1000,
                this.props.timer.screenShotInterval
            );
            this.monitor.start();
        }

        this.props.startTimer();
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
        setTrayImageWithMadeIcon(undefined).catch(console.error);
        this.setState((_, props) => ({
            currentAppName: undefined,
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
                if (this.props.timer.project) {
                    thisSession.projectId = await getIdFromProjectName(
                        this.props.timer.project
                    ).catch(() => undefined);
                }
                finishedSessions.push(thisSession);
                this.setState({ pomodorosToday: finishedSessions });
                this.props.timerFinished(thisSession, this.props.timer.project);

                const notification = new remote.Notification({
                    title: 'Focusing finished. Start resting.',
                    body: `Completed ${finishedSessions.length} sessions today. \n\n`,
                    icon: nativeImage.createFromPath(`${__dirname}/${AppIcon}`)
                });
                notification.show();
                this.monitor.stop();
                this.monitor.clear();
                this.monitor = undefined;
            } else {
                console.error('No monitor');
                this.props.timerFinished();
            }
        } else {
            const notification = new remote.Notification({
                title: 'Focusing finished. Start resting.',
                body: `Completed ${this.state.pomodorosToday.length} sessions today. \n\n`,
                icon: nativeImage.createFromPath(`${__dirname}/${AppIcon}`)
            });
            notification.show();
            this.onStart();
            this.props.timerFinished();
        }

        this.focusOnCurrentWindow();
        this.clearStat();
        this.setState({ showMask: true });
    };

    private focusOnCurrentWindow() {
        if (this.win) {
            this.win.show();
            this.win.focus();
        }
    }

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

    private onMaskClick = () => {
        this.setState({ showMask: false });
    };

    private onMaskButtonClick = () => {
        this.setState({ showMask: false });
        this.onStart();
    };

    render() {
        const { leftTime, percent, more, pomodorosToday, showMask } = this.state;
        const { isRunning, targetTime } = this.props.timer;
        const apps: { [appName: string]: { appName: string; spentHours: number } } = {};
        const projectItem: ProjectItem = this.props.timer.project
            ? this.props.project.projectList[this.props.timer.project]
            : {
                spentHours: 0,
                name: 'All TODOs',
                applicationSpentTime: {},
                todoList: joinDict(
                      Object.values(this.props.project.projectList).map(v => v.todoList)
                  ),
                _id: 'All TODOs'
            };
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

        const shownLeftTime =
            (isRunning || targetTime) && leftTime.length ? leftTime : this.defaultLeftTime();
        return (
            <Layout style={{ backgroundColor: 'white' }}>
                <Mask style={{ display: showMask ? 'flex' : 'none' }} onClick={this.onMaskClick}>
                    <MaskInnerContainer>
                        <Row>
                            <h1 style={{ color: 'white', fontSize: '4em' }}>Session Finished</h1>
                        </Row>
                        <Button size="large" onClick={this.onMaskButtonClick}>
                            Start {this.props.timer.isFocusing ? 'Focusing' : 'Resting'}
                        </Button>
                        <Row style={{ marginTop: '2em' }}>
                            <h1 style={{ color: 'white' }}>Today Pomodoros</h1>
                            <PomodoroNumView
                                num={this.state.pomodorosToday.length}
                                color={'#f9ec52'}
                                showNum={false}
                            />
                        </Row>
                    </MaskInnerContainer>
                </Mask>

                <Sider
                    breakpoint="md"
                    collapsedWidth="0"
                    theme="light"
                    style={{
                        border: '1px solid rgb(240, 240, 240)',
                        borderRadius: 8,
                        display: this.props.timer.project ? undefined : 'none'
                    }}
                >
                    <div style={{ padding: 12 }}>
                        <h1 style={{ fontSize: '2em', paddingLeft: 12 }}>
                            {this.props.timer.project}
                        </h1>
                        <TodoList {...this.props} project={projectItem} />
                    </div>
                </Sider>
                <TimerLayout ref={this.mainDiv}>
                    <ProgressContainer>
                        <Progress
                            type="circle"
                            strokeColor={{
                                '0%': '#108ee9',
                                '100%': '#87d068'
                            }}
                            percent={percent}
                            width={300}
                            style={{
                                margin: '0 auto'
                            }}
                        >
                            <ProgressTextContainer>
                                <div style={{ marginBottom: 12 }} key="leftTime" id="leftTime">
                                    {shownLeftTime}
                                </div>
                                <div
                                    style={{ fontSize: '0.6em', cursor: 'pointer' }}
                                    onClick={this.switchMode}
                                >
                                    {this.props.timer.isFocusing ? (
                                        <Icon component={WorkIcon} />
                                    ) : (
                                        <Icon component={RestIcon} />
                                    )}
                                </div>
                            </ProgressTextContainer>
                        </Progress>
                        <span style={{ display: 'none' }} id="left-time-text">
                            {leftTime}
                        </span>
                    </ProgressContainer>

                    <div style={{ margin: '2em auto', textAlign: 'center' }}>
                        <FocusSelector {...this.props} width={240} />
                    </div>
                    <ButtonRow>
                        <div id="start-timer-button" style={{ lineHeight: 0 }}>
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
                        </div>
                        <Icon type="close-circle" title="Clear" onClick={this.onClear} />
                        <Icon type="more" title="Show More" onClick={this.toggleMode} />
                    </ButtonRow>

                    <MoreInfo>
                        <h2>Pomodoros Today</h2>
                        <PomodoroNumView num={this.state.pomodorosToday.length} />
                    </MoreInfo>

                    <MoreInfo
                        style={{
                            display: more ? 'block' : 'none'
                        }}
                    >
                        <h2>Time Spent</h2>
                        <PomodoroDualPieChart pomodoros={this.state.pomodorosToday} width={800} />
                        <Divider />
                    </MoreInfo>
                </TimerLayout>
            </Layout>
        );
    }
}

export default Timer;
