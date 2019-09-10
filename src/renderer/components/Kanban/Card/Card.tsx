import { DragDropContext, Draggable, Droppable } from 'react-beautiful-dnd';
import React, { FC } from 'react';
import { Card as CardType, CardActionTypes } from './action';
import { KanbanActionTypes } from '../action';
import styled from 'styled-components';
import { Icon, Divider, Dropdown, Menu } from 'antd';
import formatMarkdown from './formatMarkdown';
import { Badge } from './Badge';
import { formatTime } from '../../../utils';
import { BadgeHolder } from '../style/Badge';
import { Markdown } from '../style/Markdown';

const CardContainer = styled.div`
    background-color: white;
    margin: 8px 4px;
    border-radius: 6px;
    cursor: grab;
`;

const CardContent = styled.div`
    padding: 2px 12px 4px 12px;
    font-size: 14px;

    .card-icon {
        float: right;
        cursor: pointer;
    }
`;

export interface InputProps {
    cardId: string;
    index: number;
    listId: string;
    isDraggingOver: boolean;
}

interface Props extends CardType, InputProps, CardActionTypes, KanbanActionTypes {}
export const Card: FC<Props> = (props: Props) => {
    const { index, listId, title, content, _id, isDraggingOver } = props;

    const onDelete = () => {
        props.deleteCard(props._id, props.listId);
    };

    const menu = (
        <Menu>
            <Menu.Item onClick={onDelete}>
                <Icon type={'delete'} /> Delete
            </Menu.Item>
        </Menu>
    );

    const onClick = () => {
        props.setEditCard(true, props.listId, props._id);
    };

    return (
        <>
            <Draggable draggableId={_id} index={index}>
                {(provided, snapshot) => (
                    <>
                        <CardContainer
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            onClick={onClick}
                        >
                            <CardContent>
                                <Dropdown overlay={menu} trigger={['click']}>
                                    <span className="card-icon">
                                        <h1>
                                            <Icon type="more" />
                                        </h1>
                                    </span>
                                </Dropdown>
                                <h1>{props.title}</h1>
                                <Markdown
                                    dangerouslySetInnerHTML={{
                                        __html: formatMarkdown(props.content)
                                    }}
                                />
                                <Divider style={{ margin: '4px 0' }} />
                                <BadgeHolder>
                                    {props.spentTimeInHour.estimated ? (
                                        <Badge
                                            type={'estimated'}
                                            value={formatTime(props.spentTimeInHour.estimated)}
                                            color={'#97ca00'}
                                        />
                                    ) : (
                                        undefined
                                    )}
                                    {props.spentTimeInHour.actual ? (
                                        <Badge
                                            type={'actual'}
                                            value={formatTime(props.spentTimeInHour.actual)}
                                            color={'#007ec6'}
                                        />
                                    ) : (
                                        undefined
                                    )}
                                    {props.sessionIds.length > 0 ? (
                                        <Badge
                                            type={'pomodoros'}
                                            value={props.sessionIds.length.toString()}
                                            color={'#ca6129'}
                                        />
                                    ) : (
                                        undefined
                                    )}
                                </BadgeHolder>
                            </CardContent>
                        </CardContainer>
                        {isDraggingOver && provided.placeholder}
                    </>
                )}
            </Draggable>
        </>
    );
};
