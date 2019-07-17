import { hot } from 'react-hot-loader/root';
import { Tabs, Icon } from 'antd';
import * as React from 'react';
import 'antd/dist/antd.css';
import Timer from './Timer';
import Project from './Project';
import Setting from './Setting';
import History from './History';

const { TabPane } = Tabs;

const Application = () => (
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

export default hot(Application);
