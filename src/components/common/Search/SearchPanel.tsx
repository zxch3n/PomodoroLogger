import React from 'react';
import styled from 'styled-components';
import { Markdown } from '../../../renderer/components/Kanban/style/Markdown';

interface PanelProps {
    tags?: string[];
    history?: string[];
    search: (str: string) => void;
}

const StyledPanel = styled(Markdown)`
    line-height: 1.5;
    max-width: 280px;
`;

const Title = styled.p`
    user-select: none;
    color: #777;
    font-size: 0.8rem;
`;

const Group = styled.div`
    padding: 4px;
    max-width: 280px;
    word-break: normal;
    line-height: 1.8;
`;

export const SearchPanel = ({
    history = ['Search History'],
    tags = ['#TAG'],
    search,
}: PanelProps) => {
    const setSearch = (str: string) => () => search(str);
    return (
        <StyledPanel>
            <Title>#TAGS</Title>
            <Group>
                {tags.map((x) => (
                    <>
                        <span className="pl-tag" key={x} onClick={setSearch(x)}>
                            {x}
                        </span>
                        <span />
                    </>
                ))}
            </Group>
            {/* <Title>HISTORY</Title>
            <Group>
                {history.map((x) => (
                    <span className="pl-tag" key={x} onClick={setSearch(x)}>
                        {x}
                    </span>
                ))}
            </Group> */}
        </StyledPanel>
    );
};
