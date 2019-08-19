import { hot } from 'react-hot-loader/root';
import { Icon, Tabs } from 'antd';
import * as React from 'react';
import 'antd/dist/antd.css';
import Timer from './Timer';
import Project from './Project';
import Setting from './Setting';
import History from './History';
import Analyser from './Analyser';
import { connect } from 'react-redux';
import { actions as timerActions, TimerActionTypes } from './Timer/action';
import { actions as projectActions, ProjectActionTypes } from './Project/action';
import { actions as historyActions, HistoryActionCreatorTypes } from './History/action';
import { genMapDispatchToProp } from '../utils';
import { setTrayImageWithMadeIcon } from './Timer/iconMaker';

const { TabPane } = Tabs;

interface Props extends TimerActionTypes, ProjectActionTypes, HistoryActionCreatorTypes {}

const Application = (props: Props) => {
    React.useEffect(() => {
        props.fetchAll();
        props.fetchSettings();
        props.fetchHistoryFromDisk();
        setTrayImageWithMadeIcon(undefined);
    }, []);

    return (
        <Tabs defaultActiveKey="timer">
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
                        Project
                    </span>
                }
                key="project"
            >
                <Project />
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
            {/*{process.env.NODE_ENV !== 'production' ? (*/}
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
            {/*) : (*/}
            {/*    undefined*/}
            {/*)}*/}
        </Tabs>
    );
};

const ApplicationContainer = connect(
    undefined,
    genMapDispatchToProp<TimerActionTypes & ProjectActionTypes & HistoryActionCreatorTypes>({
        ...timerActions,
        ...projectActions,
        ...historyActions
    })
)(Application);

export default hot(ApplicationContainer);
