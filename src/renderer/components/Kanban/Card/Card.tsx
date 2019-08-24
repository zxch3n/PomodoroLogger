import { DragDropContext, Draggable, Droppable } from 'react-beautiful-dnd';
import React, { FC } from 'react';
import { Card as CardType } from './action';
import styled from 'styled-components';
import formatMarkdown from './formatMarkdown';

const CardContainer = styled.div`
    background-color: white;
    margin: 8px;
    border-radius: 6px;

    h1 {
        font-size: 1.6em;
        font-weight: 800;
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
`;

const CardContent = styled.div`
    padding: 6px;
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
                            <CardContent
                                dangerouslySetInnerHTML={{
                                    __html: formatMarkdown(`# title\n${content}`)
                                }}
                            />
                        </CardContainer>
                        {isDraggingOver && provided.placeholder}
                    </>
                )}
            </Draggable>
        </>
    );
};
