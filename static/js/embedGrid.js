'use strict';

pandora.ui.embedGrid = function() {

    var ui = pandora.user.ui,

        $list = Ox.IconList({
            borderRadius: ui.icons == 'posters' ? 0 : 16,
            defaultRatio: ui.icons == 'posters' ? pandora.site.posters.ratio : 1,
            id: 'list',
            item: function(data, sort, size) {
                var ratio = ui.icons == 'posters'
                        ? (ui.showSitePosters ? pandora.site.posters.ratio : data.posterRatio) : 1,
                    url = '/' + data.id + '/' + (
                        ui.icons == 'posters'
                        ? (ui.showSitePosters ? 'siteposter' : 'poster') : 'icon'
                    ) + size + '.jpg?' + data.modified,
                    format, info, sortKey = sort[0].key;
                if (['title', 'director', 'random'].indexOf(sortKey) > -1) {
                    info = data['year'];
                } else {
                    format = pandora.getSortKeyData(sortKey).format;
                    if (format) {
                        info = (
                            /^color/.test(format.type.toLowerCase()) ? Ox.Theme : Ox
                        )['format' + Ox.toTitleCase(format.type)].apply(
                            this, [data[sortKey]].concat(format.args || [])
                        );
                        if (sortKey == 'rightslevel') {
                            info.css({width: size * 0.75 + 'px'});
                        }
                    } else {
                        info = data[sortKey];
                    }
                }
                size = size || 128;
                return {
                    height: Math.round(ratio <= 1 ? size : size / ratio),
                    id: data.id,
                    info: info,
                    title: data.title + (data.director && data.director.length ? ' (' + data.director.join(', ') + ')' : ''),
                    url: url,
                    width: Math.round(ratio >= 1 ? size : size * ratio)
                };
            },
            items: function(data, callback) {
                pandora.api.find(Ox.extend(data, {
                    query: ui.find
                }), callback);
                return Ox.clone(data, true);
            },
            keys: ['director', 'id', 'modified', 'posterRatio', 'title', 'year'],
            selected: ui.listSelection,
            size: 128,
            sort: ui.listSort,
            unique: 'id'
        })
        .addClass('OxMedia')
        .bindEvent({
            init: function(data) {
                $status.html(
                    (data.items ? Ox.formatNumber(data.items) : Ox._('No'))
                    + ' ' + pandora.site.itemName[
                        data.items == 1 ? 'singular' : 'plural'
                    ]
                );
            },
            open: function(data) {
                window.open('/' + data.ids[0] + '', '_blank');
            }
        }),

        $statusbar = Ox.Bar({size: 16})
            .css({
                textAlign: 'center'
            }),

        $status = Ox.Element()
            .css({
                margin: '2px 4px',
                fontSize: '9px',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
            })
            .html(Ox._('Loading...'))
            .appendTo($statusbar),

        that = Ox.SplitPanel({
            elements: [
                {element: $list},
                {element: $statusbar, size: 16}
            ],
            orientation: 'vertical'
        });

    that.resizePanel = function() {
        $list.size();
        return that;
    };

    return that;

};