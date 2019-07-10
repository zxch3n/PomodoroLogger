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
type ActionCreatorTypes = { [key in keyof typeof actions]: typeof actions[key] };
const mapDispatchToProps = genMapDispatchToProp<TodoActionCreatorTypes & ActionCreatorTypes>({
    ...todoActions,
    ...actions
});
export default connect(
    mapStateToProps,
    mapDispatchToProps
)(Timer);
