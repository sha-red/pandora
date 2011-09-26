// vim: et:ts=4:sw=4:sts=4:ft=javascript
pandora.ui.sortSelect = function() {
    var items = [],
        sortKey = !pandora.user.ui.item ? 'listSort' : 'itemSort',
        that;
    if (pandora.isClipView()) {
        items = pandora.site.clipKeys.map(function(key) {
            return Ox.extend(Ox.clone(key), {
                checked: key.id == pandora.user.ui[sortKey][0].key,
                title: 'Sort by ' + (!pandora.user.ui.item ? 'Clip ' : '') + key.title
            });
        });
        !pandora.user.ui.item && items.push({});
    }
    if (!pandora.user.ui.item) {
        items = Ox.merge(items, pandora.site.sortKeys.map(function(key) {
            return Ox.extend(Ox.clone(key), {
                checked: key.id == pandora.user.ui[sortKey][0].key,
                title: 'Sort by ' + key.title
            });
        }));
    }
    that = Ox.Select({
        id: 'sortSelect',
        items: items,
        width: 144
    })
    .css({
        float: 'left',
        margin: '4px 0 0 4px'
    })
    .bindEvent({
        change: function(data) {
            pandora.UI.set(sortKey, [{key: data.selected[0].id, operator: ''}]);
        }
    });
    pandora.UI.bind({
        listSort: function(value) {
            that.selectItem(value[0].key);
        },
        item: function(valye) {
            
        },
        itemSort: function(value) {
            that.selectItem(value[0].key);
        }
    });
    return that;
};

