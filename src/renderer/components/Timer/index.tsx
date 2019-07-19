import { connect } from 'react-redux';

import Timer from './Timer';
import { RootState } from '../../reducers';
import { ActionCreatorTypes, actions } from './action';
import { ActionCreatorTypes as ProjectActions, actions as projectActions } from '../Project/action';
import { genMapDispatchToProp } from '../../utils';

const mapStateToProps = (state: RootState) => state;
const mapDispatchToProps = genMapDispatchToProp<ProjectActions & ActionCreatorTypes>({
    ...projectActions,
    ...actions
});
export default connect(
    mapStateToProps,
    mapDispatchToProps
)(Timer);
