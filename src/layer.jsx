(function(){
    /** @type {CompItem} */
    var comp = app.project.activeItem;
    var layers = comp.layers;
    var layer = layers[1];
    $.writeln(layer.name);
})();