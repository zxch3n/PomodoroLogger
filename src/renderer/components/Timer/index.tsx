import { connect } from 'react-redux';
import { Dispatch } from 'redux';

import Timer from './Timer'
import { RootState } from '../../reducers';
import { TimerState, setRestDuration, setFocusDuration,
    startTimer, clearTimer, stopTimer, timerFinished, continueTimer } from './action'
import {actions as todoActions, ActionCreatorTypes as TodoActionCreatorTypes} from '../TODO/action'
import { genMapDispatchToProp } from '../../utils';

const mapStateToProps = (state: RootState) => state;
const todoProps = genMapDispatchToProp<TodoActionCreatorTypes>(todoActions);

const mapDispatchToProps = (dispatch: Dispatch) => ({
    startTimer: () => dispatch(startTimer()),
    stopTimer: () => dispatch(stopTimer()),
    clearTimer: () => dispatch(clearTimer()),
    timerFinished: () => dispatch(timerFinished()),
    continueTimer: () => dispatch(continueTimer()),
    setFocusDuration: (duration: number) => dispatch(setFocusDuration(duration)),
    setRestDuration: (duration: number) => dispatch(setRestDuration(duration)),
    ...todoProps(dispatch)
});

export default connect(mapStateToProps, mapDispatchToProps)(Timer);
