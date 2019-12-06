import React, { useCallback, useState } from 'react';
import { actions as timerActions } from '../../Timer/action';
import { connect } from 'react-redux';
import { RootState } from '../../../reducers';
import { actions, KanbanBoard } from './action';
import { actions as kanbanActions } from '../action';
import { Dispatch } from 'redux';
import styled, { keyframes } from 'styled-components';
import { Card, CardsState } from '../Card/action';
import { ListsState } from '../List/action';
import { Button, Divider } from 'antd';
import { Badge, TimeBadge } from '../Card/Badge';
import formatMarkdown from '../Card/formatMarkdown';
import { IdTrend } from '../../Visualization/ProjectTrend';
import { BadgeHolder } from '../style/Badge';
import { Markdown } from '../style/Markdown';
import { ListsCountBar } from '../../Visualization/Bar';
import { PomodoroDot } from '../../Visualization/PomodoroDot';
import { Pin } from '../../Visualization/Pin';

const BriefCard = styled.div`
    word-break: break-word;
    position: relative;
    display: inline-block;
    padding: 6px;
    background-color: white;
    margin: 6px;
    border-radius: 6px;
    width: 260px;
    min-height: 100px;
    cursor: pointer;
    transition: box-shadow 0.5s, transform 0.5s;

    :hover {
        box-shadow: 2px 2px 4px 4px rgba(0, 0, 0, 0.14);
        transform: translate(-3px -3px);
        z-index: 100;
    }
`;

const clipAnimation = keyframes`
  0% {
    clip-path: inset(0 100% 0 0);
  }
  20% {
    clip-path: inset(0 0 0 0);
  }
  85% {
    clip-path: inset(0 0 0 0);
  }
  100% {
    clip-path: inset(0 0 0 100%);
  }
`;

const AnimTrend = styled.div`
    position: absolute;
    width: 100%;
    height: 40px;
    z-index: -1;
    opacity: 0.5;
    bottom: 16px;

    svg {
        animation: ${clipAnimation} 3s linear infinite;
        animation-delay: 0.4s;
        clip-path: inset(100%);
    }
`;

const Content = styled.div`
    position: relative;
    padding: 0 8px;
`;

const Header = styled.div`
    margin-top: 6px;
    margin-bottom: 4px;
    padding: 0 6px;
    display: flex;
    justify-content: space-between;

    h1 {
        max-width: 180px;
        word-break: break-all;
    }
`;

interface InputProps {
    onClick?: () => void;
}

interface Props extends KanbanBoard, InputProps {
    choose: () => void;
    configure: () => void;
    listsById: ListsState;
    cardsById: CardsState;
    setPin: (pin: boolean) => void;
}

type NewCard = Card & { isDone?: boolean };
const _BoardBrief: React.FC<Props> = (props: Props) => {
    if (props._id === undefined) {
        return <></>;
    }

    const { name, lists, listsById, doneList, cardsById, onClick, spentHours } = props;
    const [hover, setHover] = useState(false);
    const onMouseEnter = () => {
        setHover(true);
    };
    const onMouseLeave = () => {
        setHover(false);
    };
    const cards: NewCard[] = lists.reduce((l: NewCard[], listId) => {
        for (const cardId of listsById[listId].cards) {
            const card: NewCard = cardsById[cardId];
            card.isDone = listId === doneList;
            l.push(card);
        }
        return l;
    }, []);
    let showErr = false;
    const [estimatedLeftTimeSum, actualTimeSum, errorSum, n] = cards.reduce(
        (l: number[], r: NewCard) => {
            let err = 0;
            const { actual, estimated } = r.spentTimeInHour;
            if (r.isDone && actual !== 0 && estimated !== 0) {
                err = (Math.abs(estimated - actual) / actual) * 100;
                showErr = true;
            }

            return [
                l[0] + (r.isDone ? 0 : Math.max(0, estimated - actual)),
                l[1] + actual,
                l[2] + err,
                l[3] + (r.isDone ? 1 : 0)
            ];
        },
        [0, 0, 0, 0]
    );

    const avgErr = errorSum / n;
    let acc;
    let accColor;
    if (avgErr < 5) {
        acc = 'Perfect';
        accColor = 'green';
    } else if (avgErr < 10) {
        acc = 'Good';
        accColor = 'green';
    } else if (avgErr < 20) {
        acc = 'Fair';
        accColor = '#ffe313';
    } else if (avgErr < 30) {
        acc = 'Poor';
        accColor = '#ffa027';
    } else {
        acc = 'Bad';
        accColor = '#ff350e';
    }

    const onSettingClick = (event: any) => {
        event.preventDefault();
        event.stopPropagation();
        props.configure();
        props.onSettingClick!();
    };

    return (
        <BriefCard
            onClick={onClick}
            onMouseLeave={onMouseLeave}
            onMouseEnter={onMouseEnter}
            className={'kanban-brief-card'}
        >
            <Header>
                <h1>
                    {name}
                    <Pin
                        isPin={!!props.pin}
                        onClick={useCallback(() => props.setPin(!props.pin), [
                            props._id,
                            props.pin
                        ])}
                        isHover={hover}
                        style={{ marginLeft: 4 }}
                    />
                </h1>
                <span>
                    <Button
                        type={'default'}
                        shape={'circle'}
                        icon={'caret-right'}
                        onClick={props.choose}
                        size={'small'}
                        style={{ marginRight: 6 }}
                    />
                    {props.onSettingClick ? (
                        <Button
                            type={'default'}
                            icon={'setting'}
                            shape={'circle'}
                            onClick={onSettingClick}
                            size={'small'}
                        />
                    ) : (
                        undefined
                    )}
                </span>
            </Header>
            <Content>
                {props.description ? (
                    <Markdown
                        dangerouslySetInnerHTML={{ __html: formatMarkdown(props.description) }}
                    />
                ) : (
                    undefined
                )}
                <ListsCountBar boardId={props._id} height={40} />
                {props.relatedSessions.length ? (
                    <AnimTrend style={{ display: hover ? undefined : 'none' }}>
                        <IdTrend boardId={props._id} />
                    </AnimTrend>
                ) : (
                    undefined
                )}
            </Content>
            <Divider style={{ margin: '6px 0' }} />
            <BadgeHolder>
                <PomodoroDot num={props.relatedSessions.length} />
                {actualTimeSum + estimatedLeftTimeSum ? (
                    <TimeBadge spentTime={actualTimeSum} leftTime={estimatedLeftTimeSum} />
                ) : (
                    undefined
                )}
                {showErr ? (
                    <Badge
                        type={'accuracy'}
                        value={acc}
                        color={accColor}
                        title={'Estimate accuracy'}
                    />
                ) : (
                    undefined
                )}
            </BadgeHolder>
        </BriefCard>
    );
};

interface InputProps {
    boardId: string;
    onSettingClick?: () => void;
}

export const BoardBrief = connect(
    (state: RootState, props: InputProps) => ({
        ...state.kanban.boards[props.boardId],
        listsById: state.kanban.lists,
        cardsById: state.kanban.cards
    }),
    (dispatch: Dispatch, props: InputProps) => ({
        choose: () => {
            dispatch(timerActions.changeAppTab('timer'));
            dispatch(timerActions.setBoardId(props.boardId));
        },
        configure: () => dispatch(kanbanActions.setConfiguringBoardId(props.boardId)),
        setPin: (pin: boolean) => actions.setPin(props.boardId, pin)(dispatch)
    })
)(_BoardBrief);
