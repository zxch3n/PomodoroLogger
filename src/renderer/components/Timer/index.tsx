import { connect } from 'react-redux';

import Timer from './Timer';
import { RootState } from '../../reducers';
import { TimerActionTypes, actions } from './action';
import { KanbanActionTypes, actions as kanbanActions } from '../Kanban/action';
import { BoardActionTypes, actions as boardActions } from '../Kanban/Board/action';
import { genMapDispatchToProp } from '../../utils';

const mapStateToProps = (state: RootState) => state;
const mapDispatchToProps = genMapDispatchToProp<
    KanbanActionTypes & TimerActionTypes & BoardActionTypes
>({
    ...kanbanActions,
    ...actions,
    ...boardActions
});
export default connect(
    mapStateToProps,
    mapDispatchToProps
)(Timer);
