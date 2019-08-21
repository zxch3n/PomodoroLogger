export class Counter {
    private _dict: { [key: string]: number } = {};

    add(key: string | number, num: number = 1) {
        if (!(key in this._dict)) {
            this._dict[key] = 0;
        }

        this._dict[key] += num;
    }

    get dict() {
        return this._dict;
    }

    get list(): [string, number][] {
        const ans: [string, number][] = [];
        for (const name in this._dict) {
            ans.push([name, this._dict[name]]);
        }

        return ans;
    }

    getNameValuePairs({
        toFixed = undefined,
        topK = undefined
    }: { toFixed?: number; topK?: number } = {}): { name: string; value: number }[] {
        let ans = [];
        for (const key in this._dict) {
            let value = this._dict[key];
            if (toFixed !== undefined) {
                const pow = Math.pow(10, toFixed);
                value = Math.floor(value * pow + 0.5) / pow;
            }

            if (value > 0) {
                ans.push({ value, name: key });
            }
        }

        if (topK && ans.length > topK) {
            ans.sort((a, b) => -a.value + b.value);
            ans = ans.slice(0, topK);
        }

        return ans;
    }
}
