```tsx
import { AdaptWidthContainer } from '../AdaptWidthContainer';

const now = +new Date();
const countList = {};
for (let i = 0; i < 1000; i++) {
    const time = Math.floor(now - 365 * 24 * 3600 * Math.random() * 1000);
    countList[time] = { count: Math.floor(Math.random() * 10) };
}

console.log(countList);

<AdaptWidthContainer>
    {(width) => <GridCalendar width={width} data={countList} till={now} />}
</AdaptWidthContainer>;
```
