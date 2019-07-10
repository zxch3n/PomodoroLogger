import { connect } from 'react-redux';

import TODO from './TODO';
import { RootState } from '../../reducers';
import { ActionCreatorTypes, actions } from './action';
import { genMapDispatchToProp } from '../../utils';

const mapStateToProps = (state: RootState) => state.todo;
const mapDispatchToProps = genMapDispatchToProp<ActionCreatorTypes>(actions);
export default connect(
    mapStateToProps,
    mapDispatchToProps
)(TODO);
