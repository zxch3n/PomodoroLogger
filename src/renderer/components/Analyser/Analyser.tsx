import React, { useState } from 'react';
import styled from 'styled-components';
import { Button, Card, Col, Progress, Row, Statistic } from 'antd';
import { RootState } from '../../reducers';
import { HistoryActionCreatorTypes } from '../History/action';
import { workers } from '../../workers';
import { Bar } from '../Visualization/Bar';
import { GridCalendar } from '../Visualization/GridCalendar';
import { createRecord } from '../../../../test/utils';
import dbs from '../../dbs';
import { fatScrollBar, tabMaxHeight } from '../../style/scrollbar';
import { PomodoroRecord } from '../../monitor/type';

const Container = styled.div`
    position: relative;
    max-width: 800px;
    margin: 0 auto;
    padding: 2em;
    overflow: auto;
    ${tabMaxHeight}
    ${fatScrollBar}
`;

interface Props extends RootState, HistoryActionCreatorTypes {}
export const Analyser: React.FC<Props> = React.memo((props: Props) => {
    return <Container />;
});
