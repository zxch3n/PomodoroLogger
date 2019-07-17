import { connect } from 'react-redux';

import Project from './Project';
import { RootState } from '../../reducers';
import { ActionCreatorTypes, actions } from './action';
import { genMapDispatchToProp } from '../../utils';

const mapStateToProps = (state: RootState) => state.project;
const mapDispatchToProps = genMapDispatchToProp<ActionCreatorTypes>(actions);
export default connect(
    mapStateToProps,
    mapDispatchToProps
)(Project);
