import { DragDropContext, Draggable, Droppable } from 'react-beautiful-dnd';
import React, { FC } from 'react';
import { Card as CardType } from './action';
import styled from 'styled-components';
import { Icon, Divider } from 'antd';
import formatMarkdown from './formatMarkdown';

const CardContainer = styled.div`
    background-color: white;
    margin: 8px 4px;
    border-radius: 6px;
`;

const CardContent = styled.div`
    padding: 0 12px 0 12px;

    .card-icon {
        float: right;
        cursor: pointer;
    }

    h1 {
        font-size: 1.5em;
        font-weight: 700;
    }
    h2 {
        font-size: 1.4em;
    }
    h3 {
        font-size: 1.2em;
    }
    h4 {
        font-size: 1.1em;
    }

    h5,
    h6,
    h7 {
        font-size: 1.05em;
        font-weight: 700;
    }

    p {
        margin: 0;
    }
`;

const BadgerHolder = styled.div`
    min-height: 20px;
`;

export interface InputProps {
    cardId: string;
    index: number;
    listId: string;
    isDraggingOver: boolean;
}

interface Props extends CardType, InputProps {}
export const Card: FC<Props> = (props: Props) => {
    const { index, listId, title, content, _id, isDraggingOver } = props;
    const onMoreClick = () => {
        // TODO:
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
                        >
                            <CardContent>
                                <span className="card-icon">
                                    <h1>
                                        <Icon type="more" onClick={onMoreClick} />
                                    </h1>
                                </span>
                                <h1>{props.title}</h1>
                                <p>{props.content}</p>
                                <Divider style={{ margin: 4 }} />
                                <BadgerHolder>TODO:</BadgerHolder>
                            </CardContent>
                        </CardContainer>
                        {isDraggingOver && provided.placeholder}
                    </>
                )}
            </Draggable>
        </>
    );
};
