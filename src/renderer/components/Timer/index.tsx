import { connect } from 'react-redux';

import Timer from './Timer';
import { RootState } from '../../reducers';
import { TimerActionTypes, actions } from './action';
import { ProjectActionTypes as ProjectActions, actions as projectActions } from '../Project/action';
import { genMapDispatchToProp } from '../../utils';

const mapStateToProps = (state: RootState) => state;
const mapDispatchToProps = genMapDispatchToProp<ProjectActions & TimerActionTypes>({
    ...projectActions,
    ...actions
});
export default connect(
    mapStateToProps,
    mapDispatchToProps
)(Timer);
