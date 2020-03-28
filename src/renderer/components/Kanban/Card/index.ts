import { connect } from 'react-redux';
import { Card, InputProps } from './Card';
import { RootState } from '../../../reducers';
import { CardActionTypes, actions } from './action';
import { KanbanActionTypes, actions as kanbanActions } from '../action';
import { genMapDispatchToProp } from '../../../utils';

const mapStateToProps = (state: RootState, props: InputProps) => {
    return {
        ...state.kanban.cards[props.cardId],
        collapsed: state.kanban.boards[props.boardId].collapsed
    };
};

const mapDispatchToProps = genMapDispatchToProp<CardActionTypes & KanbanActionTypes>({
    ...actions,
    ...kanbanActions
});
export default connect(mapStateToProps, mapDispatchToProps)(Card);
