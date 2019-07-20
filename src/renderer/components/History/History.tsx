import React, { useState, useEffect } from 'react';
import { HistoryActionCreatorTypes, actions, HistoryState } from './action';

interface Props extends HistoryState, HistoryActionCreatorTypes {}
export const History: React.FunctionComponent<Props> = (props: Props) => {
    return <div>History</div>;
};
