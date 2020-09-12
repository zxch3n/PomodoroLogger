import React, { Component } from 'react';
import { Button, Divider, message, Tooltip } from 'antd';
import Progress from './Progress';
import { KanbanActionTypes } from '../Kanban/action';
import { BoardActionTypes } from '../Kanban/Board/action';
import { LONG_BREAK_INTERVAL, TimerActionTypes as ThisActionTypes, uiStateNames } from './action';
import { RootState } from '../../reducers';
import { debounce } from 'lodash';
import { FocusSelector } from './FocusSelector';
import { Monitor } from '../../monitor';
import styled from 'styled-components';
import { BrowserWindow, ipcRenderer, nativeImage, remote } from 'electron';
import AppIcon from '../../../res/icon.png';
import { setTrayImageWithMadeIcon } from './iconMaker';
import { getTodaySessions } from '../../monitor/sessionManager';
import { PomodoroDualPieChart } from '../Visualization/DualPieChart';
import { PomodoroNumView } from './PomodoroNumView';
import { PomodoroRecord } from '../../monitor/type';
import { restartDBWorkers, workers } from '../../workers';
import { TimerMask } from './SessionEndingMask';
import { __DEV__, DEBUG_TIME_SCALE } from '../../../config';
import { AsyncWordCloud } from '../Visualization/WordCloud';
import { WorkRestIcon } from './WorkRestIcon';
import Board from '../Kanban/Board';
import { HelpIcon } from '../UserGuide/HelpIcon';
import dingMp3 from '../../../res/ding.mp3';
import ReactHotkeys from 'react-hot-keys';
import { EfficiencyAnalyser } from '../../../shared/efficiency/efficiency';
import { tabMaxHeight, thinScrollBar } from '../../style/scrollbar';
import { isShallowEqual, isShallowEqualByKeys } from '../../utils';
import { waitUntil } from './wait';

const setMenuItems: (...args: any) => void = remote.getGlobal('setMenuItems');

const KanbanName = styled.h1`
    max-width: 270px;
    overflow: hidden;
    text-overflow: ellipsis;
    font-size: 1.5em;
    padding-left: 12px;
    transition: color 0.2s;
    user-select: none;
    cursor: pointer;
    :hover {
        color: rgb(85, 87, 240);
    }
`;

const ProgressTextContainer = styled.div`
    user-select: none;
    margin-top: -50px;
    padding: 12px;
    text-align: center;
    transform: translateY(0.4em);
`;

const TimerLayout = styled.div`
    position: relative;
    padding: 0 24px 0 24px;
    overflow-y: auto;
    width: 100%;
    height: calc(100vh - 45px);
    ${thinScrollBar}
`;

const TimerInnerLayout = styled.div`
    overflow-x: hidden;
    min-width: 350px;
    max-width: 850px;
    margin: 0 auto;
`;

const MyLayout = styled.div`
    display: flex;
    flex: auto;
    flex-direction: row;
`;

