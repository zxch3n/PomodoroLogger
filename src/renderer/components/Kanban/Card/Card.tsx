import { Draggable } from 'react-beautiful-dnd';
import React, { FC } from 'react';
import { CardActionTypes } from './action';
import { KanbanActionTypes } from '../action';
import styled from 'styled-components';
import { Divider } from 'antd';
import formatMarkdown from './formatMarkdown';
import { TimeBadge } from '../../../../components/Visualization/Badge/Badge';
import { BadgeHolder } from '../style/Badge';
import { Markdown } from '../style/Markdown';
import { PomodoroDot } from '../../Visualization/PomodoroDot';
import { Card as CardType } from '../type';
import { matchParent } from '../../../utils';
import { useSelector } from 'react-redux';
import { RootState } from '../../../reducers';
import { check } from 'prettier';

/**
 * If you're using z-index, make sure the element has a defined position attribute or it won't work.
 * Wherever you use z-index in your css, define the position of that element. (Absolute, relative, inherit...)
 * https://stackoverflow.com/a/23067835/8169341
 */
const CardContainer = styled.div`
    position: relative;
    width: 262px;
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
        z-index: 5;
        box-shadow: 0 0 18px 8px rgba(0, 0, 0, 0.1);
    }
`;

const CardContent = styled.div`
    padding: 4px 12px 4px 12px;
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
    const [tagManager] = useSelector((rootState: RootState) => [
        rootState.kanban.kanban.tagManager,
    ]);
    const markdownRef = React.useRef<HTMLDivElement>(null);
    const { index, _id, isDraggingOver, listId } = props;
    const onClick = React.useCallback(
        (e: React.MouseEvent<HTMLDivElement>) => {
            const target = e.nativeEvent.target as HTMLElement;
            const tag = matchParent(target, '.pl-tag');
            const checkbox = matchParent(target, '[type="checkbox"]');
            if (tag && tag.textContent) {
                props.setSearchReg(tag.textContent);
                e.stopPropagation();
            } else if (checkbox) {
                if (!markdownRef.current) {
                    return;
                }

                const checkboxes = markdownRef.current.querySelectorAll('[type="checkbox"]');
                let checkboxIndex = -1;
                let index = 0;
                for (const x of Array.from(checkboxes)) {
                    if (x === checkbox) {
                        checkboxIndex = index;
                        break;
                    }

                    index += 1;
                }

                const reg = /\[(x| )\]/g;
                let match: null | undefined | RegExpExecArray;
                for (let i = 0; i < checkboxIndex + 1; i += 1) {
                    match = reg.exec(props.content);
                }

                if (match && match.length > 1) {
                    const char = match[1] === 'x' ? ' ' : 'x';
                    props.setContent(
                        _id,
                        `${props.content.slice(0, match.index)}[${char}]${props.content.slice(
                            match.index + 3
                        )}`
                    );
                }
            } else {
                props.setEditCard(true, props.listId, props._id);
            }
        },
        [listId, _id, props.content]
    );
    const content = React.useMemo(() => {
        if (!props.searchReg) {
            return props.content;
        }

        let reg: undefined | RegExp;
        try {
            reg = new RegExp(props.searchReg, 'gimsu');
        } catch (e) {}
        if (!reg) {
            return props.content;
        }

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
                                        <BadgeHolder className="collapsed">
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
                                                    collapsed={true}
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
                                                __html: formatMarkdown(content, {
                                                    registerTag: (tag) => {
                                                        tagManager.push(tag, {
                                                            boardId: props.boardId,
                                                            listId: props.listId,
                                                            cardId: props.cardId,
                                                        });
                                                    },
                                                }),
                                            }}
                                            style={{ maxHeight: 250 }}
                                            ref={markdownRef}
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
                                                        props.spentTimeInHour.estimated === 0
                                                            ? undefined
                                                            : props.spentTimeInHour.estimated -
                                                              props.spentTimeInHour.actual
                                                    }
                                                />
                                            ) : undefined}
                                        </BadgeHolder>
                                    </CardContent>
                                )}
                            </CardContainer>
                            {
                                // @ts-ignore
                                isDraggingOver && provided.placeholder
                            }
                        </>
                    );
                }}
            </Draggable>
        </>
    );
});
