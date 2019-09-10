import * as React from 'react';
import { connect } from 'react-redux';
import { RootState } from '../../../reducers';
import { actions, KanbanBoard } from './action';
import { actions as kanbanActions } from '../action';
import { Dispatch } from 'redux';
import styled from 'styled-components';
import { Card, CardsState } from '../Card/action';
import { ListsState } from '../List/action';
import { Button, Divider } from 'antd';
import { Badge } from '../Card/Badge';
import { formatTime } from '../../../utils';
import formatMarkdown from '../Card/formatMarkdown';
import { IdTrend } from '../../Visualization/ProjectTrend';
import { BadgeHolder } from '../style/Badge';
import { Markdown } from '../style/Markdown';

const BriefCard = styled.div`
    display: inline-block;
    padding: 6px;
    background-color: white;
    margin: 6px;
    border-radius: 6px;
    width: 260px;
    min-height: 100px;
    cursor: pointer;
    transition: transform 0.3s;
    
    :hover {
      box-shadow: 2px 2px 4px 4px rgba(0, 0, 0, 0.14);
      transform: translate(-3px, -3px);
    }
`;

const Content = styled.div`
  
`;

const Header = styled.div`
  margin-bottom: 4px;
  display: flex;
  justify-content: space-between;
  
  h1 {
    max-width: 180px;
    word-break: break-all;
  }
`;


interface InputProps {
    onClick?: ()=>void
}

interface Props extends KanbanBoard, InputProps{
    delete: ()=>void,
    choose: ()=>void,
    listsById: ListsState,
    cardsById: CardsState,
}


type NewCard = Card & { isDone?: boolean };
const _BoardBrief: React.FC<Props> = (props: Props) => {
    const { name, lists, relatedSessions, _id, listsById, doneList, cardsById, onClick } = props;
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

    const onSettingClick = (event: any)=>{
        event.preventDefault();
        event.stopPropagation();
        props.onSettingClick!();
    };

    return (

        <BriefCard onClick={onClick}>
            <Header>
                <h1>{name}</h1>
                <span>
                    {
                        props.onSettingClick? (
                            <Button
                                type={'default'}
                                icon={'setting'}
                                shape={'circle'}
                                onClick={onSettingClick}
                            />
                        ) : undefined
                    }
                </span>
            </Header>
            <Content>
                {
                    props.description? (
                        <Markdown dangerouslySetInnerHTML={{__html: formatMarkdown(props.description)}}/>
                    ) : (
                        <i>No description provided</i>
                    )
                }
                {
                    props.relatedSessions.length? (
                        <IdTrend boardId={props._id}/>
                    ) : undefined
                }
            </Content>
            <Divider style={{margin: '6px '}}/>
            <BadgeHolder>
                {
                    estimatedLeftTimeSum? (
                        <Badge type={'left'} value={formatTime(estimatedLeftTimeSum)}/>
                    ) : undefined
                }
                <Badge type={'spent-time'} value={formatTime(actualTimeSum)}/>
                {
                    showErr? (
                        <Badge type={'accuracy'} value={acc} color={accColor} title={'Estimate accuracy'}/>
                    ) : undefined
                }
            </BadgeHolder>
        </BriefCard>
    )
};


interface InputProps {
    boardId: string,
    onSettingClick?: ()=>void
}


export const BoardBrief = connect(
    (state: RootState, props: InputProps) => ({
        ...state.kanban.boards[props.boardId],
        listsById: state.kanban.lists,
        cardsById: state.kanban.cards,
    }),
    (dispatch: Dispatch, props: InputProps) => ({
        delete: () => actions.deleteBoard(props.boardId)(dispatch),
        choose: () => dispatch(kanbanActions.setChosenBoardId(props.boardId))
    })

)(_BoardBrief);
