```tsx
import styled from 'styled-components';
import { Bar } from './Bar';

const Container = styled.div`
    height: 100px;
    width: 200px;
`;

<Container>
    <Bar names={['A', 'B', 'C']} values={[11, 0, 20]} />
</Container>;
```
