```tsx
import { DualPieChart } from './DualPieChart';

<DualPieChart
    appData={[
        { name: 'B', value: 12 },
        { name: 'A', value: 60 },
    ]}
    projectData={[
        { name: 'B', value: 12 },
        { name: 'A', value: 60 },
        { name: 'C', value: 30 },
    ]}
    onProjectClick={console.log}
/>;
```
