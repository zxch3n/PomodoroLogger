import { connect } from 'react-redux';

import Timer from './Timer';
import { RootState } from '../../reducers';
import { actions } from './action';
import {
    ActionCreatorTypes as TodoActionCreatorTypes,
    actions as todoActions
} from '../TODO/action';
import { genMapDispatchToProp } from '../../utils';

const mapStateToProps = (state: RootState) => state;
const todoProps = genMapDispatchToProp<TodoActionCreatorTypes>(todoActions);

type ActionCreatorTypes = { [key in keyof typeof actions]: typeof actions[key] };
const mapDispatchToProps = {
    ...todoProps,
    ...genMapDispatchToProp<ActionCreatorTypes>(actions)
};

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(Timer);
