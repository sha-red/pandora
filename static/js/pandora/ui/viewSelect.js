// vim: et:ts=4:sw=4:sts=4:ft=javascript

pandora.ui.viewSelect = function() {
    var sortKey = !pandora.user.ui.item ? 'listSort' : 'itemSort',
        viewKey = !pandora.user.ui.item ? 'listView' : 'itemView',
        that = Ox.Select({
            id: 'viewSelect',
            items: Ox.map(pandora.site[viewKey + 's'], function(view) {
                return viewKey == 'listView'
                    || ['data', 'files'].indexOf(view.id) == -1
                    || pandora.site.capabilities.canSeeExtraItemViews[pandora.user.level]
                    ? Ox.extend(Ox.clone(view), {
                        checked: view.id == pandora.user.ui[viewKey],
                        title: 'View ' + view.title
                    })
                    : null;
            }),
            width: !pandora.user.ui.item ? 144 : 128
        })
        .css({
            float: 'left',
            margin: '4px 0 0 4px'
        })
        .bindEvent({
            change: function(data) {
                var key = data.selected[0].id,
                    set = {};
                set[viewKey] = key
                if (
                    !pandora.isClipView(key, pandora.user.ui.item)
                    && ['title', 'position'].indexOf(pandora.user.ui[sortKey][0].key) > -1
                ) {
                    set[sortKey] = pandora.site.user.ui.listSort;
                }
                pandora.UI.set(set);
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

