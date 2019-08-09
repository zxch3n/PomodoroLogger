import { connect } from 'react-redux';

import { Analyser } from './Analyser';
import { RootState } from '../../reducers';
import { genMapDispatchToProp } from '../../utils';
import { HistoryActionCreatorTypes, actions } from '../History/action';

const mapStateToProps = (state: RootState) => state;
const mapDispatchToProps = genMapDispatchToProp<HistoryActionCreatorTypes>(actions);
export default connect(
    mapStateToProps,
    mapDispatchToProps
)(Analyser);
