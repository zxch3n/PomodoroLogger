import { connect } from 'react-redux';

import Project from './Project';
import { RootState } from '../../reducers';
import { ProjectActionTypes, actions } from './action';
import { genMapDispatchToProp } from '../../utils';

const mapStateToProps = (state: RootState) => state;
const mapDispatchToProps = genMapDispatchToProp<ProjectActionTypes>(actions);
export default connect(
    mapStateToProps,
    mapDispatchToProps
)(Project);
