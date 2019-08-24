import { connect } from 'react-redux';
import { Card, InputProps } from './Card';
import { RootState } from '../../../reducers';
import { CardActionTypes, actions } from './action';
import { genMapDispatchToProp } from '../../../utils';

const mapStateToProps = (state: RootState, props: InputProps) => {
    return { ...state.kanban.cards[props.cardId] };
};

const mapDispatchToProps = genMapDispatchToProp<CardActionTypes>(actions);
export default connect(
    mapStateToProps,
    mapDispatchToProps
)(Card);
