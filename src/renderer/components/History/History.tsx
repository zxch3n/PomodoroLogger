import React, { useState, useEffect } from 'react';
import { HistoryActionCreatorTypes, actions, HistoryState } from './action';
import { GridCalendar } from '../Visualization/GridCalendar';

const mock = () => {
    let time = new Date().getTime();
    const ans: { [time: number]: { count: number } } = {};
    for (let i = 0; i < 365; i += 1, time -= 3600 * 1000 * 24) {
        ans[time] = {
            count: Math.floor(Math.random() * 10)
        };
    }

    return ans;
};

interface Props extends HistoryState, HistoryActionCreatorTypes {}
export const History: React.FunctionComponent<Props> = (props: Props) => {
    return (
        <div>
            <h1>History</h1>
            <GridCalendar data={mock()} />
        </div>
    );
};
