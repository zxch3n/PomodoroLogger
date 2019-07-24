import { hot } from 'react-hot-loader/root';
import { Tabs, Icon } from 'antd';
import * as React from 'react';
import 'antd/dist/antd.css';
import Timer from './Timer';
import Project from './Project';
import Setting from './Setting';
import History from './History';
import { connect } from 'react-redux';
import { TimerActionTypes, actions as timerActions } from './Timer/action';
import { ProjectActionTypes, actions as projectActions } from './Project/action';
import { RootState } from '../reducers';
import { genMapDispatchToProp } from '../utils';

const { TabPane } = Tabs;

interface Props extends TimerActionTypes, ProjectActionTypes {}

const Application = (props: Props) => {
    React.useEffect(() => {
        props.fetchAll();
        props.fetchSettings();
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
        </Tabs>
    );
};

const ApplicationContainer = connect(
    undefined,
    genMapDispatchToProp<TimerActionTypes & ProjectActionTypes>({
        ...timerActions,
        ...projectActions
    })
)(Application);

export default hot(ApplicationContainer);
