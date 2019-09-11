import { connect } from 'react-redux';
import { actions } from './actions';
import React, { FC } from 'react';
import { Dispatch } from 'redux';
import { Icon } from 'antd';

interface InputProps {
    storyName: string
}

interface Props {
    showStory: ()=>void;
}


const _HelpIcon: FC<Props> = (props: Props) => {
    return (
        <Icon type={'help'} onClick={props.showStory}/>
    )
};

export const HelpIcon = connect(
    undefined,
    (dispatch: Dispatch, props: InputProps) => {
        return {
            showStory: () => dispatch(actions.getHelpByStoryName(props.storyName))
        }
    }
)(_HelpIcon);
