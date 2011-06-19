// vim: et:ts=4:sw=4:sts=4:ft=js
pandora.ui.filter = function() {
    var that = Ox.Filter({
        findKeys: Ox.map(pandora.site.itemKeys, function(key) {
            return key.id == 'all' ? null : {
                autocomplete: key.autocomplete,
                autocompleteSortKey: key.autocompleteSortKey,
                format: key.format,
                id: key.id,
                title: key.title,
                type: key.type == 'layer' ? Ox.getObjectById(
                    pandora.site.layers, key.id
                ).type : key.type
            };
        }),
        sortKeys: pandora.site.sortKeys,
        viewKeys: pandora.site.listViews
    });
    return that;
};

