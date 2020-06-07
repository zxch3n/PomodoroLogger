import { connect } from 'react-redux';
import { RootState } from '../../reducers';
import { Bar } from '../../../components/Visualization/Bar';

interface ListCountBarProps {
    boardId: string;
}

export const ListsCountBar = connect((state: RootState, props: ListCountBarProps) => {
    const lists = state.kanban.boards[props.boardId].lists.map((_id) => state.kanban.lists[_id]);
    return {
        values: lists.map((v) => v.cards.length),
        names: lists.map((v) => v.title),
    };
})(Bar);
