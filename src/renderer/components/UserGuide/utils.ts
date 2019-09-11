export const getElementAbsoluteOffsetById = (_id: string) => {
    let target = document.getElementById(_id);
    let x = 0;
    let y = 0;
    if (target == null) {
        throw new Error()
    }

    const w = target.clientWidth;
    const h = target.clientHeight;
    while (target) {
        if (target.offsetLeft == null) {
            throw new Error('Imp assumption error');
        }

        x += target.offsetLeft;
        y += target.offsetTop;
        target = target.offsetParent as HTMLElement;
    }

    return [x, y, w, h]
};
