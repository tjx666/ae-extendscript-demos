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
