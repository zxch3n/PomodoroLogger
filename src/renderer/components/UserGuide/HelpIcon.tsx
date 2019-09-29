import { connect } from 'react-redux';
import { actions } from './actions';
import React, { FC } from 'react';
import { Dispatch } from 'redux';
import { Icon, Button } from 'antd';

interface InputProps {
    storyName: string;
    style?: any;
}

interface Props {
    showStory: () => void;
    style?: any;
}

const _HelpIcon: FC<Props> = (props: Props) => {
    return (
        <Button icon={'question'} onClick={props.showStory} shape={'circle'} style={props.style} />
    );
};

export const HelpIcon = connect(
    undefined,
    (dispatch: Dispatch, props: InputProps) => {
        return {
            showStory: () => dispatch(actions.startHelpByStoryName(props.storyName))
        };
    }
)(_HelpIcon);
