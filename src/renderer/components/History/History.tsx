import React, { useState } from 'react';
import { HistoryActionCreatorTypes, actions, HistoryState } from './action';

interface Props extends HistoryState, HistoryActionCreatorTypes {}
export const History: React.FunctionComponent<Props> = (props: Props) => {
    // TODO: interval setting
    return <div />;
};
