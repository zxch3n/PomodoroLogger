import { connect } from 'react-redux';

import { History } from './History';
import { RootState } from '../../reducers';
import { genMapDispatchToProp } from '../../utils';
import { HistoryActionCreatorTypes, actions } from './action';

const mapStateToProps = (state: RootState) => state;
const mapDispatchToProps = genMapDispatchToProp<HistoryActionCreatorTypes>(actions);
export default connect(
    mapStateToProps,
    mapDispatchToProps
)(History);
