export async function waitUntil(cond: () => boolean, timeout = 10000) {
    const start = +new Date();
    while (!cond()) {
        if (+new Date() - start > timeout) {
            throw new Error('Timeout');
        }

        await new Promise((r) => requestAnimationFrame(r));
    }
}
