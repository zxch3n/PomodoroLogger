import { DragDropContext, Draggable, Droppable } from 'react-beautiful-dnd';
import React, { FC } from 'react';
import { Card as CardType, CardActionTypes } from './action';
import { KanbanActionTypes } from '../action';
import styled from 'styled-components';
import { Icon, Divider, Dropdown } from 'antd';
import formatMarkdown from './formatMarkdown';
import { Badge, TimeBadge } from './Badge';
import { formatTime } from '../../../utils';
import { BadgeHolder } from '../style/Badge';
import { Markdown } from '../style/Markdown';
import { PomodoroDot } from '../../Visualization/PomodoroDot';

const CardContainer = styled.div`
    word-break: break-word;
    background-color: white;
    margin: 8px 4px;
    border-radius: 6px;
    cursor: grab;
    box-shadow: 0 0 rgba(0, 0, 0, 0);
    transition: box-shadow 0.2s, transform 0.2s, background-color 0.1s;
    &.is-dragging {
        box-shadow: 0 0 18px 8px rgba(0, 0, 0, 0.2);
    }
    :hover {
        background-color: rgba(244, 244, 248);
    }
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
    const onClick = () => {
        props.setEditCard(true, props.listId, props._id);
    };

    return (
        <>
            <Draggable draggableId={_id} index={index}>
                {(provided, snapshot) => {
                    return (
                        <>
                            <CardContainer
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                onClick={onClick}
                                className={
                                    'kanban-card ' +
                                    (snapshot.isDragging ? 'is-dragging' : undefined)
                                }
                            >
                                <CardContent>
                                    <h1 style={{ margin: 0, fontSize: 18, lineHeight: '1.3em' }}>
                                        {props.title}
                                    </h1>
                                    <Markdown
                                        dangerouslySetInnerHTML={{
                                            __html: formatMarkdown(props.content)
                                        }}
                                    />
                                    <Divider style={{ margin: '4px 0' }} />
                                    <BadgeHolder>
                                        {props.sessionIds.length > 0 ? (
                                            <PomodoroDot num={props.sessionIds.length} />
                                        ) : (
                                            undefined
                                        )}
                                        {props.spentTimeInHour.estimated ||
                                        props.spentTimeInHour.actual ? (
                                            <TimeBadge
                                                spentTime={props.spentTimeInHour.actual}
                                                leftTime={
                                                    props.spentTimeInHour.estimated -
                                                    props.spentTimeInHour.actual
                                                }
                                            />
                                        ) : (
                                            undefined
                                        )}
                                    </BadgeHolder>
                                </CardContent>
                            </CardContainer>
                            {isDraggingOver && provided.placeholder}
                        </>
                    );
                }}
            </Draggable>
        </>
    );
};
