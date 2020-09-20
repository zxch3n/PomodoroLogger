import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Icon } from 'antd';
import styled from 'styled-components';

export interface SearchProps {
    setSearchStr(str: string):void;
}

interface StyledProps {
    isSearching: boolean;
}

const StyledSearch = styled.div<StyledProps>`
    box-sizing: border-box;
    padding: 4px;
    height: 26px;
    border-radius: 14px;
    transition: width 120ms, padding 120ms;
    border: 1px solid grey;
    outline: none;
    display: flex;
    flex-direction: row;
    z-index: 5;

    ${({ isSearching }) => (isSearching ? `
        width: 260px; 
        padding: 4px 8px;
        ` : 
        `width: 26px; 
        cursor: pointer;
        input, .close { visibility: hidden;}
    `)}

    i { outline: none;}

    .close { 
        width: 16px;
        height: 16px;
        box-sizing: border-box;
        padding: 3px;
        font-size: 10px;
        cursor: pointer;
        border-radius: 12px;
        z-index: 6;

        &:hover {
            background-color: #b5b5b5;
        }
    }

    input { 
        flex-grow: 1;
        border: none;
        outline: none;
        margin: 0 6px;
        padding: 0;
        line-height: 16px;
        height: 16px;
    }

    :focus {
        border: 1px solid #0064d3;
    }
    :hover {
        border: 1px solid #3b5998;
    }
`;

export const Search = ({setSearchStr}: SearchProps) => {
    const [isSearching, setIsSearching] = useState(false);
    const [text, setText] = useState('');
    const textRef = useRef<string>('');
    const selfRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const onClick = useCallback(() => {
        if (!isSearching) {
            setIsSearching(true);
            setTimeout(() => {
                inputRef.current?.focus();
            }, 200)
        }
    }, [isSearching]);

    const clear = useCallback((event: React.MouseEvent) => {
        event.stopPropagation();
        setIsSearching(false);
        setText('');
        textRef.current = '';
        setSearchStr('')
    }, [])

    const onChange = useCallback((v: React.ChangeEvent<HTMLInputElement>) => {
        const value = v.target.value;
        setText(value);
        textRef.current = value;
        setSearchStr(value)
    }, [setSearchStr]);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (!selfRef.current) {
                return;
            }

            if (selfRef.current.contains(e.target as Element)) {
                return;
            }

            if (!textRef.current) {
                setIsSearching(false);
            }
        };

        window.addEventListener('click', handler)
        return () => {
            window.removeEventListener('click', handler);
        }
    }, [])
    return (
        <StyledSearch
            isSearching={isSearching}
            onClick={onClick} 
            ref={selfRef}
        >
            <Icon type="search"/>
            <input ref={inputRef} onChange={onChange} value={text}/>
            <Icon type="close" className="close" onClick={clear}/>
        </StyledSearch>
    );
};
