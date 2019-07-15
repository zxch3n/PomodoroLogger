import { connect } from 'react-redux';

import { History } from './History';
import { RootState } from '../../reducers';
import { genMapDispatchToProp } from '../../utils';
import { HistoryActionCreatorTypes, HistoryState, actions } from './action';

const mapStateToProps = (state: RootState) => state.history;
const mapDispatchToProps = genMapDispatchToProp<HistoryActionCreatorTypes>(actions);
export default connect(
    mapStateToProps,
    mapDispatchToProps
)(History);
