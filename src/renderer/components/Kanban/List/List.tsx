import { Draggable, Droppable } from 'react-beautiful-dnd';
import FocusIcon from '../../../../res/Focus.svg';
import DoneIcon from '../../../../res/done.svg';
import React, { FC, useRef, useState, useEffect } from 'react';
import { ListActionTypes } from './action';
import styled from 'styled-components';
import Card from '../Card';
import { Button, Dropdown, Icon, Input, Menu, message, Popconfirm, Tooltip } from 'antd';
import { KanbanActionTypes } from '../action';
import { CardsState } from '../Card/action';
import { List as ListType } from '../type';
import { mergeRefs } from '../../../utils';
import { throttle, debounce } from 'lodash';

const Container = styled.div`
    padding: 4px;
    margin: 6px;
    border-radius: 6px;
    background-color: rgb(254, 254, 254);
`;

const ListHead = styled.div`
    user-select: none;
    height: 4em;
    min-width: 250px;
    padding: 4px 12px;
    background-color: rgb(254, 254, 254);
    border-radius: 6px;
    position: relative;

    h1 {
        font-size: 18px;
        margin: 0;
    }

    .list-head-text {
        user-select: none;
        position: absolute;
        top: 24px;
        transform: translateY(-50%);
        left: 8px;
    }

    .list-head-icon {
        position: absolute;
        top: 20px;
        transform: translateY(-50%);
        right: 8px;
        cursor: pointer;
    }

    .list-head-icon i:hover {
        color: #0074d9;
    }
`;

// Using css ::before and ::after will cause dnd component jitter
const BeforePlaceHolder = styled.div`
    position: sticky;
    display: block;
    top: -2px;
    width: 100%;
    height: 0.6rem;
    margin-bottom: 10px;
    background: linear-gradient(
        rgba(222, 222, 222, 1),
        rgba(222, 222, 222, 0.001)
    ); /* transparent keyword is broken in Safari */
    pointer-events: none;
    z-index: 1;
`;

const AfterPlaceHolder = styled.div`
    content: '';
    margin-top: 20px;
    position: sticky;
    display: block;
    bottom: -2px;
    width: 100%;
    height: 0.6rem;
    background: linear-gradient(
        rgba(222, 222, 222, 0.001),
        rgba(222, 222, 222, 1)
    ); /* transparent keyword is broken in Safari */
    pointer-events: none;
    z-index: 1;
`;

interface CardsProps {
    displayScrollbar: boolean;
}

const displayScrollbarFn = ({ displayScrollbar }: CardsProps) => {
    if (displayScrollbar) {
        return `
            color: rgba(0, 0, 0, 0.2);
            transition: color 250ms;
        `;
    }

    return `
        color: rgba(0, 0, 0, 0);
        transition: color 250ms;
    `;
};

const Cards = styled.div<CardsProps>`
    position: relative;
    padding: 0;
    background-color: #dedede;
    border-radius: 4px;
    max-height: calc(100vh - 230px);
    overflow-y: overlay;
    overflow-x: visible;
    min-height: 200px;
    max-width: 270px;
    & > * {
        color: black;
    }

    ${displayScrollbarFn} ::-webkit-scrollbar {
        width: 4px;
        height: 4px;
        background-color: rgba(0, 0, 0, 0);
    }

    ::-webkit-scrollbar-track {
        width: 4px;
        background-color: rgba(0, 0, 0, 0);
    }

    ::-webkit-scrollbar-thumb {
        background-color: transparent;
        box-shadow: inset 0 0 0 10px;
        width: 4px;
        border-radius: 4px;
    }
`;

const ButtonWrapper = styled.div`
    margin-top: 4px;
    text-align: center;
    position: sticky;
    left: 50%;
    bottom: 0;
    display: flex;
    justify-content: center;
`;

export interface InputProps {
    listId: string;
    index: number;
    boardId: string;
    focused?: boolean;
    done?: boolean;
}

interface Props extends ListType, InputProps, ListActionTypes, KanbanActionTypes {
    searchReg?: string;
    cardsState: CardsState;
}

