import styled from 'styled-components';
import { thinScrollBar } from '../../../style/scrollbar';

export const Markdown = styled.div`
    max-height: 250px;
    overflow: auto;
    font-size: 14px;
    position: relative;
    padding: 0 0 4px 0;
    ${thinScrollBar};

    ::before {
        content: '';
        top: 0px;
        position: sticky;
        display: block;
        width: 100%;
        height: 0.4rem;
        background: linear-gradient(
            rgba(255, 255, 255, 1),
            rgba(255, 255, 255, 0.001)
        ); /* transparent keyword is broken in Safari */
        pointer-events: none;
    }

    ::after {
        content: '';
        bottom: -4px;
        position: sticky;
        display: block;
        width: 100%;
        height: 0.4rem;
        background: linear-gradient(
            rgba(255, 255, 255, 0.001),
            rgba(255, 255, 255, 1)
        ); /* transparent keyword is broken in Safari */
        pointer-events: none;
    }
    h1 {
        font-size: 1.2em;
        margin: 0 !important;
    }
    h2 {
        font-size: 1.15em;
        margin: 0 !important;
    }
    h3 {
        font-size: 1.1em;
        margin: 0 !important;
    }
    h4 {
        font-size: 1.05em;
        font-weight: 700;
        margin: 0 !important;
    }

    h5,
    h6,
    h7 {
        font-size: 1.05em;
        font-weight: 600;
        margin: 0 !important;
    }

    p {
        margin: 0 !important;
    }

    ul,
    ol {
        padding-left: 24px;
        margin-bottom: 0;
    }
`;
