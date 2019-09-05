import { connect } from 'react-redux';
import { Board, InputProps } from './Board';
import { RootState } from '../../../reducers';
import { BoardActionTypes, actions } from './action';
import { genMapDispatchToProp } from '../../../utils';

const mapStateToProps = (state: RootState, props: InputProps) => {
    const board = state.kanban.boards[props.boardId];
    return { ...board };
};

const mapDispatchToProps = genMapDispatchToProp<BoardActionTypes>(actions);
export default connect(
    mapStateToProps,
    mapDispatchToProps
)(Board);
