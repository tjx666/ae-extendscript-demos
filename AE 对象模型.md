ExtendScript 本身是所有 adobe 系产品**通用**的用于执行自动化的**脚本语言**，只不过在不同**宿主环境**被 patch 的 **API** 不一样，相同的宿主环境不同的版本 API 也不一样。你可以简单的理解为 AE ExtendScript 是 ExtendScript 的扩展。

例如 AE 中，在基础的 ExtendScript 环境下增加了 **CompItem**, **Layer** 等构造器用于表示 AE 中的合成和图层，这俩都是 AE 这个宿主环境特有的 API。

由于 ExtendScript 后缀名就是 `.jsx`，因此在讨论 adobe 脚本开发时提到 jsx 一般都是指 [ExtendScript](https://extendscript.docsforadobe.dev/)，而不是 react 用的那个 [jsx](https://reactjs.org/docs/introducing-jsx.html) 。

## 概览

和网页中 DOM(Document Object Model) 一样，AE ExtendScript 中也用了一堆构造器和对象用来抽象 AE 的模型，也提供了一堆用于操作 AE 对象模型的 API。

下图是取自 [AE extendScript 文档](https://ae-scripting.docsforadobe.dev/introduction/objectmodel.html) 中的 AE 对象模型的结构图：

![The After Effects Object Model](https://ae-scripting.docsforadobe.dev/_images/objectmodel.png)

其中像 File, Folder, Socket 对象都在 ExtendScript 中就定义了。ExtendScript 中的 ScriptUI 模块，窗口和窗口控制对象在 AE 的 ExtendScript engine 中也是可以访问的，具体可以查看 [Extendscript](https://extendscript.docsforadobe.dev/) 的文档。

上面的对象关系图和下面的 AE 用户界面其实是一一对应的。

![user interface](https://ae-scripting.docsforadobe.dev/_images/application.png)

由于平时开发 AE 脚本时，文档，变量等都是英文的，为了直观和 AE 界面对应起来，强烈建议安装 AE 时界面语言选择 **English(International)**。

下面的思维导图更细致的描述了 AE 对象模型中各个对象的关系，其中背景颜色相同的节点表示都是彼此是有直接联系的，例如紫色的两个节点表示那个图层 `videoLayer1` 使用的视频素材就是 `item3-video2`。

![AE model](https://s2.loli.net/2022/01/16/A1ocHp7tg5YGwfm.png)

## app

AE jsx 全局环境注入的变量 app 表示的就是 AE 宿主对象，这一点其它 adobe 产品应该也是一样，例如 photoshop 应该也是用全局变量 app 表示。

app 挂载了很多实用的 API，说几个用的比较多的 API：

- app.scheduleTask 它可是我们在 AE jsx 中实现异步编程的重要手段

- app.preferences 读写 AE 的用户设置
- app.beginUndoGroup/app.endUndoGroup 处理回退的，如果不做额外处理，在脚本中对 AE 的进行多个操作，那么 <kbd>⌘</kbd>+<kbd>Z</kbd> 回退到上一个操作，用这个处理后可以回退到脚本开始

## project

app.project 返回的就是你当前打开的工程，**AE 不支持同时打开多个 project**。

每一个 project 有一个对应的 XMPMeta key/value 数据库，需要结合外部库 `lib:AdobeXMPScript` 使用，在开发 CEP 插件时可以用来做持久化。

## Items

![AE project panel](https://s2.loli.net/2022/01/16/gZV9EdXYBmPNnSh.png)

其实 app.project 是和 AE 的 project 面板对应的，`app.project.items` 返回的就是 project 面板中的所有项，对应的基类为 Item。

在 AE 的术语里有一个单词 `Footage`，表示素材的意思。project 面板中的每一项可以是一个具体的素材项(FootageItem)，例如图片，视频，序列帧，也可以是一个合成(CompItem)，还可以是一个文件夹(FolderItem)。

需要注意的是 items 不是一个树结构，而是树被拍平后的数组，上图中 `app.project.numItems` 是 15，13 个具体素材 + 2 文件夹。只不过你可以通过 `folderItem.items` 再访问子 item。

例如我们要实现删除所有 item 名称和给定正则匹配的 item：

```javascript
/**
 * 删除和给定正则匹配的 item
 * @param {RegExp} pattern
 */
function removeItems(pattern) {
  if (!(pattern instanceof RegExp)) throw new TypeError(pattern + ' is not Regexp');
  var items = app.project.items;
  for (var i = 1, item, prefix, parentFolder; i <= items.length; i++) {
    item = items[i];
    if (pattern.test(item.name)) {
      parentFolder = item.parentFolder;
      // 如果被匹配到的 item 所在文件夹只有它一个文件，直接删除父文件夹即可，避免出现空文件夹
      if (parentFolder.name !== 'Root' && parentFolder.items.length === 1) {
        parentFolder.remove();
      } else {
        item.remove();
      }
      // NOTE: 因为在循环中删除了元素，注意调整下标
      i--;
    }
  }
}
```

## viewers

viewers 指的是正中间那块区域，当我们双击合成，图层，或者 project 面板中的素材时都会打开一个 viewer。

activeViewer：当前打开的合成，图层或者素材视图，通过 app.activeViewer 来访问，对应上图就是那个合成视图。

## 合成

如果把 AE 的 project 理解为一个 monorepo 项目，那么一个合成就是 project 中的一个 package。合成之间也可以相互依赖，一个合成可以是另一个合成的一个图层。

### 合成 id

合成的构造器是 `CompItem`，唯一标识符是它的 id，合成的 id 是根据 project 创建的它的时间顺序从 0 开始递增的。新建一个 project，再建两个合成，id 会分别是 0 和 1。这时候删除 id 为 0 的合成，新建一个合成，这个新合成 id 是 2，不会是某些人想的 0，并不会从头开始。

### 获取合成

project 中的所有合成都会显示在 project 面板中作为一个素材项，**预合成**本质也是一个合成。当需要访问一个合成时有两种方式。一种是通过 `app.project.activeItem` 访问当前激活项。什么叫激活项？激活项指的是 project 面板中当前唯一选中项，如果选中多项那就会返回 null。我们在做简单的 api 测试的时候经常会使用它：

```javascript
(function () {
  /** @type {CompItem} */
  var comp = app.project.activeItem;
  // 最安全的做法要判空和类型，也有可能是图片等其他 item
  if (comp && comp instanceof CompItem) {
    //  输出当前合成名
    $.writeln(comp.name);
  }
})();
```

另一种方式就是通过 `app.project.items` 遍历所有项，先筛选出合成项，再根据合成的 id 或者 name 过滤出你想要访问的合成。

```javascript
(function () {
  /**
   * 获取当前 project 中所有合成
   * @returns {CompItem[]}
   */
  function getCompositions() {
    var project = app.project;
    var items = project.items;
    var composites = [];
    for (var i = 1, len = project.numItems, item; i <= len; i++) {
      item = items[i];
      if (item instanceof CompItem) {
        composites.push(item);
      }
    }
    return composites;
  }

  /**
   * 获取 id 为传入 id 的合成
   * @param {string} number
   * @param {CompItem[]} compositions
   * @returns {CompItem}
   */
  function findCompositionById(id, compositions) {
    compositions = compositions === undefined ? getCompositions() : compositions;
    for (var i = 0, comp; i < compositions.length; i++) {
      comp = compositions[i];
      if (comp.id === id) {
        return comp;
      }
    }
  }
})();
```

### Collection

需要注意的是在 AE 数据模型中，你遇到的所有的对象数组基本上都是 `Collection` 类型，**下标都是从 `1` 开始的**。例如 `app.project.items` 是 `ItemCollection 类型`， `app.project.renderQueue.items` 是 `RQItemCollection` 类型, `compItem.layers` 是 `LayerCollection` 类型。

```javascript
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
```

一般遍历 `Collection` 的方式是这样的：

```javascript
// 遍历所有合成
for (var i = 1, len = project.numItems, item; i <= len; i++) {
  item = items[i];
  if (item instanceof CompItem) {
    // do with compositions...
  }
}
```

如果要获取数量，可以有两种方式：

```javascript
// 方式一：使用对象数组所属对象的 numItems 属性
var length = app.project.numItems;

// 方式二：和普通数组一样，直接访问对象数组的 length
var length = app.project.items.length;
```

更多 `Collection` 相关信息移步 [After Effects Scripting Guide#Collection object](https://ae-scripting.docsforadobe.dev/other/collection.html#collection)。

## 图层

图层应该算是 AE 视图层面的基本组成单位了。

一个典型的工作流往往是：新建一个 project，新建一个合成，往 project 中拖进许多素材，使用拖进来的素材创建很多图层，或新建并使用纯色图层，或新建没有 sourceItem 的形状图层和文字图层，还可以选中几个图层创建一个预合成。然后再对各个图层添加动画帧，混合模式，样式，调整变换，添加特效。最终将合成添加到渲染队列，在 OutputModule 中选择合适的输出格式，输出路径，最终点击渲染队列面板的渲染按钮导出视频或其它你选择格式的文件。

### 图层分类

参考 [bodymovin](https://github.com/bodymovin/bodymovin-extension) 中的分类，我们可以将 AE 中的图层分为以下类：

```javascript
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
  // 下面这些图层我都还没怎么用过
  PlaceholderStill: 'PlaceholderStill',
  PlaceholderVideo: 'PlaceholderVideo',
  PreCompose: 'PreCompose', // 预合成图层
  Guide: 'Guide', // 参考线图层
  Adjustment: 'Adjustment', // 调整图层
  Camera: 'Camera', // 摄像机图层
  Light: 'Light', // 灯光图层
  Data: 'Data',
};
```

### 图层继承关系

![Layer inherit](https://s2.loli.net/2022/01/16/nNpDXTZ4IqtdAoG.png)

### 解析图层类型

参考 bodymovin 中 [layerResolver.jsx](https://github.com/bodymovin/bodymovin-extension/blob/master/bundle/jsx/helpers/layerResolver.jsx) 对图层的解析，并做了一些优化后，图层类型解析算法：

```javascript
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
    else if (/[[{]\d+-\d+[}\]].\w+$/.test(source.name) || /_\d{5}.\w+?$/.test(source.file.name)) {
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
```

下面细说各种图层。

### [Layer](https://ae-scripting.docsforadobe.dev/layers/layer.html)

Layer 是所有图层类型的基类，定义了很多基础属性：

- [id](https://ae-scripting.docsforadobe.dev/layers/layer.html#layer-id)，这个属性是 AE 2022 新增的，类似于合成的 id，由于手头没有 AE2022， 就没有实际研究过。2022 的 AE MacOS 版本的貌似很多破解大佬因为 m1 的原因不破解了。

- index，图层下标，实际的项目中这个才是我们用来标识一个图层的字段，通过合成 id + 图层 index 定位 project 中的图层，其实它和 AE 图层列表中的数字标号一一对应

  ![AE layer index](https://s2.loli.net/2022/01/16/2a35HSyMmZ9OLec.png)

下图的合成帧率 30，时长 8s，先通过下图初步了解图层的几个时间相关的属性。虽然 AE 的界面上时间最小的时间单位是帧数，但是**在 AE jsx 中所有和时间有关的属性值单位都是秒**。

![startTime/inPoint/outPoint](https://s2.loli.net/2022/01/18/bWvSAN7IqE5xRYF.png)

#### startTime

> startTime 表示一个图层的**时长**起点在合成上的时刻

sourceItem 表示一个图层的 source 属性对应的 project item，向视频，图片，纯色图层等 AVLayer 都是有 source 的，每一个 source 都对应 project 面板中一个 item。而文字图层，形状图层等图层是没有 source 属性的，也就是说没有源素材，project 面板中是没有对应项的。

对于有 sourceItem 并且有时间维的图层而言，例如上面的视频图层，startTime 就是素材本身 0 时刻在时间轴上的时刻。

对于有 sourceItem 但是没有时间维度的图层例如图片图层，以及没有 sourceItem 例如文字和形状图层，它们的初始 startTime 都是 0s。从 AE 的图层外观上来看好像 startTime 应该是和 inPoint 始终相等的，其实不是，真实情况是仿佛它们有一个虚拟的时长，这个时长的值为**合成**的时长。

图片图层其实很好理解，你双击打开图片图层的 viewer 一目了然：

![image ](https://s2.loli.net/2022/01/18/Tj5toFXpSlfDEBL.png)

观察 viewer 中的时间轴，总时长就是**合成**时长，startTime 的值其实就是以这个虚拟时长的起始点在合成时间轴上的时刻。我们可以任意拖拽图层的渲染时间区间，所以很明显 startTime 不总等于 inPoint，outPoint 也不等于 duration 结束时刻。之所以说是虚拟时长，那是因为图片图层的实际时长也就是 `layer.source.duration` 的值是 0。

文字图层和形状图层虽然没有图层 viewer，但是原理是和图片图层一样的，也可以当做有一个虚拟的**时长为合成时长**的**虚拟时长**来理解。就不多解释了。

#### inPoint

> inPoint 表示的一个图层的**实际渲染时间段**的起点在合成上的时刻

### AVLayer

### Still Layer

在有些资料里他们直接叫 ImageLayer，之所以叫 Still Layer，应该是因为 [FootageSource.isStill](https://ae-scripting.docsforadobe.dev/sources/footagesource.html?highlight=still#footagesource-isstill) 属性。当它为 true 时表示图层素材没有时间维度概念，例如：图片，纯色图层，时间为 0 的 placeholders。从这个角度来说，我认为 StillLayer 叫 ImageLayer 更合适。

常见的 png, jpg, ai, psd 格式的素材都是构成 still layer
