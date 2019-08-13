export function range(begin: number, end?: number) {
    if (end === undefined) {
        return Math.random() * begin;
    }

    return Math.random() * (end - begin) + begin;
}

export function intRange(begin: number, end?: number) {
    return Math.floor(range(begin, end));
}

export function sample(a: any[], rate: number) {
    if (rate < 0 || rate > 1) {
        throw new Error('rate invalid');
    }

    if (rate === 0) {
        return [[], a];
    }

    if (rate === 1) {
        return [a, []];
    }

    const n = Math.floor(a.length * rate);
    for (let i = 0; i < n; i += 1) {
        const index = intRange(i, a.length);
        [a[index], a[i]] = [a[i], a[index]];
    }

    const b = a.splice(n);
    return [a, b];
}
