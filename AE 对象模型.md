本教程适合有 ExtendScript 基础的同学阅读，ExtendScript 本身是所有 adobe 系产品**通用**的用于执行自动化的**脚本语言**，只不过不同**宿主环境**被 patch 的 **API** 不一样。

例如 AE 中，在基础的 ExtendScript 环境下增加了 **CompItem**, **Layer** 等构造器用于表示 AE 中的合成和图层。

注：由于 ExtendScript 后缀名就是 jsx，因此在讨论 adobe 脚本开发时提到 jsx 都是指 ExtendScript，而不是 react 用的那个 jsx dsl。

## AE 对象模型

和网页中 DOM(Document Object Model) 一样，AE ExtendScript 中也用了一堆构造器和对象用来抽象 AE 的模型。

![img](https://ae-scripting.docsforadobe.dev/_images/application.png)

仔细观察上面图中各个面板的标题，AE 的对象模型可以拆解成下面的流程图，现在知道为什么作为开发应该安装英文版的 AE 了吧？

![AE model](https://s2.loli.net/2022/01/16/A1ocHp7tg5YGwfm.png)

说明：

上面背景颜色相同的节点表示都是彼此是有直接联系的，例如紫色的两个节点表示那个图层  `videoLayer1` 使用的视频素材就是 `item3-video2`。

### app

AE jsx 全局环境注入的变量 app 表示的就是 AE 宿主对象，这一点其它 adobe 产品应该也是一样，例如 photoshop 应该也是用全局变量 app 表示。当然也可以用全局对象 `$.global` 来访问，也就是 `$.global.app`。

app 挂载了很多实用的 API，说几个用的比较多的 API：

- app.scheduleTask 它可是我们在 AE jsx 中实现异步编程的重要手段

- app.preferences 读写 AE 的用户设置
- app.beginUndoGroup/app.endUndoGroup 处理回退的，如果不做额外处理，如果脚本中对 AE 的进行多个操作，那么 <kbd>⌘</kbd>+<kbd>Z</kbd> 回退到上一个操作，用这个处理后可以回退到脚本开始

### project

app.project 返回的就是你当前打开的工程，**AE 不支持同时打开多个 project**。

每一个 project 有一个对应的 XMPMeta key/value 数据库，需要结合外部库 `lib:AdobeXMPScript` 使用，在开发 CEP 插件时可以用来做持久化。

### Items

![AE project panel](https://s2.loli.net/2022/01/16/uyE1Zjg5fK2OpJn.png)

其实 app.project 是和 AE 的 project 面板对应的，app.project.items 返回的就是 project 面板中的所有项，在 AE 术语中就是 Item。

在 AE 的术语里有一个单词 `Footage`，表示素材的意思。project 面板中的每一项就是一个素材，这个素材可以是一个具体的素材例如图片，视频，序列帧，也可以是一个合成，还可以是一个文件夹（Folder Footage）。

需要注意的是 items 不是一个树结构，而是树被拍平后的数组，上面中 app.project.numItems 是 15，13 个具体素材 + 2 文件夹。只不过你可以通过 folderItem.items 再访问子 item。

#### viewers

viewers 指的是正中间那块区域，当我们双击合成，图层，或者 project 面板中的素材时都会打开一个 viewer。

activeViewer：当前打开的合成，图层或者素材视图，通过 app.activeViewer 来访问，对应上图就是那个合成视图。

#### compItem

我们可以把 AE 的 project 理解为一个 monorepo 项目，那么一个合成就是 project 中的一个 package。合成之间也可以相互依赖，一个合成可以是另一个合成的一个图层。

合成的唯一标识符是它的 id，合成的 id 是根据 project 创建的它的时间顺序从 0 开始递增的。新建一个 project，，再建两个合成，id 会分别是 0 和 1。这时候删除 id 为 0 的合成，新建一个合成，这个新合成 id 是 2，不会是某些人想的 0，并不会从头开始。 

一个 project 中所有合成都会显示在 project 面板中作为一个素材项，**预合成**本质也是一个合成。当需要访问一个合成时有两种方式，一种是通过 app.project.activeItem 访问当前激活项。什么叫激活项？激活项指的是 project 面板中当前唯一选中项，如果选中多项那就会返回 null。我们在做简单的 api 测试的时候经常会使用它：

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

另一种方式就是通过 `app.project.items `遍历所有项，先筛选出合成项，再根据合成的 id 或者 name 过滤出你想要访问的合成。

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





