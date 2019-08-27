import { DragDropContext, Droppable, DropResult } from 'react-beautiful-dnd';
import React, { FC, useEffect } from 'react';
import { KanbanBoard, BoardActionTypes } from './action';
import styled from 'styled-components';
import List from '../List';
import { Button } from 'antd';

const Container = styled.div`
    height: 100%;
    width: 100%;
    overflow-x: auto;
`;

const ListContainer = styled.div`
    display: flex;
    flex-direction: row;
    align-content: space-around;
`;

const ListPlaceholder = styled.div`
    margin: 4px;
    max-height: 4em;
    min-width: 200px;
    border-radius: 8px;
    border: 1px dashed rgba(0, 0, 0, 0.2);
    position: relative;
    display: flex;
    justify-content: center;
    align-items: center;
`;

export interface InputProps {
    boardId: string;
}

interface Props extends KanbanBoard, BoardActionTypes, InputProps {}
export const Board: FC<Props> = (props: Props) => {
    const handleDragEnd = ({ source, destination, type }: DropResult) => {
        // dropped outside the list
        if (!destination) {
            return;
        }
        if (type === 'COLUMN') {
            // Prevent update if nothing has changed
            if (source.index !== destination.index) {
                props.moveList(source.droppableId, source.index, destination.index);
            }
            return;
        }
        // Move card
        if (source.index !== destination.index || source.droppableId !== destination.droppableId) {
            props.moveCard(
                source.droppableId,
                destination.droppableId,
                source.index,
                destination.index
            );
        }
    };

    const addList = async () => {
        await props.addList(props._id, 'TestList');
    };

    return (
        <Container>
            <DragDropContext onDragEnd={handleDragEnd}>
                <Droppable droppableId={props._id} type="COLUMN" direction="horizontal">
                    {provided => (
                        <ListContainer ref={provided.innerRef}>
                            {props.lists.map((listId, index) => (
                                <List
                                    listId={listId}
                                    index={index}
                                    key={listId}
                                    boardId={props.boardId}
                                />
                            ))}
                            {provided.placeholder}
                            <ListPlaceholder>
                                <Button onClick={addList} icon={'plus'} shape="circle-outline" />
                            </ListPlaceholder>
                        </ListContainer>
                    )}
                </Droppable>
            </DragDropContext>
        </Container>
    );
};
