(function () {
    /** @type {CompItem} */
    var comp = app.project.activeItem;
    var layers = comp.layers;
    var layer = layers[1];

    $.writeln('startTime: ' + layer.startTime);
    $.writeln('inPoint: ' + layer.inPoint);
    $.writeln('outPoint: ' + layer.outPoint);
    $.writeln('inPoint 相对于 startTime 的时刻：' + (layer.inPoint - layer.startTime));

    layer.inPoint = 5.5;

    $.writeln('对齐 inPoint 到合成 0 时刻之后：');
    $.writeln('startTime: ' + layer.startTime);
    $.writeln('inPoint: ' + layer.inPoint);
    $.writeln('outPoint: ' + layer.outPoint);
    $.writeln('inPoint 相对于 startTime 的时刻：' + (layer.inPoint - layer.startTime));

    /**
     * 将图层 inPoint 对齐到时间 0
     * @param {AVLayer} layer
     */
     function alignLayerInPointToZero(layer) {
        layer.startTime = -(layer.inPoint - layer.startTime);
        if (layer.inPoint >= 0) {
            layer.startTime -= 0.001;
        }
    }
})();
