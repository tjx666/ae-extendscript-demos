(function () {
    /**
     * 删除和给定正则匹配的 item
     * @param {RegExp} pattern
     */
    function removeItems(pattern) {
        if (!(pattern instanceof RegExp)) throw new TypeError(pattern + ' is not Regexp')
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
                i--;
            }
        }
    }
})();
