import React, { FunctionComponent, useEffect } from 'react';
import { Select } from 'antd';
import { ProjectActionTypes } from '../Project/action';
import { TimerActionTypes as TimerActions } from './action';
import { RootState } from '../../reducers';

const { Option } = Select;

interface Props extends ProjectActionTypes, TimerActions, RootState {
    width?: number;
}
export const FocusSelector: FunctionComponent<Props> = (props: Props) => {
    const onChange = (value?: string) => {
        props.setProject(value);
    };

    const options = Object.values(props.project.projectList).map(v => (
        <Option key={v.name} value={v.name}>
            {v.name}
        </Option>
    ));

    useEffect(() => {
        if (options.length === 0) {
            props.fetchAll();
        }
    }, []);

    let style: any = {
        minWidth: 100,
        width: '100%'
    };

    if (props.width) {
        style = { width: props.width };
    }

    return (
        <Select
            value={props.timer.project}
            style={style}
            placeholder="Choose Your Focus"
            onChange={onChange}
        >
            {options}
            <Option key="undefined" value={undefined} style={{ color: '#bfbfbf' }}>
                No Focusing Project
            </Option>
        </Select>
    );
};
