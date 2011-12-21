// vim: et:ts=4:sw=4:sts=4:ft=javascript

'use strict';

pandora.ui.viewSelect = function() {
    var ui = pandora.user.ui,
        sortKey = !ui.item ? 'listSort' : 'itemSort',
        viewKey = !ui.item ? 'listView' : 'itemView',
        that = Ox.Select({
                id: 'viewSelect',
                items: Ox.map(pandora.site[viewKey + 's'], function(view) {
                    return viewKey == 'listView'
                        || ['data', 'files'].indexOf(view.id) == -1
                        || pandora.site.capabilities.canSeeExtraItemViews[pandora.user.level]
                        ? Ox.extend(Ox.clone(view), {
                            checked: view.id == ui[viewKey],
                            title: 'View ' + view.title
                        })
                        : null;
                }),
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
                    that.selectItem(data.value);
                },
                pandora_itemview: function(data) {
                    that.selectItem(data.value);
                }
            });
    return that;
};

