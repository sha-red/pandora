// vim: et:ts=4:sw=4:sts=4:ft=js
pandora.ui.filter = function() {
    var that = new Ox.Filter({
        findKeys: Ox.map(app.site.itemKeys, function(key) {
            return key.id == 'all' ? null : {
                autocomplete: key.autocomplete,
                autocompleteSortKey: key.autocompleteSortKey,
                format: key.format,
                id: key.id,
                title: key.title,
                type: key.type == 'layer' ? Ox.getObjectById(
                    app.site.layers, key.id
                ).type : key.type
            };
        }),
        sortKeys: app.ui.sortKeys,
        viewKeys: app.site.listViews
    });
    return that;
};

