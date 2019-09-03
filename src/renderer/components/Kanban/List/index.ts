import { connect } from 'react-redux';
import { List, InputProps } from './List';
import { KanbanActionTypes, actions as kanbanActions } from '../action';
import { RootState } from '../../../reducers';
import { ListActionTypes, actions } from './action';
import { genMapDispatchToProp } from '../../../utils';

const mapStateToProps = (state: RootState, props: InputProps) => {
    return {
        ...state.kanban.lists[props.listId],
        searchReg: state.kanban.kanban.searchReg,
        cardsState: state.kanban.cards
    };
};

const mapDispatchToProps = genMapDispatchToProp<ListActionTypes & KanbanActionTypes>({
    ...actions,
    ...kanbanActions
});
export default connect(
    mapStateToProps,
    mapDispatchToProps
)(List);
