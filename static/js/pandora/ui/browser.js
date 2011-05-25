// vim: et:ts=4:sw=4:sts=4:ft=js
pandora.ui.browser = function() {
    var that;
    if (!app.user.ui.item) {
        app.$ui.groups = pandora.ui.groups();
        that = new Ox.SplitPanel({
            elements: [
                {
                    element: app.$ui.groups[0],
                    size: app.ui.groups[0].size
                },
                {
                    element: app.$ui.groupsInnerPanel = pandora.ui.groupsInnerPanel()
                },
                {
                    element: app.$ui.groups[4],
                    size: app.ui.groups[4].size
                },
            ],
            id: 'browser',
            orientation: 'horizontal'
        })
        .bindEvent({
            resize: function(event, data) {
                app.user.ui.groupsSize = data;
                $.each(app.$ui.groups, function(i, list) {
                    list.size();
                });
            },
            resizeend: function(event, data){
                pandora.UI.set({groupsSize: data});
            },
            toggle: function(event, data) {
                pandora.UI.set({showGroups: !data.collapsed});
                data.collapsed && app.$ui.list.gainFocus();
            }
        });
    } else {
        var that = new Ox.IconList({
            centered: true,
            id: 'list',
            item: function(data, sort, size) {
                var ratio = data.poster.width / data.poster.height;
                size = size || 64;
                return {
                    height: ratio <= 1 ? size : size / ratio,
                    id: data['id'],
                    info: data[['title', 'director'].indexOf(sort[0].key) > -1 ? 'year' : sort[0].key],
                    title: data.title + (data.director ? ' (' + data.director + ')' : ''),
                    url: data.poster.url.replace(/jpg/, size + '.jpg'),
                    width: ratio >= 1 ? size : size * ratio
                };
            },
            items: function(data, callback) {
                //Ox.print('data, pandora.Query.toObject', data, pandora.Query.toObject())
                pandora.api.find($.extend(data, {
                    query: pandora.Query.toObject()
                }), callback);
            },
            keys: ['director', 'id', 'poster', 'title', 'year'],
            max: 1,
            min: 1,
            orientation: 'horizontal',
            selected: [app.user.ui.item],
            size: 64,
            sort: app.user.ui.lists[app.user.ui.list].sort,
            unique: 'id'
        })
        .bindEvent({
            open: function(event, data) {
                that.scrollToSelection();
            },
            select: function(event, data) {
                pandora.URL.set(data.ids[0]);
            },
            toggle: function(event, data) {
                pandora.UI.set({showMovies: !data.collapsed});
                if (data.collapsed) {
                    if (app.user.ui.itemView == 'timeline') {
                        app.$ui.editor.gainFocus();
                    }
                }
            }
        });
    }
    that.update = function() {
        app.$ui.contentPanel.replaceElement(0, app.$ui.browser = pandora.ui.browser());
    }
    return that;
};

