// vim: et:ts=4:sw=4:sts=4:ft=javascript
'use strict';
pandora.ui.browser = function() {
    var that;
    if (!pandora.user.ui.item) {
        pandora.user.ui.filterSizes = pandora.getFilterSizes();
        pandora.$ui.filters = pandora.ui.filters();
        that = Ox.SplitPanel({
            elements: [
                {
                    element: pandora.$ui.filters[0],
                    size: pandora.user.ui.filterSizes[0]
                },
                {
                    element: pandora.$ui.filtersInnerPanel = pandora.ui.filtersInnerPanel()
                },
                {
                    element: pandora.$ui.filters[4],
                    size: pandora.user.ui.filterSizes[4]
                },
            ],
            id: 'browser',
            orientation: 'horizontal'
        })
        .bindEvent({
            resize: function(data) {
                pandora.$ui.filters.forEach(function(list) {
                    list.size();
                });
                if (pandora.user.ui.listView == 'map') {
                    pandora.$ui.map.resizeMap();
                } else if (pandora.user.ui.listView == 'calendar') {
                    pandora.$ui.calendar.resizeCalendar();
                }
            },
            resizeend: function(data) {
                pandora.UI.set({filtersSize: data.size});
            },
            toggle: function(data) {
                data.collapsed && pandora.$ui.list.gainFocus();
                pandora.UI.set({showFilters: !data.collapsed});
                if (pandora.user.ui.listView == 'map') {
                    pandora.$ui.map.resizeMap();
                } else if (pandora.user.ui.listView == 'calendar') {
                    pandora.$ui.calendar.resizeCalendar();
                }
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
                size = size || 64;
                var ui = pandora.user.ui,
                    ratio = ui.icons == 'posters'
                        ? (ui.showSitePoster ? 5/8 : data.posterRatio) : 1,
                    url = '/' + data.id + '/' + (
                        ui.icons == 'posters'
                        ? (ui.showSitePoster ? 'siteposter' : 'poster') : 'icon'
                    ) + '128.jpg',
                    format, info, sortKey = sort[0].key;
                if (['title', 'director'].indexOf(sortKey) > -1) {
                    info = data['year'];
                } else {
                    // fixme: this is duplicated many times
                    format = pandora.getSortKeyData(sortKey).format;
                    if (format) {
                        info = (
                            /^color/.test(format.type.toLowerCase()) ? Ox.Theme : Ox
                        )['format' + Ox.toTitleCase(format.type)].apply(
                            this, Ox.merge([data[sortKey]], format.args || [])
                        );
                    } else {
                        info = data[sortKey];
                    }
                }
                return {
                    height: ratio <= 1 ? size : size / ratio,
                    id: data.id,
                    info: info,
                    title: data.title + (data.director.length ? ' (' + data.director.join(', ') + ')' : ''),
                    url: url,
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
            pageLength: 32,
            selected: [pandora.user.ui.item],
            size: 64,
            sort: ['text', 'position'].indexOf(pandora.user.ui.listSort[0].key) > -1
                ? pandora.site.user.ui.listSort: pandora.user.ui.listSort,
            unique: 'id'
        })
        .css({overflowY: 'hidden'}) // this fixes a bug in firefox
        .bindEvent({
            open: function() {
                that.scrollToSelection();
            },
            resize: function(data) {
                if (pandora.user.ui.itemView == 'map') {
                    pandora.ui.$map.resizeMap();
                } else if (pandora.user.ui.itemView == 'calendar') {
                    pandora.ui.$calendar.resizeCalendar();
                }
            },
            select: function(data) {
                pandora.UI.set({
                    'item': data.ids[0]
                });
            },
            toggle: function(data) {
                pandora.UI.set({showBrowser: !data.collapsed});
                if (data.collapsed) {
                    if (pandora.user.ui.itemView == 'timeline') {
                        pandora.$ui.editor.gainFocus();
                    }
                }
                if (pandora.user.ui.itemView == 'map') {
                    pandora.$ui.map.resizeMap();
                } else if (pandora.user.ui.itemView == 'calendar') {
                    pandora.$ui.calendar.resizeCalendar();
                }
            },
            pandora_icons: function(data) {
                that.options({
                    borderRadius: data.value == 'posters' ? 0 : 8,
                    defaultRatio: data.value == 'posters' ? 5/8 : 1
                }).reloadList(true);
            },
            pandora_item: function(data) {
                that.options({selected: [data.value]});
            },
            pandora_showsiteposter: function() {
                pandora.user.ui.icons == 'posters' && that.reloadList(true);
            }
        });
        pandora.enableDragAndDrop(that, false);
    }
    return that;
};

