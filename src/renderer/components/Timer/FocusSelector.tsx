import * as React from 'react';
import { FunctionComponent, useState } from 'react';
import { TreeSelect } from 'antd';
import { ActionCreatorTypes } from '../TODO/action';
import { RootState } from '../../reducers';
import { ProjectItem } from '../Project/action';


interface Props extends ActionCreatorTypes, RootState{ }
export const FocusSelector: FunctionComponent<Props> = (props: Props) => {
    const [value, setValue] = useState<string|undefined>(undefined);
    const projects: ProjectItem[] = Object.values(props.project.projectList);
    const tree = projects.map(project=>{
        return {
            title: project.name,
            value: project.name,
            key: project.name,
            children: Object.values(project.todoList).map(v=>({
                title: v.title,
                value: v._id,
                key: v._id
            }))
        }
    });

    const onChange = (value: string|undefined) => {
        setValue(value);
        if (value){
            props.setFocus(value, true);
        }
    };

    return (
        <TreeSelect
            value={value}
            dropdownStyle={{ maxHeight: 400, overflow: 'auto' }}
            treeData={tree}
            placeholder="Select Focus"
            treeDefaultExpandAll={true}
            onChange={onChange}
        />
    );
};

