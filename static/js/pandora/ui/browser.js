// vim: et:ts=4:sw=4:sts=4:ft=javascript
pandora.ui.browser = function() {
    var sizes, that;
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
            resize: function(event, data) {
                pandora.user.ui.groupsSize = data;
                $.each(pandora.$ui.groups, function(i, list) {
                    list.size();
                });
            },
            resizeend: function(event, data){
                pandora.UI.set({groupsSize: data});
            },
            toggle: function(event, data) {
                pandora.UI.set({showGroups: !data.collapsed});
                data.collapsed && pandora.$ui.list.gainFocus();
            }
        });
    } else {
        var that = Ox.IconList({
            borderRadius: pandora.user.ui.icons == 'posters' ? 0 : 8,
            centered: true,
            defaultRatio: pandora.user.ui.icons == 'posters' ? 5/8 : 1,
            id: 'list',
            item: function(data, sort, size) {
                var icons = pandora.user.ui.icons,
                    ratio = icons == 'posters' ? data.posterRatio : 1;
                size = size || 64;
                return {
                    height: ratio <= 1 ? size : size / ratio,
                    id: data.id,
                    info: data[['title', 'director'].indexOf(sort[0].key) > -1 ? 'year' : sort[0].key],
                    title: data.title + (data.director ? ' (' + data.director + ')' : ''),
                    url: icons == 'posters' 
                        ? '/' + data.id + '/poster' + size + '.jpg'
                        : '/' + data.id + '/icon' + size + '.jpg',
                    width: ratio >= 1 ? size : size * ratio
                };
            },
            items: function(data, callback) {
                pandora.api.find(Ox.extend(data, {
                    query: pandora.user.ui.query
                }), callback);
            },
            keys: ['director', 'id', 'posterRatio', 'title', 'year'],
            max: 1,
            min: 1,
            orientation: 'horizontal',
            selected: [pandora.user.ui.item],
            size: 64,
            sort: pandora.user.ui.lists[pandora.user.ui.list].sort,
            unique: 'id'
        })
        .bindEvent({
            open: function(event, data) {
                that.scrollToSelection();
            },
            select: function(event, data) {
                pandora.UI.set('lists|' + pandora.user.ui.list + '|selected', data.ids);
                pandora.URL.set(data.ids[0]);
            },
            toggle: function(event, data) {
                pandora.UI.set({showMovies: !data.collapsed});
                if (data.collapsed) {
                    if (pandora.user.ui.itemView == 'timeline') {
                        pandora.$ui.editor.gainFocus();
                    }
                }
            }
        });
    }
    that.update = function() {
        pandora.$ui.contentPanel.replaceElement(0, pandora.$ui.browser = pandora.ui.browser());
    }
    return that;
};

