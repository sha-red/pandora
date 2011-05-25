// vim: et:ts=4:sw=4:sts=4:ft=js
pandora.ui.filter = function() {
    var that = new Ox.Filter({
        findKeys: $.map(app.config.itemKeys, function(key) {
            return {
                autocomplete: key.autocomplete,
                autocompleteSortKey: key.autocompleteSortKey,
                format: key.format,
                id: key.id,
                title: key.title,
                type: key.type == 'layer' ? Ox.getObjectById(
                    app.config.layers, key.id
                ).type : key.type
            };
        }),
        sortKeys: app.ui.sortKeys,
        viewKeys: app.config.listViews
    });
    return that;
};