const MySider = styled.aside`
    position: relative;
    flex: 0 0 300px;
    padding: 6px;
    border-right: 1px solid #dfdfdf;
    background-color: #eaeaea;
    float: left;
    box-shadow: 2px 0 6px 0 rgba(234, 234, 234, 0.6);
    transition: margin-left 0.2s;
    ${tabMaxHeight}
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

export interface Props extends ThisActionTypes, KanbanActionTypes, RootState, BoardActionTypes {}

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
    percent: number;
    showSider: boolean;
    more: boolean;
    pomodorosToday: PomodoroRecord[];
    showMask: boolean;
    pomodoroNum: number;
}

class Timer extends Component<Props, State> {
    interval?: any;
    monitor?: Monitor;
    win?: BrowserWindow;
    willStartNextSessionImmediately = false;
    mainDiv: React.RefObject<HTMLDivElement>;
    sound: React.RefObject<HTMLAudioElement>;
    extendedTimeInMinute: number;
    efficiencyAnalyser: EfficiencyAnalyser;
    private stagedSession?: PomodoroRecord;
    selfRef: React.RefObject<HTMLDivElement> = React.createRef();

    constructor(props: Props) {
        super(props);
        this.state = {
            leftTime: '',
            percent: 0,
            more: false,
            pomodorosToday: [],
            showMask: false,
            pomodoroNum: 0,
            showSider: true,
        };
        this.mainDiv = React.createRef<HTMLDivElement>();
        this.sound = React.createRef<HTMLAudioElement>();
        this.extendedTimeInMinute = 0;
        this.efficiencyAnalyser = new EfficiencyAnalyser([]);
    }

    onResize = () => {
        if (!this.selfRef.current) {
            return;
        }

        if (this.selfRef.current.clientWidth < 700) {
            if (this.state.showSider) {
                this.setState({ showSider: false });
            }
        }
    };

    componentDidMount(): void {
        this.efficiencyAnalyser = new EfficiencyAnalyser(this.props.timer.distractingList);
        this.interval = setInterval(this.updateLeftTime, 500);
        this.win = remote.getCurrentWindow();
        this.updateLeftTime();
        this.selfRef.current!.addEventListener('resize', this.onResize);
        this.props.setTimerManager({
            clear: this.onClear,
            pause: this.onStop,
            start: this.startFocusing,
        });
        getTodaySessions().then((finishedSessions) => {
            finishedSessions.sort((a, b) => a.startTime - b.startTime);
            this.setState({
                pomodorosToday: finishedSessions,
                pomodoroNum: finishedSessions.length,
            });
        });

        this.addMenuItems();
        workers.dbWorkers.sessionDB.count({}).then((size) => {
            workers.knn.loadModel(size).catch(console.error);
        });
    }

    shouldComponentUpdate(
        nextProps: Readonly<Props>,
        nextState: Readonly<State>,
        nextContext: any
    ): boolean {
        if (!isShallowEqual(this.state, nextState)) {
            return true;
        }

        const next = nextProps.timer;
        const _this = this.props.timer;
        return !isShallowEqualByKeys(next, _this, uiStateNames);
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
                },
            },
            {
                label: 'Start Break',
                type: 'normal',
                click: () => {
                    if (this.props.timer.isFocusing) {
                        this.switchMode();
                    }

                    if (!this.props.timer.isRunning) {
                        this.onStopResumeOrStart();
                    }
                },
            },
            {
                label: 'Pause',
                type: 'normal',
                click: () => {
                    if (this.props.timer.isRunning) {
                        this.onStopResumeOrStart();
                    }
                },
            },
            {
                label: 'Stop',
                type: 'normal',
                click: this.onClear,
            },
        ]);
    }

    componentWillUnmount(): void {
        if (this.monitor) {
            this.monitor.stop();
            this.monitor.clear();
        }

        if (this.interval) {
            clearInterval(this.interval);
        }

        this.selfRef.current!.removeEventListener('resize', this.onResize);
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
        const percent = 100 - timeSpan / 10 / (this.getDuration() + this.extendedTimeInMinute * 60);
        if (leftTime.slice(0, 2) !== this.state.leftTime.slice(0, 2)) {
            setTrayImageWithMadeIcon(
                leftTime.slice(0, 2),
                percent / 100,
                this.props.timer.isFocusing
            ).catch(console.error);
        }

        if (leftTime !== this.state.leftTime) {
            this.setState({ leftTime });
        }

        if (Math.abs(percent - this.state.percent) > 2 || percent === 0) {
            this.setState({ percent });
        }
    };

    onStopResumeOrStart = () => {
        if (this.props.timer.isRunning) {
            this.onStop();
        } else {
            this.startOrResume();
        }
    };

    startFocusing = async () => {
        if (this.props.timer.isRunning) {
            if (this.props.timer.isFocusing) {
                return;
            }

            this.onClear();
            await new Promise((r) => requestAnimationFrame(r));
        }

        if (!this.props.timer.isFocusing) {
            this.switchMode();
            await waitUntil(() => this.props.timer.isFocusing);
        }

        this.startOrResume();
    };

    startOrResume = () => {
        if (this.props.timer.isRunning) {
            return;
        }

        if (this.props.timer.targetTime == null) {
            return this.onStart();
        }

        this.onResume();
    };

    private onResume() {
        this.props.continueTimer();
        setTrayImageWithMadeIcon(
            this.state.leftTime.slice(0, 2),
            this.state.percent / 100,
            this.props.timer.isFocusing,
            false
        ).catch(console.error);
        if (this.monitor) {
            this.monitor.resume();
        } else {
            this.monitor = new Monitor(() => {}, 1000, this.props.timer.screenShotInterval);
            this.monitor.start();
        }
    }

    onStop = () => {
        this.props.stopTimer();
        setTrayImageWithMadeIcon(
            this.state.leftTime.slice(0, 2),
            this.state.percent / 100,
            this.props.timer.isFocusing,
            true
        ).catch(console.error);
        if (this.monitor) {
            this.monitor.stop();
        }
    };

    onStart = () => {
        if (this.props.timer.isFocusing) {
            this.monitor = new Monitor(() => {}, 1000, this.props.timer.screenShotInterval);
            this.monitor.start();
        }

        this.props.startTimer();
        requestAnimationFrame(this.updateLeftTime);
    };

    private getDuration = (isFocusing?: boolean) => {
        if (isFocusing === undefined) {
            // tslint:disable-next-line:no-parameter-reassignment
            isFocusing = this.props.timer.isFocusing;
        }

        const isLongBreak = this.props.timer.iBreak % 4 === 0;
        return isFocusing
            ? this.props.timer.focusDuration
            : isLongBreak
            ? this.props.timer.longBreakDuration
            : this.props.timer.restDuration;
    };

    private defaultLeftTime = (isFocusing?: boolean) => {
        return `${to2digits(this.getDuration(isFocusing) / 60)}:00`;
    };

    private clearStat = () => {
        setTrayImageWithMadeIcon(undefined).catch(console.error);
        this.setState((_, props) => ({
            leftTime: this.defaultLeftTime(props.timer.isFocusing),
            percent: 0,
        }));
    };

    onClear = () => {
        this.props.clearTimer();
        if (this.monitor) {
            this.monitor.stop();
            this.monitor.clear();
        }

        this.clearStat();
        this.extendedTimeInMinute = 0;
    };

    onDone = async (shouldRemind: boolean = true, isRotten?: boolean) => {
        if (this.props.timer.isFocusing) {
            await this.onFocusingSessionDone(shouldRemind, isRotten);
        } else if (shouldRemind) {
            const notification = new remote.Notification({
                title: 'Resting session ended',
                body: `Completed ${this.state.pomodoroNum} sessions today. \n\n`,
                icon: nativeImage.createFromPath(`${__dirname}/${AppIcon}`),
            });
            notification.show();
        }

        this.setState({
            showMask: true,
        });
        this.props.stopTimer();
        this.props.changeAppTab('timer');
        this.clearStat();
        if (shouldRemind) {
            this.focusOnCurrentWindow();
            this.remindUserTimeout(0);
            this.remindUserTimeout(60 * 1000, 1.0);
        }
    };

    private onFocusingSessionDone = async (shouldRemind = true, isRotten = false) => {
        if (!this.monitor) {
            throw new Error('No monitor');
        }

        if (shouldRemind) {
            const notification = new remote.Notification({
                title: 'Focusing finished. Start resting.',
                body: `Completed ${this.state.pomodoroNum + 1} sessions today. \n\n`,
                icon: nativeImage.createFromPath(`${__dirname}/${AppIcon}`),
            });
            notification.show();
        }

        const thisSession = this.monitor.sessionData;
        if (!isRotten) {
            thisSession.spentTimeInHour = this.props.timer.focusDuration / 3600;
        } else {
            const elapsedTimeInSec = this.getElapsedTimeInSecond();
            thisSession.spentTimeInHour = elapsedTimeInSec / 3600;
            thisSession.isRotten = true;
        }

        this.stagedSession = thisSession;

        if (__DEV__) {
            for (const app in this.stagedSession.apps) {
                this.stagedSession.apps[app].spentTimeInHour *= DEBUG_TIME_SCALE;
            }

            if (this.stagedSession.switchActivities) {
                for (let i = 0; i < this.stagedSession.switchActivities.length; i += 1) {
                    this.stagedSession.stayTimeInSecond![i] *= DEBUG_TIME_SCALE;
                }
            }
        }

        this.calculateSessionEfficiency();
        this.monitor.stop();
        if (this.props.timer.boardId === undefined) {
            this.props.inferProject(thisSession);
        }
    };

    private calculateSessionEfficiency() {
        if (this.stagedSession != null) {
            const boardDistractionList = this.props.timer.boardId
                ? this.props.kanban.boards[this.props.timer.boardId].distractionList || []
                : [];
            this.efficiencyAnalyser.update(
                this.props.timer.distractingList.concat(boardDistractionList)
            );
            this.stagedSession.efficiency = this.efficiencyAnalyser.analyse(this.stagedSession);
        }
    }

    private getElapsedTimeInSecond() {
        const { targetTime, isFocusing } = this.props.timer;
        const now = new Date().getTime();
        const timeSpan = targetTime! - now;
        const leftTimeInSec = Math.floor(timeSpan / 1000 + 0.5);
        const duration = this.getDuration(isFocusing);
        return duration - leftTimeInSec;
    }

    private onSessionConfirmed = debounce(async () => {
        if (this.monitor) {
            this.monitor.clear();
            this.monitor = undefined;
        }

        if (this.stagedSession === undefined) {
            // Resting session
            await this.props.timerFinished();
        } else {
            this.setState({ pomodoroNum: this.state.pomodoroNum + 1 });
            this.stagedSession.spentTimeInHour += this.extendedTimeInMinute / 60;
            this.extendedTimeInMinute = 0;
            if (this.props.timer.boardId !== undefined) {
                this.stagedSession.boardId = this.props.timer.boardId;
                const kanban = this.props.kanban;
                const cards: string[] =
                    kanban.lists[kanban.boards[this.props.timer.boardId].focusedList].cards;
                await this.props.timerFinished(this.stagedSession, cards, this.props.timer.boardId);
            } else {
                await this.props.timerFinished(this.stagedSession);
            }

            const finishedSessions = this.state.pomodorosToday.concat([this.stagedSession]);
            this.setState({ pomodorosToday: finishedSessions, leftTime: '' });
            this.stagedSession = undefined;
        }

        if (this.willStartNextSessionImmediately) {
            this.willStartNextSessionImmediately = false;
            await new Promise((r) => setTimeout(r, 30));
            this.onStart();
        }
    }, 50);

    private focusOnCurrentWindow() {
        if (this.win) {
            this.win.show();
            this.win.focus();
        }
    }

    toggleMode = () => {
        this.setState((state) => {
            // TODO: need better control
            const more = !state.more;
            return { more };
        });
    };

    switchMode = () => {
        if (this.props.timer.isRunning || this.state.percent !== 0) {
            message.warn('Cannot switch mode when timer is running');
            return;
        }

        if (this.state.showMask) {
            return;
        }

        this.props.switchFocusRestMode();
        this.clearStat();
        if (this.monitor) {
            this.monitor.stop();
            this.monitor.clear();
        }
    };

    private onMaskClick = () => {
        this.setState({ showMask: false });
        this.onSessionConfirmed();
    };

    private onMaskButtonClick = async () => {
        this.setState({ showMask: false });
        this.willStartNextSessionImmediately = true;
        this.onSessionConfirmed();
    };

    private switchToKanban = () => {
        if (this.props.timer.boardId) {
            this.props.switchToKanban(this.props.timer.boardId);
        }
    };

    private remindUserTimeout = (timeout = 0, volume = 0.5) => {
        setTimeout(() => {
            if (this.state.showMask) {
                this.focusOnCurrentWindow();
                if (this.sound.current) {
                    this.sound.current.volume = volume;
                    this.sound.current.play().catch((err) => console.error(err));
                }
            }
        }, timeout);
    };

    private extendCurrentSession = (timeInMinutes: number) => {
        if (this.monitor) {
            this.monitor.resume();
        } else if (__DEV__) {
            throw new Error();
        } else {
            this.monitor = new Monitor(() => {}, 1000, this.props.timer.screenShotInterval);
            this.monitor.start();
        }

        if (__DEV__) {
            timeInMinutes = 1 / 60;
        }

        this.extendedTimeInMinute += timeInMinutes;
        this.props.extendCurrentSession(timeInMinutes * 60);
        this.setState({ showMask: false });
    };

    private onFinishButtonClick = async () => {
        const { isFocusing } = this.props.timer;
        if (!isFocusing) {
            return this.onDone(false);
        }

        const eTime = this.getElapsedTimeInSecond();
        if (eTime < 600) {
            message.warn('Focus at least for 10 minutes to finish');
            return;
        }

        await this.onDone(false, true);
    };

    switchSider = () => {
        this.setState((state) => ({ showSider: !state.showSider }));
    };

    onKeyDown = (keyName: string) => {
        switch (keyName) {
            case 'f5':
                if (this.props.timer.targetTime == null) {
                    return this.onStart();
                }

                this.onResume();
                break;

            case 'f6':
                this.onStop();
                break;

            case 'tab':
                this.switchMode();
                break;
        }

        return;
    };

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
        message.error(error.toString());
    }

    render() {
        const { leftTime, percent, more, pomodorosToday, showMask } = this.state;
        const { isRunning, targetTime } = this.props.timer;
        const apps: { [appName: string]: { appName: string; spentHours: number } } = {};
        for (const pomodoro of pomodorosToday) {
            for (const appName in pomodoro.apps) {
                if (!(appName in apps)) {
                    apps[appName] = {
                        appName,
                        spentHours: 0,
                    };
                }

                apps[appName].spentHours += pomodoro.apps[appName].spentTimeInHour;
            }
        }

        const shownLeftTime =
            (isRunning || targetTime) && leftTime.length ? leftTime : this.defaultLeftTime();
        const boardId = this.props.timer.boardId;
        const listId =
            boardId !== undefined ? this.props.kanban.boards[boardId].focusedList : undefined;
        return (
            <MyLayout style={{ backgroundColor: 'white' }} ref={this.selfRef}>
                <ReactHotkeys keyName={'f5,f6,tab'} onKeyDown={this.onKeyDown} />
                <TimerMask
                    extendCurrentSession={this.extendCurrentSession}
                    newPomodoro={this.stagedSession}
                    showMask={showMask}
                    onCancel={this.onMaskClick}
                    onStart={this.onMaskButtonClick}
                    pomodoros={this.state.pomodorosToday}
                />
                {listId === undefined || boardId === undefined ? undefined : (
                    <MySider
                        style={{
                            marginLeft: this.state.showSider ? 0 : -300,
                        }}
                    >
                        <KanbanName onClick={this.switchToKanban}>
                            {this.props.kanban.boards[boardId].name}
                        </KanbanName>
                        <Board
                            boardId={boardId}
                            doesOnlyShowFocusedList={true}
                            showHeader={false}
                        />
                        <Button
                            icon={'more'}
                            style={{
                                position: 'absolute',
                                right: 0,
                                top: 20,
                                marginRight: -15,
                                zIndex: 50,
                                boxShadow: '4px 0 6px -1px rgba(234, 234, 234, 0.6)',
                            }}
                            onClick={this.switchSider}
                        />
                    </MySider>
                )}
                <TimerLayout ref={this.mainDiv}>
                    <HelpIcon
                        storyName={'allStories'}
                        style={{
                            position: 'absolute',
                            zIndex: 50,
                            top: 14,
                            right: 14,
                        }}
                    />
                    <TimerInnerLayout>
                        <ProgressContainer>
                            <Progress
                                type="circle"
                                strokeColor={{
                                    '0%': '#108ee9',
                                    '100%': '#87d068',
                                }}
                                percent={percent}
                                width={300}
                                style={{
                                    margin: '0 auto',
                                }}
                            >
                                <ProgressTextContainer>
                                    <div
                                        style={{ marginBottom: 12 }}
                                        key="leftTime"
                                        id="left-time-text"
                                    >
                                        {shownLeftTime}
                                    </div>
                                    <WorkRestIcon
                                        isWorking={this.props.timer.isFocusing}
                                        isLongBreak={
                                            !(this.props.timer.iBreak % LONG_BREAK_INTERVAL)
                                        }
                                        onClick={this.switchMode}
                                    />
                                </ProgressTextContainer>
                            </Progress>
                        </ProgressContainer>

                        <div style={{ margin: '2em auto', textAlign: 'center' }}>
                            <FocusSelector width={240} />
                        </div>
                        <ButtonRow>
                            <div id="start-timer-button" style={{ lineHeight: 0 }}>
                                {isRunning ? (
                                    <Button
                                        icon="pause"
                                        title="Pause"
                                        shape={'circle'}
                                        onClick={this.onStopResumeOrStart}
                                    />
                                ) : (
                                    <Button
                                        icon="caret-right"
                                        title="Start"
                                        shape={'circle'}
                                        onClick={this.onStopResumeOrStart}
                                    />
                                )}
                            </div>
                            {this.props.timer.isRunning || this.props.timer.targetTime ? (
                                <Button
                                    title="Finish"
                                    icon="check"
                                    shape={'circle'}
                                    onClick={this.onFinishButtonClick}
                                />
                            ) : (
                                <Button
                                    id="mode-switching-button"
                                    title="Switch Mode"
                                    icon="swap"
                                    shape="circle"
                                    onClick={this.switchMode}
                                />
                            )}
                            <div id="clear-timer-button" style={{ lineHeight: 0 }}>
                                <Button
                                    shape="circle"
                                    icon="close"
                                    title="Clear"
                                    onClick={this.onClear}
                                />
                            </div>
                            {this.state.pomodorosToday.length ? (
                                <Button
                                    id="more-timer-button"
                                    icon="more"
                                    shape="circle"
                                    title="Show More"
                                    onClick={this.toggleMode}
                                />
                            ) : undefined}
                        </ButtonRow>

                        <MoreInfo>
                            <Tooltip title="Pomodoros Today">
                                <PomodoroNumView
                                    pomodoros={this.state.pomodorosToday}
                                    showNum={false}
                                    animation={isRunning}
                                    chooseRecord={this.props.setChosenRecord}
                                />
                            </Tooltip>
                        </MoreInfo>

                        {more ? (
                            <MoreInfo>
                                <h2>Time Spent</h2>
                                <PomodoroDualPieChart
                                    pomodoros={this.state.pomodorosToday}
                                    width={800}
                                />
                                <Divider />

                                <h2>Word Cloud</h2>
                                <AsyncWordCloud
                                    records={this.state.pomodorosToday}
                                    width={800}
                                    height={400}
                                    style={{ margin: '0 auto' }}
                                />
                            </MoreInfo>
                        ) : undefined}
                    </TimerInnerLayout>
                </TimerLayout>
                <audio src={dingMp3} ref={this.sound} />
            </MyLayout>
        );
    }
}

export default Timer;
