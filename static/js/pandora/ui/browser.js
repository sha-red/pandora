// vim: et:ts=4:sw=4:sts=4:ft=javascript
pandora.ui.browser = function() {
    var that;
    if (!pandora.user.ui.item) {
        pandora.user.ui.groupsSizes = pandora.getGroupsSizes();
        pandora.$ui.groups = pandora.ui.groups();
        that = Ox.SplitPanel({
            elements: [
                {
                    element: pandora.$ui.groups[0],
                    size: pandora.user.ui.groupsSizes[0]
                },
                {
                    element: pandora.$ui.groupsInnerPanel = pandora.ui.groupsInnerPanel()
                },
                {
                    element: pandora.$ui.groups[4],
                    size: pandora.user.ui.groupsSizes[4]
                },
            ],
            id: 'browser',
            orientation: 'horizontal'
        })
        .bindEvent({
            resize: function(data) {
                pandora.user.ui.groupsSize = data.size;
                pandora.$ui.groups.forEach(function(list) {
                    list.size();
                });
            },
            resizeend: function(data) {
                pandora.UI.set({groupsSize: data.size});
            },
            toggle: function(data) {
                pandora.UI.set({showGroups: !data.collapsed});
                data.collapsed && pandora.$ui.list.gainFocus();
            }
        });
    } else {
        var that = Ox.IconList({
            borderRadius: pandora.user.ui.icons == 'posters' ? 0 : 8,
            centered: true,
            defaultRatio: pandora.user.ui.icons == 'posters' ? 5/8 : 1,
            draggable: true,
            id: 'list',
            item: function(data, sort, size) {
                var ui = pandora.user.ui,
                    ratio = ui.icons == 'posters'
                        ? (ui.showSitePoster ? 5/8 : data.posterRatio) : 1,
                size = size || 64;
                return {
                    height: ratio <= 1 ? size : size / ratio,
                    id: data.id,
                    info: data[['title', 'director'].indexOf(sort[0].key) > -1 ? 'year' : sort[0].key],
                    title: data.title + (data.director ? ' (' + data.director + ')' : ''),
                    url: '/' + data.id + '/' + (
                        ui.icons == 'posters'
                        ? (ui.showSitePoster ? 'siteposter' : 'poster') : 'icon'
                    ) + size + '.jpg',
                    width: ratio >= 1 ? size : size * ratio
                };
            },
            items: function(data, callback) {
                pandora.api.find(Ox.extend(data, {
                    query: pandora.user.ui.find
                }), callback);
            },
            keys: ['director', 'id', 'posterRatio', 'title', 'year'],
            max: 1,
            min: 1,
            orientation: 'horizontal',
            selected: [pandora.user.ui.item],
            size: 64,
            sort: pandora.user.ui.listSort,
            unique: 'id'
        })
        .bindEvent({
            open: function() {
                that.scrollToSelection();
            },
            select: function(data) {
                pandora.UI.set({
                    'item': data.ids[0] 
                });
            },
            toggle: function(data) {
                pandora.UI.set({showMovies: !data.collapsed});
                if (data.collapsed) {
                    if (pandora.user.ui.itemView == 'timeline') {
                        pandora.$ui.editor.gainFocus();
                    }
                }
            },
            pandora_icons: function(data) {
                that.options({
                    borderRadius: data.value == 'posters' ? 0 : 8,
                    defaultRatio: data.value == 'posters' ? 5/8 : 1
                }).reloadList(true);
            },
            pandora_showsiteposter: function() {
                pandora.user.ui.icons == 'poster' && that.reloadList(true);
            }
        });
        pandora.enableDragAndDrop(that, false);
    }
    return that;
};

