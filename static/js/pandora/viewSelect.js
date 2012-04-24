// vim: et:ts=4:sw=4:sts=4:ft=javascript

'use strict';

pandora.ui.viewSelect = function() {
    var ui = pandora.user.ui,
        sortKey = !ui.item ? 'listSort' : 'itemSort',
        viewKey = !ui.item ? 'listView' : 'itemView',
        items = Ox.map(pandora.site[viewKey + 's'], function(view) {
            return ['data', 'files'].indexOf(view.id) == -1
                ? {id: view.id, title: 'View ' + view.title}
                : null;
        }),
        that;
    if (
        viewKey == 'itemView'
        && pandora.site.capabilities.canSeeExtraItemViews[pandora.user.level]
    ) {
        Ox.merge(items, [
            {},
            {id: 'data', title: 'View Data'},
            {id: 'files', title: 'View Files'}
        ]);
    }
    that = Ox.Select({
            id: 'viewSelect',
            items: items,
            value: ui[viewKey],
            width: !ui.item ? 144 : 128
        })
        .css({
            float: 'left',
            margin: '4px 0 0 4px'
        })
        .bindEvent({
            change: function(data) {
                pandora.UI.set(viewKey, data.value);
            },
            pandora_listview: function(data) {
                !ui.item && that.value(data.value);
            },
            pandora_itemview: function(data) {
                ui.item && that.value(data.value);
            }
        });
    return that;
};

