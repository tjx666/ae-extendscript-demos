(function () {
    /** @type {CompItem} */
    var comp = app.project.activeItem;
    // 最安全的做法要判空和类型，也有可能是图片等其他 item
    if (comp && comp instanceof CompItem) {
        //  输出当前合成名
        $.writeln(comp.name);
    }
})();
