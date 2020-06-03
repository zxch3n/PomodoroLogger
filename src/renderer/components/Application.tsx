import { hot } from 'react-hot-loader/root';
import { Icon, Tabs } from 'antd';
import * as React from 'react';
import 'antd/dist/antd.css';
import Setting from './Setting';
import History from './History';
import Analyser from './Analyser';
import ReactHotkeys from 'react-hot-keys';
import { connect } from 'react-redux';
import { remote, ipcRenderer } from 'electron';
import { actions as timerActions, TimerActionTypes } from './Timer/action';
import { actions as historyActions, HistoryActionCreatorTypes } from './History/action';
import { kanbanActions } from './Kanban/reducer';
import { genMapDispatchToProp } from '../utils';
import { setTrayImageWithMadeIcon } from './Timer/iconMaker';
import { RootState } from '../reducers';
import Kanban from './Kanban';
import styled from 'styled-components';
import Timer from './Timer';
import { UserGuide } from './UserGuide/UserGuide';
import { UpdateController } from './UpdateController';
import { CardInDetail } from './Kanban/Card/CardEditor';
import { ConnectedPomodoroSankey } from './Visualization/PomodoroSankey';
import { DestroyOnTimeoutWrapper } from './DestroyOnTimeoutWrapper';

const Main = styled.div`
    .ant-tabs-bar {
        margin: 0;
    }
`;

const { TabPane } = Tabs;

interface Props extends TimerActionTypes, HistoryActionCreatorTypes {
    currentTab: string;

    fetchKanban: () => void;
}

class Application extends React.Component<Props> {
    componentDidMount(): void {
        this.props.fetchSettings();
        this.props.fetchKanban();
        setTrayImageWithMadeIcon(undefined).then();
        window.addEventListener('error', this.onError);
    }

    onKeyDown = (keyname: string) => {
        switch (keyname) {
            case 'ctrl+tab':
                this.props.switchTab(1);
                break;
            case 'ctrl+shift+tab':
                this.props.switchTab(-1);
                break;
            case 'ctrl+f12':
                remote.getCurrentWebContents().openDevTools({ activate: true, mode: 'detach' });
                break;
            case 'ctrl+q':
                ipcRenderer.send('quit-app', 'quit');
                break;
        }
    };

    componentWillUnmount() {
        window.removeEventListener('error', this.onError);
    }

    onError = (event: ErrorEvent) => this.handleError(event.error);
    handleError = (err: Error) => {
        if (process.env.NODE_ENV === 'production') {
            ipcRenderer.send('restart-app', 'error');
        }
    };

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
        if (process.env.NODE_ENV === 'production') {
            this.handleError(error);
        }
    }

    render() {
        const { currentTab, changeAppTab } = this.props;
        return (
            <Main>
                <Tabs activeKey={currentTab} onChange={changeAppTab as any}>
                    <TabPane
                        tab={
                            <span>
                                <Icon type="clock-circle" />
                                Pomodoro
                            </span>
                        }
                        forceRender={true}
                        key="timer"
                    >
                        <Timer />
                    </TabPane>

                    <TabPane
                        tab={
                            <span>
                                <Icon type="project" />
                                Kanban
                            </span>
                        }
                        forceRender={false}
                        key="kanban"
                    >
                        <DestroyOnTimeoutWrapper
                            isVisible={currentTab === 'kanban'}
                            timeout={600000}
                        >
                            <Kanban />
                        </DestroyOnTimeoutWrapper>
                    </TabPane>

                    <TabPane
                        tab={
                            <span>
                                <Icon type="history" />
                                History
                            </span>
                        }
                        forceRender={false}
                        key="history"
                    >
                        <DestroyOnTimeoutWrapper
                            isVisible={currentTab === 'history'}
                            timeout={600000}
                        >
                            <History />
                        </DestroyOnTimeoutWrapper>
                    </TabPane>

                    <TabPane
                        tab={
                            <span>
                                <Icon type="setting" />
                                Setting
                            </span>
                        }
                        key="setting"
                    >
                        <Setting />
                    </TabPane>
                    {process.env.NODE_ENV !== 'production' ? (
                        <TabPane
                            tab={
                                <span>
                                    <Icon type="bar-chart" />
                                    Analyser
                                </span>
                            }
                            key="analyser"
                        >
                            <Analyser />
                        </TabPane>
                    ) : undefined}
                </Tabs>
                <UserGuide />
                <UpdateController />
                <CardInDetail />
                <ConnectedPomodoroSankey />
                <ReactHotkeys
                    keyName={'ctrl+tab,ctrl+shift+tab,ctrl+f12,ctrl+q'}
                    onKeyDown={this.onKeyDown}
                />
            </Main>
        );
    }
}

const ApplicationContainer = connect(
    (state: RootState) => ({ currentTab: state.timer.currentTab }),
    genMapDispatchToProp<TimerActionTypes & HistoryActionCreatorTypes>({
        ...timerActions,
        ...historyActions,
        fetchKanban: kanbanActions.boardActions.fetchBoards,
    })
)(Application);

export default hot(ApplicationContainer);
