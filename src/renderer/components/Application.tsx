import { hot } from 'react-hot-loader/root';
import { Icon, Layout, Tabs } from 'antd';
import * as React from 'react';
import 'antd/dist/antd.css';
import Setting from './Setting';
import History from './History';
import Analyser from './Analyser';
import ReactHotkeys from 'react-hot-keys';
import { connect } from 'react-redux';
import { actions as timerActions, switchTab, TimerActionTypes } from './Timer/action';
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
import { CardInDetail } from './Kanban/Card/CardInDetail';
import '../style/global.css';
import { ConnectedPomodoroSankey } from './Visualization/PomodoroSankey';

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

const Application = (props: Props) => {
    React.useEffect(() => {
        props.fetchSettings();
        props.fetchKanban();
        setTrayImageWithMadeIcon(undefined);
    }, []);

    const onKeyDown = (keyname: string) => {
        switch (keyname) {
            case 'ctrl+tab':
                props.switchTab(1);
                break;
            case 'ctrl+shift+tab':
                props.switchTab(-1);
                break;
        }
    };

    return (
        <Main>
            <Tabs activeKey={props.currentTab} onChange={props.changeAppTab as any}>
                <TabPane
                    tab={
                        <span>
                            <Icon type="clock-circle" />
                            Pomodoro
                        </span>
                    }
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
                    key="kanban"
                >
                    <Kanban />
                </TabPane>

                <TabPane
                    tab={
                        <span>
                            <Icon type="history" />
                            History
                        </span>
                    }
                    key="history"
                >
                    <History />
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
                ) : (
                    undefined
                )}
            </Tabs>
            <UserGuide />
            <UpdateController />
            <CardInDetail />
            <ConnectedPomodoroSankey />
            <ReactHotkeys keyName={'ctrl+tab,ctrl+shift+tab'} onKeyDown={onKeyDown} />
        </Main>
    );
};

const ApplicationContainer = connect(
    (state: RootState) => ({ currentTab: state.timer.currentTab }),
    genMapDispatchToProp<TimerActionTypes & HistoryActionCreatorTypes>({
        ...timerActions,
        ...historyActions,
        fetchKanban: kanbanActions.boardActions.fetchBoards
    })
)(Application);

export default hot(ApplicationContainer);