export const List: FC<Props> = React.memo((props: Props) => {
    const { focused = false, searchReg, cards, cardsState, done = false } = props;
    const cardListRef = React.useRef<HTMLElement>(null);
    const [showScrollBar, setShowScrollBar] = useState(true);
    React.useEffect(() => {
        if (!cardListRef.current) {
            return;
        }

        const hideScrollBar = debounce(() => {
            setShowScrollBar(false);
        }, 600);

        const onScroll = throttle(() => {
            setShowScrollBar(true);
            hideScrollBar();
        }, 30);

        cardListRef.current.addEventListener('scroll', onScroll);
        hideScrollBar();
        return () => {
            cardListRef.current?.removeEventListener('scroll', onScroll);
        };
    }, []);

    const visibleCards = React.useMemo(() => {
        let reg: RegExp | undefined;
        try {
            reg = searchReg ? new RegExp(searchReg, 'gimsu') : undefined;
        } catch (e) {}

        if (reg == null) {
            props.setVisibleCards(props._id, undefined);
            return undefined;
        }

        const visibleCards_ = cards.filter((id) => {
            if (!reg) return true;
            const card = cardsState[id];
            return card.title.match(reg) || card.content.match(reg);
        });
        props.setVisibleCards(props._id, visibleCards_);
        return visibleCards_;
    }, [props._id, searchReg, props.cardsState, cards]);

    const filteredCards = visibleCards || props.cards || [];
    const [estimatedTimeSum, actualTimeSum] = React.useMemo(
        () =>
            filteredCards.reduce(
                (l: [number, number], r: string) => {
                    return [
                        l[0] + props.cardsState[r].spentTimeInHour.estimated,
                        l[1] + props.cardsState[r].spentTimeInHour.actual,
                    ] as [number, number];
                },
                [0, 0] as [number, number]
            ),
        [filteredCards, props.cardsState]
    );
    const overallTimeInfo =
        estimatedTimeSum > 0 ? `${actualTimeSum.toFixed(1)}h/${estimatedTimeSum.toFixed(1)}h` : '';
    const [isEditing, setIsEditing] = useState(false);
    const [value, setValue] = useState('');
    const inputRef = useRef<Input>();

    const addCard = () => {
        props.setEditCard(true, props.listId, undefined);
    };

    const onDelete = () => {
        if (focused || done) {
            message.warn('Cannot delete the focused / done list.');
            return;
        }

        props.deleteList(props._id, props.boardId);
    };

    const onSave = () => {
        props.renameList(props._id, value);
        setIsEditing(false);
    };

    const onValueChange = (e: any) => {
        setValue(e.target.value);
    };

    const onEdit = () => {
        setValue(props.title);
        setIsEditing(true);
        if (!inputRef.current) {
            return;
        }

        inputRef.current.focus();
    };

    const popConfirmRef = useRef<Popconfirm>();
    const onPreDelete = React.useCallback(() => {
        if (popConfirmRef.current) {
            popConfirmRef.current.setVisible(true);
        }
    }, []);

    const menu = React.useMemo(
        () =>
            !focused && !done ? (
                <Menu>
                    <Menu.Item key="1" onClick={onEdit}>
                        <Icon type={'setting'} /> Edit
                    </Menu.Item>
                    <Menu.Divider />
                    <Menu.Item key="3" onClick={onPreDelete}>
                        <Popconfirm
                            title={'Are you sure?'}
                            onConfirm={onDelete}
                            ref={popConfirmRef as any}
                        >
                            <Icon type={'delete'} /> Delete
                        </Popconfirm>
                    </Menu.Item>
                </Menu>
            ) : (
                <Menu>
                    <Menu.Item key="1" onClick={onEdit}>
                        <Icon type={'setting'} /> Edit
                    </Menu.Item>
                </Menu>
            ),
        [onDelete, focused, done, onPreDelete]
    );

    return (
        <Draggable draggableId={props.listId} index={props.index}>
            {(provided, { draggingOver }) => (
                <div>
                    <Container
                        ref={provided.innerRef}
                        className={'kanban-list'}
                        id={props.focused ? 'focused-list' : props.done ? 'done-list' : undefined}
                        {...provided.draggableProps}
                    >
                        <ListHead {...provided.dragHandleProps}>
                            {isEditing ? (
                                <div
                                    style={{
                                        display: 'flex',
                                        flexDirection: 'row',
                                        justifyContent: 'space-between',
                                    }}
                                >
                                    <Input maxLength={25} value={value} onChange={onValueChange} />
                                    <Button onClick={onSave}>Save</Button>
                                </div>
                            ) : (
                                <>
                                    <span className="list-head-text">
                                        <h1>{props.title}</h1>
                                        <span>
                                            {searchReg == null ? (
                                                <>
                                                    {props.cards.length} Card
                                                    {props.cards.length > 1 ? 's ' : ' '}
                                                </>
                                            ) : (
                                                <>
                                                    {filteredCards.length} / {props.cards.length}
                                                </>
                                            )}
                                            &nbsp; {overallTimeInfo}
                                        </span>
                                    </span>
                                    <div className="list-head-icon">
                                        {focused ? (
                                            <Tooltip title={'Focused List'}>
                                                <span style={{ color: 'red', marginRight: 8 }}>
                                                    <Icon component={FocusIcon} />
                                                </span>
                                            </Tooltip>
                                        ) : undefined}
                                        {done ? (
                                            <Tooltip title={'Done List'}>
                                                <span style={{ color: 'green', marginRight: 8 }}>
                                                    <Icon component={DoneIcon} />
                                                </span>
                                            </Tooltip>
                                        ) : undefined}
                                        <Dropdown overlay={menu} trigger={['click']}>
                                            <Icon type="menu" />
                                        </Dropdown>
                                    </div>
                                </>
                            )}
                        </ListHead>
                        <Droppable droppableId={props._id}>
                            {(provided, { isDraggingOver }) => {
                                const mergedRef = mergeRefs([
                                    provided.innerRef,
                                    cardListRef,
                                ]) as React.RefObject<HTMLDivElement>;
                                return (
                                    <Cards
                                        ref={mergedRef}
                                        displayScrollbar={showScrollBar}
                                        {...provided.droppableProps}
                                    >
                                        <BeforePlaceHolder />
                                        {filteredCards.map((cardId, index) => (
                                            <Card
                                                boardId={props.boardId}
                                                cardId={cardId}
                                                index={index}
                                                key={cardId}
                                                listId={props.listId}
                                                isDraggingOver={isDraggingOver}
                                                searchReg={searchReg}
                                            />
                                        ))}
                                        {provided.placeholder}
                                        <AfterPlaceHolder />
                                    </Cards>
                                );
                            }}
                        </Droppable>
                        <ButtonWrapper>
                            <Button
                                onClick={addCard}
                                shape={'circle'}
                                icon="plus"
                                id={'create-card-button'}
                            />
                        </ButtonWrapper>
                    </Container>
                    {provided.placeholder}
                </div>
            )}
        </Draggable>
    );
});
