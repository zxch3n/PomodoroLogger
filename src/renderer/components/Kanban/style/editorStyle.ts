import styled from 'styled-components';
import { thinScrollBar } from '../../../style/scrollbar';

export const EditorContainer = styled.div`
    .ant-form-item {
        margin-bottom: 8px;
    }

    textarea {
        max-height: calc(100vh - 600px) !important;
        min-height: 120px;
        ${thinScrollBar}
    }
`;
