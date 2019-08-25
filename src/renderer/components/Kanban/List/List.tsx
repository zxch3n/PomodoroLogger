import { DragDropContext, Draggable, Droppable } from 'react-beautiful-dnd';
import React, { FC } from 'react';
import { List as ListType, ListActionTypes } from './action';
import styled from 'styled-components';
import Card from '../Card';
import { Button } from 'antd';

const Container = styled.div`
    padding: 4px;
    margin: 6px;
    border-radius: 6px;
    background-color: white;
`;

const ListHead = styled.div`
    width: 250px;
    padding: 4px 12px;
    background-color: white;
    border-radius: 6px;
`;

const Cards = styled.div`
    padding: 2px 2px;
    background-color: #dedede;
    border-radius: 4px;
`;

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
        <Draggable draggableId={props.listId} index={props.index}>
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
                                    <div style={{ margin: '0 auto', textAlign: 'center' }}>
                                        <Button onClick={addCard} shape={'circle'} icon="plus" />
                                    </div>
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
