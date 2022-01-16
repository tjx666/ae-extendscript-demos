(function () {
    /** @type {CompItem} */
    var comp = app.project.activeItem;
    // 最安全的做法要判空和类型，也有可能是图片等其他 item
    if (comp && comp instanceof CompItem) {
        //  输出当前合成名
        $.writeln(comp.name);
    }

    $.writeln(comp instanceof Item);

    $.writeln(comp.layers.length);
    // 方式一：使用对象数组所属对象的 numItems 属性
    var length = app.project.numItems;

    // 方式二：和普通数组一样，直接访问对象数组的 length
    var length = app.project.items;

    // 并不是真的数组
    var items = app.project.items;
    $.writeln(items instanceof Array); // false
    $.writeln(Object.prototype.toString.call(items) === '[object Array]'); // false
    // 使用 extendScript 的反射系统看属性
    $.writeln(items.reflect.properties); // length,__proto__

    // 是 ItemCollection 类型
    $.writeln(items.__proto__.constructor); // ItemCollection
    $.writeln(app.project.activeItem.layers.__proto__.constructor); // LayerCollection
    $.writeln(app.project.renderQueue.items.__proto__.constructor); // RQItemCollection

    // 也有例外，不过也不意外，因为 layer 没有 numSelectedProperties
    var layer = app.project.activeItem.layers[1];
    $.writeln(app.project.activeItem.layers[1].selectedProperties.__proto__.constructor); // Array
})();
