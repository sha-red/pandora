// vim: et:ts=4:sw=4:sts=4:ft=javascript

'use strict';

pandora.ui.sortSelect = function(isNavigationView) {
    var isClipView = pandora.isClipView(),
        items = [],
        sortKey = !pandora.user.ui.item ? 'listSort' : 'itemSort',
        that;
    if (isClipView) {
        items = pandora.site.clipKeys.map(function(key) {
            return Ox.extend(Ox.clone(key), {
                title: 'Sort by ' + (!pandora.user.ui.item ? 'Clip ' : '') + key.title
            });
        });
        // fixme: a separator would be good
        // !pandora.user.ui.item && items.push({});
    }
    if (!pandora.user.ui.item) {
        items = Ox.merge(items, Ox.map(pandora.site.sortKeys, function(key) {
            return Ox.getPositionById(items, key.id) == -1
                ? Ox.extend(Ox.clone(key), {
                    title: 'Sort by ' + key.title
                })
                : null;
        }));
    }
    that = Ox.Select({
            id: 'sortSelect',
            items: items,
            value: pandora.user.ui[sortKey][0].key,
            width: isNavigationView ? 128 : 144
        })
        .css({
            float: isNavigationView ? 'right' : 'left',
            margin: isNavigationView ? '4px 4px 0 0' : '4px 0 0 4px'
        })
        .bindEvent({
            change: function(data) {
                var key = data.value;
                pandora.UI.set(sortKey, [{
                    key: key,
                    operator: pandora.getSortOperator(key)
                }]);
            },
            pandora_listsort: function(data) {
                that.value(data.value[0].key);
            },
            pandora_itemsort: function(data) {
                that.value(data.value[0].key);
            }
        });
    return that;
};

