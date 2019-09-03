import React, { FC, useState, useEffect, ChangeEvent } from 'react';
import { actions } from './action';
import { connect } from 'react-redux';
import { RootState } from '../../reducers';
import { Dispatch } from 'redux';
import styled from 'styled-components';
import Search from 'antd/es/input/Search';

const Bar = styled.div`
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    z-index: 10000;
    box-shadow: 0 0 10000px 10000px rgba(0, 0, 0, 0.4);
`;

interface Props {
    reg?: string;
    setReg: (reg?: string) => void;
}

const _SearchBar: FC<Props> = (props: Props) => {
    const [visible, setVisible] = useState(false);
    useEffect(() => {
        window.addEventListener('keydown', event => {
            if (
                event.ctrlKey &&
                (event.key === 'f' || event.which === 70 || event.code === 'KeyF')
            ) {
                // Ctrl + F: Search
                setVisible(true);
            } else if (event.key === 'Escape' || event.which === 27 || event.code === 'Escape') {
                setVisible(false);
            }
        });
    }, []);

    const onSearch = () => {
        setVisible(false);
    };

    const onChange = (event: any) => {
        props.setReg(event.target.value);
    };

    return (
        <Bar style={{ display: visible ? undefined : 'none' }}>
            <Search
                placeholder="input search text"
                enterButton={true}
                onSearch={onSearch}
                onChange={onChange}
                value={props.reg}
            />
        </Bar>
    );
};

export const SearchBar = connect(
    (state: RootState) => ({
        reg: state.kanban.kanban.searchReg
    }),
    (dispatch: Dispatch) => ({
        setReg: (reg?: string) => dispatch(actions.setSearchReg(reg))
    })
)(_SearchBar);
