import * as React from 'react';
import { FunctionComponent, useState } from 'react';
import { TreeSelect } from 'antd';
import { ActionCreatorTypes, TodoItem } from '../TODO/action';
import { RootState } from '../../reducers';
import { ProjectItem } from '../Project/action';


interface Props extends ActionCreatorTypes, RootState{ }
export const FocusSelector: FunctionComponent<Props> = (props: Props) => {
    const [value, setValue] = useState<string|undefined>(undefined);
    const todos: TodoItem[] = props.todo.todoList;
    const projects: {[key: string]: any} = {};
    todos.forEach(item=>{
        if (!(item.project in projects)) {
            projects[item.project] = {
                title: item.project,
                value: item.project,
                key: item.project,
                children: [
                    {
                        title: item.title,
                        value: item._id,
                        key: item._id
                    }
                ]
            }
        } else {
            projects[item.project].children.push({
                title: item.title,
                value: item._id,
                key: item._id
            })
        }
    });

    const tree = Object.values(projects);
    const onChange = (value: string|undefined) => {
        setValue(value);
        if (value){
            props.setFocus(value, true);
        }
    };

    return (
        <TreeSelect
            value={value}
            style={{minWidth: 300}}
            dropdownStyle={{ maxHeight: 400, overflow: 'auto'}}
            treeData={tree}
            placeholder="Please Select Focus"
            treeDefaultExpandAll={true}
            onChange={onChange}
        />
    );
};

