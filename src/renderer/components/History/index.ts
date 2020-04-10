import { connect } from 'react-redux';
import { actions as timerActions } from '../Timer/action';
import { History } from './History';
import { RootState } from '../../reducers';
import { genMapDispatchToProp } from '../../utils';
import { HistoryActionCreatorTypes, actions } from './action';
import { PomodoroRecord } from '../../monitor/type';
import { Card } from '../Kanban/type';

type CardGetter = (boardId: string | undefined) => Card[];
let cardsGetter: undefined | CardGetter;
let lastRootState: undefined | RootState;
const getCardsGetter = (state: RootState): CardGetter => {
    if (
        state.kanban.boards === lastRootState?.kanban.boards &&
        state.kanban.lists === lastRootState?.kanban.lists &&
        state.kanban.cards === lastRootState?.kanban.cards
    ) {
        return cardsGetter!;
    }

    lastRootState = state;
    cardsGetter = (boardId: string | undefined): Card[] => {
        if (boardId == null) {
            return Object.values(state.kanban.cards);
        }

        const cardIds: string[] = [];
        for (const listId of state.kanban.boards[boardId].lists) {
            cardIds.concat(state.kanban.lists[listId].cards);
        }

        return cardIds.map((id) => state.kanban.cards[id]);
    };

    return cardsGetter;
};

const mapStateToProps = (state: RootState) => ({
    chosenId: state.history.chosenProjectId,
    expiringKey: state.history.expiringKey,
    boards: state.kanban.boards,
    getCardsByBoardId: getCardsGetter(state),
});
const mapDispatchToProps = genMapDispatchToProp<
    HistoryActionCreatorTypes & { chooseRecord: (r: PomodoroRecord) => void }
>({
    ...actions,
    chooseRecord: timerActions.setChosenRecord,
});

export default connect(mapStateToProps, mapDispatchToProps)(History);
