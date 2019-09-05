import { DragDropContext, Droppable, DropResult } from 'react-beautiful-dnd';
import React, { FC } from 'react';
import { BoardActionTypes, KanbanBoard } from './action';
import styled from 'styled-components';
import List from '../List';
import { Button } from 'antd';
import { IdTrend } from '../../Visualization/ProjectTrend';

const Container = styled.div`
    height: 100%;
    width: 100%;
    overflow-x: auto;
`;

const Header = styled.div`
    margin: 6px;
    display: flex;
    flex-direction: row;
    justify-content: space-around;
    align-content: flex-end;
`;

const TrendContainer = styled.div`
    flex: available;
`;

const Description = styled.div`
    flex: auto;
    position: relative;
    height: 45px;

    p:hover {
        background-color: rgba(40, 70, 250, 0.07);
    }

    p {
        position: absolute;
        top: 50%;
        transform: translateY(-50%);
        padding: 8px;
        background-color: rgba(40, 70, 250, 0.04);
        line-height: calc(1em + 4px);
        width: 100%;
    }
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
    doesOnlyShowFocusedList?: boolean;
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

    const { doesOnlyShowFocusedList = false } = props;
    let lists;
    if (doesOnlyShowFocusedList) {
        lists = (provided: any) => (
            <ListContainer ref={provided.innerRef}>
                <List listId={props.focusedList} index={0} key={0} boardId={props.boardId} />
                {provided.placeholder}
            </ListContainer>
        );
    } else {
        lists = (provided: any) => (
            <ListContainer ref={provided.innerRef}>
                {props.lists.map((listId, index) => (
                    <List
                        listId={listId}
                        index={index}
                        key={listId}
                        boardId={props.boardId}
                        focused={listId === props.focusedList}
                    />
                ))}
                {provided.placeholder}
                <ListPlaceholder>
                    <Button onClick={addList} icon={'plus'} shape="circle-outline" />
                </ListPlaceholder>
            </ListContainer>
        );
    }

    return (
        <Container>
            <Header>
                <Description title={`Board ${props.name} description`}>
                    <p>{props.description || <i>No description provided</i>}</p>
                </Description>
                <TrendContainer>
                    <IdTrend boardId={props.boardId} height={40} />
                </TrendContainer>
            </Header>
            <DragDropContext onDragEnd={handleDragEnd}>
                <Droppable droppableId={props._id} type="COLUMN" direction="horizontal">
                    {lists}
                </Droppable>
            </DragDropContext>
        </Container>
    );
};
