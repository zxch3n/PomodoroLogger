import { Draggable } from 'react-beautiful-dnd';
import React, { FC } from 'react';
import { CardActionTypes } from './action';
import { KanbanActionTypes } from '../action';
import styled from 'styled-components';
import { Divider } from 'antd';
import formatMarkdown from './formatMarkdown';
import { TimeBadge } from './Badge';
import { BadgeHolder } from '../style/Badge';
import { Markdown } from '../style/Markdown';
import { PomodoroDot } from '../../Visualization/PomodoroDot';
import { Card as CardType } from '../type';

const CardContainer = styled.div`
    word-break: break-word;
    background-color: white;
    margin: 8px 4px 0 4px;
    border-radius: 6px;
    cursor: grab;
    box-shadow: 0 0 rgba(0, 0, 0, 0);
    transition: box-shadow 200ms;
    z-index: 0;
    &.is-dragging {
        z-index: 1;
        box-shadow: 0 0 18px 8px rgba(0, 0, 0, 0.2);
    }
    :hover {
        z-index: 1;
        box-shadow: 0 0 18px 8px rgba(0, 0, 0, 0.1);
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
    boardId: string;
    isDraggingOver: boolean;
    searchReg?: string;
}

interface Props extends CardType, InputProps, CardActionTypes, KanbanActionTypes {
    collapsed?: boolean;
}
export const Card: FC<Props> = React.memo((props: Props) => {
    const { index, _id, isDraggingOver } = props;
    const onClick = React.useCallback(() => {
        props.setEditCard(true, props.listId, props._id);
    }, [props.listId, props._id]);
    const content = React.useMemo(() => {
        if (!props.searchReg) {
            return props.content;
        }

        const reg = new RegExp(props.searchReg, 'gimsu');
        const oldContent = props.content;
        let newContent = '';
        let lastEnd = 0;
        let matched = reg.exec(oldContent);
        while (matched) {
            if (!matched.length) {
                break;
            }

            newContent += oldContent.slice(lastEnd, matched.index);
            newContent += `<span class="search-highlight">${matched[0]}</span>`;
            lastEnd = matched.index + matched[0].length;
            matched = reg.exec(oldContent);
        }

        newContent += oldContent.slice(lastEnd);
        return newContent;
    }, [props.content, props.searchReg]);

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
                                {props.collapsed ? (
                                    <CardContent>
                                        <h3
                                            style={{
                                                margin: 0,
                                                fontSize: 16,
                                                lineHeight: '1.3rem',
                                            }}
                                        >
                                            {props.title}
                                        </h3>
                                        <BadgeHolder>
                                            {props.sessionIds.length > 0 ? (
                                                <PomodoroDot num={props.sessionIds.length} />
                                            ) : undefined}
                                            {props.spentTimeInHour.estimated ||
                                            props.spentTimeInHour.actual ? (
                                                <TimeBadge
                                                    spentTime={props.spentTimeInHour.actual}
                                                    leftTime={
                                                        props.spentTimeInHour.estimated -
                                                        props.spentTimeInHour.actual
                                                    }
                                                />
                                            ) : undefined}
                                        </BadgeHolder>
                                    </CardContent>
                                ) : (
                                    <CardContent>
                                        <h1
                                            style={{
                                                margin: 0,
                                                fontSize: '1.1rem',
                                                lineHeight: '1.3em',
                                            }}
                                        >
                                            {props.title}
                                        </h1>
                                        <Markdown
                                            dangerouslySetInnerHTML={{
                                                __html: formatMarkdown(content),
                                            }}
                                            style={{ maxHeight: 250 }}
                                        />
                                        <Divider style={{ margin: '0 0 4px 0' }} />
                                        <BadgeHolder>
                                            {props.sessionIds.length > 0 ? (
                                                <PomodoroDot num={props.sessionIds.length} />
                                            ) : undefined}
                                            {props.spentTimeInHour.estimated ||
                                            props.spentTimeInHour.actual ? (
                                                <TimeBadge
                                                    spentTime={props.spentTimeInHour.actual}
                                                    leftTime={
                                                        props.spentTimeInHour.estimated -
                                                        props.spentTimeInHour.actual
                                                    }
                                                />
                                            ) : undefined}
                                        </BadgeHolder>
                                    </CardContent>
                                )}
                            </CardContainer>
                            {isDraggingOver && provided.placeholder}
                        </>
                    );
                }}
            </Draggable>
        </>
    );
});
