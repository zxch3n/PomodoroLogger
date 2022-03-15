import { Icon, Tabs } from 'antd';
import 'antd/dist/antd.css';
import { ipcRenderer, remote } from 'electron';
import * as React from 'react';
import ReactHotkeys from 'react-hot-keys';
import { hot } from 'react-hot-loader/root';
import { connect } from 'react-redux';
import styled from 'styled-components';
import { IpcEventName } from '../../main/ipc/type';
import { loadDBs } from '../dbs';
import { RootState } from '../reducers';
import { genMapDispatchToProp } from '../utils';
import { DestroyOnTimeoutWrapper } from './DestroyOnTimeoutWrapper';
import History from './History';
import { actions as historyActions, HistoryActionCreatorTypes } from './History/action';
import Kanban from './Kanban';
import { CardInDetail } from './Kanban/Card/CardEditor';
import { kanbanActions } from './Kanban/reducer';
import Setting from './Setting';
import Timer from './Timer';
import { actions as timerActions, TimerActionTypes } from './Timer/action';
import { setTrayImageWithMadeIcon } from './Timer/iconMaker';
import { UpdateController } from './UpdateController';
import { UserGuide } from './UserGuide/UserGuide';
import { ConnectedPomodoroSankey } from './Visualization/PomodoroSankey';

interface StyledProps {
    minimize: boolean;
}

const Main = styled.div<StyledProps>`
    .ant-tabs-bar {
        margin: 0;
    }

    ${({ minimize }) => (minimize ? 'overflow: hidden; height: 100vh;' : '')}
    .ant-tabs-nav-container,.ant-modal-content {
        ${({ minimize }) => (minimize ? 'display: none;' : '')}
    }

    .ant-btn-icon-only > i {
        transform: translateY(-0.5px);
    }

    * {
        outline: none;
    }
`;

const { TabPane } = Tabs;

interface Props extends TimerActionTypes, HistoryActionCreatorTypes {
    currentTab: string;
    minimize: boolean;

    fetchKanban: () => void;
}

class Application extends React.Component<Props> {
    private timer = (<Timer />);
    componentDidMount(): void {
        loadDBs().then(() => {
            this.props.fetchSettings();
            this.props.fetchKanban();
        });

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
                window.api.openDevTools();
                break;
            case 'ctrl+q':
                ipcRenderer.send(IpcEventName.Quit, 'quit');
                break;
            case 'f11':
            case 'f12':
                this.props.setMinimize(!this.props.minimize);
                break;
        }
    };

    componentWillUnmount() {
        window.removeEventListener('error', this.onError);
    }

    onError = (event: ErrorEvent) => this.handleError(event.error);
    handleError = (err: Error) => {
        if (process.env.NODE_ENV === 'production') {
            ipcRenderer.send(IpcEventName.Restart, 'error');
        }
    };

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
        if (process.env.NODE_ENV === 'production') {
            this.handleError(error);
        }
    }

    render() {
        const { currentTab, changeAppTab, minimize } = this.props;
        return (
            <Main minimize={minimize}>
                <Tabs activeKey={minimize ? 'timer' : currentTab} onChange={changeAppTab as any}>
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
                        {this.timer}
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
                </Tabs>
                {!minimize && (
                    <>
                        <UserGuide />
                        <UpdateController />
                        <CardInDetail />
                        <ConnectedPomodoroSankey />
                    </>
                )}
                <ReactHotkeys
                    keyName={'ctrl+tab,ctrl+shift+tab,ctrl+f12,ctrl+q,f11,f12'}
                    onKeyDown={this.onKeyDown}
                />
            </Main>
        );
    }
}

const ApplicationContainer = connect(
    (state: RootState) => ({ currentTab: state.timer.currentTab, minimize: state.timer.minimize }),
    genMapDispatchToProp<TimerActionTypes & HistoryActionCreatorTypes>({
        ...timerActions,
        ...historyActions,
        fetchKanban: kanbanActions.boardActions.fetchBoards,
    })
)(Application);

export default hot(ApplicationContainer);
