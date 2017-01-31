export default function click(e) {
    let x, y;
    e = !e ? window.event : e;

    if (e.touches && e.touches[0]) {
        e = e.touches[0];
    }
    else if (e.changedTouches && e.changedTouches[0]) {
        e = e.changedTouches[0];
    }

    if (e.clientX || e.clientY) {
        x = e.clientX;
        y = e.clientY;
    }
    else if (e.pageX || e.pageY) {
        x = e.pageX - document.body.scrollLeft - document.documentElement.scrollLeft;
        y = e.pageY - document.body.scrollTop - document.documentElement.scrollTop;
    }

    return {
        x, y
    }
}