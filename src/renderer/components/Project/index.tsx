import { connect } from 'react-redux';
import { Dispatch } from 'redux';

import Project from './Project'
import { RootState } from '../../reducers';
import {actions, ActionCreatorTypes} from './action'
import {genMapDispatchToProp} from '../../utils';


const mapStateToProps = (state: RootState) => (state.todo);
const mapDispatchToProps = genMapDispatchToProp<ActionCreatorTypes>(actions);
export default connect(mapStateToProps, mapDispatchToProps)(Project);
