// vim: et:ts=4:sw=4:sts=4:ft=javascript
pandora.ui.sortSelect = function() {
    var list = pandora.user.ui.lists[pandora.user.ui.list],
        items = pandora.site.sortKeys.map(function(key) {
            return Ox.extend(Ox.clone(key), {
                checked: list.sort[0].key == key.id,
                title: 'Sort by ' + key.title
            });
        }),
        that;
    if (pandora.isClipView(list.listView)) {
        items = Ox.merge(pandora.site.clipKeys.map(function(key) {
            return Ox.extend(Ox.clone(key), {
                checked: list.sort[0].key == key.id,
                title: 'Sort by ' + key.title
            });
        }), {}, items);
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
            //var query = Ox.unserialize(document.location.search);
            //query.sort = data.selected.id;
            //pandora.URL.set('/' + pandora.user.ui.lists[pandora.user.ui.list].listView + '/?' + Ox.serialize(query));
            pandora.UI.set(
                'lists|' + pandora.user.ui.list + '|sort',
                [{key: data.selected[0].id, operator: ''}]
            );
            pandora.URL.update();
        }
    });
    return that;
};

