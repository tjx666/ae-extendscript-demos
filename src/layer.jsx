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

    /**
     * 解析 AVLayer 的具体类型，没有返回值
     * @param {Layer} layer
     * @returns {keyof LayerType}
     */
    function resolveAVLayerType(layer) {
        var source = layer.source;
        if (source instanceof CompItem) {
            return LayerTypes.PreCompose;
        }

        var mainSource = source.mainSource;
        if (!layer.hasVideo) {
            if (layer.hasAudio) {
                return LayerTypes.Audio;
            } else {
                return LayerTypes.Data;
            }
        } else if (source.frameDuration < 1) {
            if (mainSource instanceof PlaceholderSource) {
                return LayerTypes.PlaceholderVideo;
            } else if (mainSource.isStill) {
                return LayerTypes.Still;
            }
            // ImageSequence Layer source name 是 xxx-[00000-000xx].xxx 或 xxx-{00000-000xx}.xxx 格式，
            // eslint-disable-next-line no-useless-escape
            else if (
                /[[{]\d+-\d+[}\]].\w+$/.test(source.name) ||
                /_\d{5}.\w+?$/.test(source.file.name)
            ) {
                return LayerTypes.ImageSequence;
            } else {
                return LayerTypes.Video;
            }
        } else if (source.frameDuration === 1) {
            if (mainSource instanceof PlaceholderSource) {
                return LayerTypes.PlaceholderStill;
            } else if (mainSource.color) {
                return LayerTypes.Solid;
            } else {
                return LayerTypes.Still;
            }
        }
    }

    /**
     * 解析 layer 类型
     * @param {Layer} layer
     * @returns {keyof LayerType}
     */
    function resolveLayerType(layer) {
        var LayerConstructors = [AVLayer, CameraLayer, LightLayer, ShapeLayer, TextLayer];
        var result;

        // 暂时不明为啥 bodymovin 要设计 guide 类型的 Layer
        // if (curLayer.guideLayer) {
        //   return layerTypes.guide;
        // }

        if (layer.adjustmentLayer) {
            return LayerTypes.Adjustment;
        }

        if (layer.nullLayer) {
            return LayerTypes.NullObject;
        }

        var i;
        for (i = 0; i < LayerConstructors.length; i++) {
            if (layer instanceof LayerConstructors[i]) {
                result = LayerConstructors[i].name;
                break;
            }
        }
        if (result === 'AVLayer') {
            result = resolveAVLayerType(layer);
        } else if (result === 'CameraLayer') {
            result = LayerTypes.Camera;
        } else if (result === 'LightLayer') {
            result = LayerTypes.Light;
        } else if (result === 'ShapeLayer') {
            result = LayerTypes.Shape;
        } else if (result === 'TextLayer') {
            result = LayerTypes.Text;
        }
        return result;
    }

    /** @type {CompItem} */
    var comp = app.project.activeItem;
    var layers = comp.layers;
    var layer = layers[1];
    // $.writeln(resolveLayerType(layer));
    // $.writeln(layer instanceof AVLayer);
    $.writeln(typeof Layer);

})();
