import React, { useEffect, useState, useCallback, useRef } from 'react';
import { SearchPanel } from './SearchPanel';
import { Icon } from 'antd';
import styled from 'styled-components';

export interface SearchProps {
    searchStr?: string;
    tags?: string[];
    searchHistory?: string[];
    setSearchStr(str: string): void;
}

interface StyledProps {
    isSearching: boolean;
    showPanel: boolean;
}

const StyledSearch = styled.div<StyledProps>`
    box-sizing: border-box;
    padding: 4px;
    height: 26px;
    border-radius: 14px;
    transition: width 120ms, padding 120ms;
    border: 1px solid grey;
    outline: none;
    color: #555;
    z-index: 5;

    ${({ isSearching }) =>
        isSearching
            ? `
        width: 260px; 
        padding: 4px 8px;
        `
            : `width: 26px; 
        cursor: pointer;
        input, .close { visibility: hidden;}
    `}

    ${({ showPanel, isSearching }) => (isSearching && showPanel ? `height: auto;` : ``)}

    header {
        display: flex;
        flex-direction: row;

        i {
            outline: none;
        }

        .close {
            width: 16px;
            height: 16px;
            box-sizing: border-box;
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 3px;
            font-size: 10px;
            cursor: pointer;
            border-radius: 12px;
            z-index: 6;
            transition: background-color 300ms;

            &:hover {
                background-color: #d5d5d5;
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
    }

    :focus {
        border: 1px solid #0064d3;
    }
    :hover {
        border: 1px solid #3b5998;
    }
`;

export const Search = ({ setSearchStr, searchHistory, searchStr, tags }: SearchProps) => {
    const [isSearching, setIsSearching] = useState(false);
    const [text, setText] = useState('');
    const [showPanel, setShowPanel] = useState(false);
    const textRef = useRef<string>('');
    const selfRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const onClick = useCallback(() => {
        if (!isSearching) {
            setIsSearching(true);
            setTimeout(() => {
                inputRef.current?.focus();
            }, 200);
        }
    }, [isSearching]);

    useEffect(() => {
        if (searchStr == null || searchStr === textRef.current) {
            return;
        }

        setText(searchStr);
        textRef.current = searchStr;
    }, [searchStr]);

    const clear = useCallback((event: React.MouseEvent) => {
        event.stopPropagation();
        setIsSearching(false);
        setShowPanel(false);
        setText('');
        textRef.current = '';
        setSearchStr('');
    }, []);

    const search = useCallback((value: string) => {
        setText(value);
        textRef.current = value;
        setSearchStr(value);
    }, []);

    const onChange = useCallback(
        (v: React.ChangeEvent<HTMLInputElement>) => {
            const value = v.target.value;
            search(value);
        },
        [setSearchStr]
    );

    const onKeydown = useCallback((event: React.KeyboardEvent) => {
        if (event.key === 'Escape' || event.keyCode === 27) {
            setText('');
            textRef.current = '';
            setIsSearching(false);
            setShowPanel(false);
        } else if (event.key === 'Enter' || event.keyCode === 13) {
            inputRef.current?.blur();
        }
    }, []);

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

            setShowPanel(false);
        };

        window.addEventListener('click', handler);
        return () => {
            window.removeEventListener('click', handler);
        };
    }, []);

    const togglePanel = useCallback(() => {
        setShowPanel((v) => !v);
    }, []);

    return (
        <StyledSearch
            onKeyDown={onKeydown}
            isSearching={isSearching}
            showPanel={showPanel}
            onClick={onClick}
            ref={selfRef}
        >
            <header>
                <Icon type="search" />
                <input ref={inputRef} onChange={onChange} value={text} />
                <Icon
                    type={'down'}
                    style={{
                        transform: showPanel ? 'rotate(180deg)' : '',
                        transition: 'transform 120ms',
                    }}
                    className="close"
                    onClick={togglePanel}
                />
                <Icon type="close" className="close" onClick={clear} />
            </header>
            {showPanel && isSearching && (
                <SearchPanel tags={tags} history={searchHistory} search={search} />
            )}
        </StyledSearch>
    );
};
