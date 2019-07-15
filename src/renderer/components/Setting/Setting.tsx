import React, { useState } from 'react';
import { ActionCreatorTypes, TimerState } from '../Timer/action';

interface Props extends TimerState, ActionCreatorTypes {}
export const Setting: React.FunctionComponent<Props> = (props: Props) => {
    // TODO: interval setting
    return  <div/>;
};
