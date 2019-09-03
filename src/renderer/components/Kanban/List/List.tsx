import { DragDropContext, Draggable, Droppable } from 'react-beautiful-dnd';
import FocusIcon from '../../../../res/Focus.svg';
import React, { ChangeEvent, FC, useRef, useState } from 'react';
import { List as ListType, ListActionTypes } from './action';
import styled from 'styled-components';
import Card from '../Card';
import { Button, Icon, Dropdown, Menu, Popconfirm, Form, Modal, Input, message } from 'antd';
import TextArea from 'antd/es/input/TextArea';

const Container = styled.div`
    padding: 4px;
    margin: 6px;
    border-radius: 6px;
    background-color: white;
`;

const ListHead = styled.div`
    height: 4em;
    width: 250px;
    padding: 4px 12px;
    background-color: white;
    border-radius: 6px;
    position: relative;

    h1 {
        position: absolute;
        top: 20px;
        transform: translateY(-50%);
        left: 8px;
    }

    .list-head-icon {
        position: absolute;
        top: 20px;
        transform: translateY(-50%);
        right: 8px;
        cursor: pointer;
    }

    .list-head-icon:hover {
        color: #0074d9;
    }
`;

const Cards = styled.div`
    padding: 0 2px;
    background-color: #dedede;
    border-radius: 4px;
    max-height: calc(100vh - 200px);
    overflow-y: auto;
`;

const ButtonWrapper = styled.div`
    textalign: center;
    position: sticky;
    left: 50%;
    bottom: 0;
    display: flex;
    justify-content: center;
    background-color: #dedede;
    border-radius: 0 0 4px 4px;
`;

export interface InputProps {
    listId: string;
    index: number;
    boardId: string;
    focused?: boolean;
}

interface Props extends ListType, InputProps, ListActionTypes {}
export const List: FC<Props> = (props: Props) => {
    const { focused = false } = props;
    const [isEditing, setIsEditing] = useState(false);
    const [value, setValue] = useState('');
    const inputRef = useRef<Input>();

    const addCard = () => {
        props.addCard(props._id, 'TestCard', 'testConetn saf sf 1 2 3 4 test 0 1 2 3 4');
    };

    const onDelete = () => {
        if (props.focused) {
            message.warn('Cannot delete the focused list.');
            return;
        }

        props.deleteList(props._id, props.boardId);
    };

    const onSave = () => {
        props.renameList(props._id, value);
        setIsEditing(false);
    };

    const onValueChange = (e: any) => {
        setValue(e.target.value);
    };

    const onEdit = () => {
        setValue(props.title);
        setIsEditing(true);
        if (!inputRef.current) {
            return;
        }

        inputRef.current.focus();
    };

    const menu = (
        <Menu>
            <Menu.Item key="1" onClick={onEdit}>
                <Icon type={'setting'} /> Edit
            </Menu.Item>
            <Menu.Divider />
            <Menu.Item key="3">
                <Popconfirm title={'Are you sure?'} onConfirm={onDelete}>
                    <Icon type={'delete'} /> Delete
                </Popconfirm>
            </Menu.Item>
        </Menu>
    );

    return (
        <Draggable draggableId={props.listId} index={props.index}>
            {(provided, { draggingOver }) => (
                <div>
                    <Container ref={provided.innerRef} {...provided.draggableProps}>
                        <ListHead {...provided.dragHandleProps}>
                            {isEditing ? (
                                <div
                                    style={{
                                        display: 'flex',
                                        flexDirection: 'row',
                                        justifyContent: 'space-between'
                                    }}
                                >
                                    <Input maxLength={25} value={value} onChange={onValueChange} />
                                    <Button onClick={onSave}>Save</Button>
                                </div>
                            ) : (
                                <>
                                    <h1>{props.title}</h1>
                                    <div className="list-head-icon">
                                        {focused ? (
                                            <span
                                                style={{ color: 'red', marginRight: 8 }}
                                                title={'Focused List'}
                                            >
                                                <Icon component={FocusIcon} />
                                            </span>
                                        ) : (
                                            undefined
                                        )}
                                        <Dropdown overlay={menu} trigger={['click']}>
                                            <Icon type="menu" />
                                        </Dropdown>
                                    </div>
                                </>
                            )}
                        </ListHead>
                        <Droppable droppableId={props._id}>
                            {(provided, { isDraggingOver }) => (
                                <Cards ref={provided.innerRef}>
                                    {props.cards.map((cardId, index) => (
                                        <Card
                                            cardId={cardId}
                                            index={index}
                                            key={cardId}
                                            listId={props.listId}
                                            isDraggingOver={isDraggingOver}
                                        />
                                    ))}
                                    {provided.placeholder}
                                    <ButtonWrapper>
                                        <Button onClick={addCard} shape={'circle'} icon="plus" />
                                    </ButtonWrapper>
                                </Cards>
                            )}
                        </Droppable>
                    </Container>
                    {provided.placeholder}
                </div>
            )}
        </Draggable>
    );
};
