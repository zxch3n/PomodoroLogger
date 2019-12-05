import { connect } from 'react-redux';
import { actions as timerActions } from '../Timer/action';
import { History } from './History';
import { RootState } from '../../reducers';
import { genMapDispatchToProp } from '../../utils';
import { HistoryActionCreatorTypes, actions } from './action';
import { PomodoroRecord } from '../../monitor/type';

const mapStateToProps = (state: RootState) => ({
    chosenId: state.history.chosenProjectId,
    expiringKey: state.history.expiringKey,
    boards: state.kanban.boards
});
const mapDispatchToProps = genMapDispatchToProp<
    HistoryActionCreatorTypes & { chooseRecord: (r: PomodoroRecord) => void }
>({
    ...actions,
    chooseRecord: timerActions.setChosenRecord
});

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(History);
