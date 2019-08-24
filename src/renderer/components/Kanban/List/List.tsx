import { DragDropContext, Draggable, Droppable } from 'react-beautiful-dnd';
import React, { FC } from 'react';
import { List as ListType, ListActionTypes } from './action';
import styled from 'styled-components';
import Card from '../Card';
import { Button } from 'antd';

const Container = styled.div`
    padding: 8px;
    margin: 12px;
    border-radius: 8px;
    background-color: blue;
`;

const ListHead = styled.div`
    width: 145px;
    background-color: white;
    border-radius: 8px;
`;

const Cards = styled.div``;

export interface InputProps {
    listId: string;
    index: number;
    boardId: string;
}

interface Props extends ListType, InputProps, ListActionTypes {}
export const List: FC<Props> = (props: Props) => {
    const addCard = () => {
        props.addCard(props._id, 'TestCard');
    };

    return (
        <Draggable
            draggableId={props.listId}
            index={props.index}
            disableInteractiveElementBlocking={true}
        >
            {(provided, { draggingOver }) => (
                <div>
                    <Container ref={provided.innerRef} {...provided.draggableProps}>
                        <ListHead {...provided.dragHandleProps}>
                            <h1>{props.title} </h1>
                            <p>
                                {props.listId} {props._id} {props.index}
                            </p>
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
                                </Cards>
                            )}
                        </Droppable>
                        <Button onClick={addCard}>Add Card</Button>
                    </Container>
                    {provided.placeholder}
                </div>
            )}
        </Draggable>
    );
};
