import { connect } from 'react-redux';

import { Setting } from './Setting';
import { RootState } from '../../reducers';
import { TimerActionTypes, actions } from '../Timer/action';
import { genMapDispatchToProp } from '../../utils';

const mapStateToProps = (state: RootState) => state.timer;
const mapDispatchToProps = genMapDispatchToProp<TimerActionTypes>(actions);
export default connect(
    mapStateToProps,
    mapDispatchToProps
)(Setting);
