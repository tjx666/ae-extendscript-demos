(function () {
    /**
     * Layer 类型
     */
    var LayerTypes = {
        Solid: 'Solid', // 纯色图层
        Shape: 'Shape', // 形状图层
        Still: 'Still', // 静态图层，大多数情况指的就是静态图
        Text: 'Text', // 文字图层
        Audio: 'Audio', // 音频图层
        Video: 'Video', // 视频图层
        ImageSequence: 'ImageSequence', // 序列帧图层
        NullObject: 'NullObject', // 空对象图层
        // 下面这些图层工作中都没怎么用过
        PlaceholderStill: 'PlaceholderStill',
        PlaceholderVideo: 'PlaceholderVideo',
        PreCompose: 'PreCompose', // 预合成图层
        Guide: 'Guide', // 参考线图层
        Adjustment: 'Adjustment', // 调整图层
        Camera: 'Camera', // 摄像机图层
        Light: 'Light', // 灯光图层
        Data: 'Data', // 
    };

        /** @type {CompItem} */
        var comp = app.project.activeItem;
        var layers = comp.layers;
        var layer = layers[1];
        $.writeln(layer instanceof AVLayer);
})();
