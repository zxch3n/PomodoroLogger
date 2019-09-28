export const getElementAbsoluteOffsetBySelector = (selector: string) => {
    let target = document.querySelector<HTMLElement>(selector);
    let x = 0;
    let y = 0;
    if (target == null) {
        throw new Error();
    }

    let w;
    let h;
    const computedStyle = getComputedStyle(target);
    h = target.clientHeight; // height with padding
    w = target.clientWidth; // width with padding
    console.log(w, h);
    try {
        // @ts-ignore
        h -= parseFloat(computedStyle.paddingTop) + parseFloat(computedStyle.paddingBottom);
        // @ts-ignore
        w -= parseFloat(computedStyle.paddingLeft) + parseFloat(computedStyle.paddingRight);
    } catch (e) {
        console.log('sub failed');
    }

    console.log(w, h);
    while (target) {
        if (target.offsetLeft == null) {
            throw new Error('Imp assumption error');
        }

        x += target.offsetLeft;
        y += target.offsetTop;
        target = target.offsetParent as HTMLElement;
    }

    return [x, y, w, h];
};
