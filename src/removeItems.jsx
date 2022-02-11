(function () {
    /**
     * 删除和给定正则匹配的 item
     * @param {RegExp} pattern
     */
    function removeItems(pattern) {
        if (!(pattern instanceof RegExp)) throw new TypeError(pattern + ' is not Regexp');

        /**
         * 删除当前 item
         * @param {AVItem} item
         */
        function removeItem(item) {
            var parentFolder = item.parentFolder;
            // 当要删除的 item 所在的文件夹只有它一个 item，删除父 item 即可
            if (parentFolder.name !== 'Root' && parentFolder.numItems === 1) {
                removeItem(parentFolder);
                return;
            }
            item.remove();
        }

        var items = app.project.items;
        // 实际遍历顺序就是 project 面板中从上到下的顺序
        var lastCount = items.length;
        for (var i = 1, item, removedCount; i <= items.length; i++) {
            item = items[i];
            if (pattern.test(item.name)) {
                removeItem(item);
                // 删除 folderItem 会将里面的 items 也删掉
                removedCount = lastCount - items.length;
                lastCount = items.length;
                i -= removedCount;
            }
        }
    }

    removeItems(/^folder/);
})();
