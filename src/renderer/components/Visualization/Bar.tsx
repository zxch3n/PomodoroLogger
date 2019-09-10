import React, {useState, useEffect, useRef} from 'react';
import { connect } from 'react-redux';
import { RootState } from '../../reducers';

interface BarProps {
    values: number[],
    names: string[],
    colors?: string[]
    width?: number | string;
    height: number | string;
}

export const Bar: React.FC<BarProps> = (props: BarProps) => {
    const {height='100%'} = props;
    const ref = useRef<SVGElement>();
    const [maxItemInCol, setMaxItemInCol] = useState(20);
    const minHeightInPixel = 4;
    useEffect(()=>{
        if (ref.current === undefined) return;
        const lis = ()=>{
            if (ref.current === undefined) return;
            setMaxItemInCol(Math.floor(ref.current.clientHeight / minHeightInPixel));
        };
        ref.current.addEventListener('resize', lis);
        setMaxItemInCol(Math.floor(ref.current.clientHeight / minHeightInPixel));
        return ()=>{
            if (ref.current === undefined) return;
            ref.current.removeEventListener('resize', lis);
        }
    }, []);
    const {names, values} = props;
    if (names.length !== values.length) {
        throw new Error();
    }

    const margin = 2;
    const width = 100 / values.length - margin;
    let scale = 1;
    const maxV = Math.max(...values);
    if (maxV > maxItemInCol) {
        scale = maxItemInCol / maxV;
    }

    const layerHeight = 100 / maxItemInCol * 0.6;
    const marginTop = 100 / maxItemInCol * 0.4;
    return (
        // @ts-ignore
        <svg width="100%" height={height} viewBox={'0 0 100 100'} preserveAspectRatio="none" ref={ref}>
            { values.map((v, i)=>{
                const n = Math.ceil(v * scale);
                const arr = Array.from(Array(n).keys());
                return (
                    <g key={i} transform={`translate(${(width + margin) * i}, 0)`}>
                        <title>{names[i]}</title>
                        {arr.map(index=>{
                            const y = 100 - index * (layerHeight + marginTop) - layerHeight;
                            return (
                                <rect key={index} fill={'red'} x={0} y={y} width={width} height={layerHeight}/>
                            )
                        })}
                    </g>
                );
            }) }
        </svg>
    )
};


interface ListCountBarProps {
    boardId: string;
}

export const ListsCountBar = connect(
    (state: RootState, props: ListCountBarProps) => {
        const lists = state.kanban.boards[props.boardId].lists.map(_id=>(
            state.kanban.lists[_id]
        ));
        return {
            values: lists.map(v=>v.cards.length),
            names: lists.map(v=>v.title)
        }
    }
)(Bar);
