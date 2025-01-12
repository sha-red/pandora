'use strict';

pandora.ui.embedGrid = function() {

    var ui = pandora.user.ui,

        options = getOptions(),

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
                    title: pandora.getItemTitle(data),
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
            keys: ['id', 'modified', 'posterRatio'].concat(pandora.site.itemTitleKeys),
            max: 1,
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

        $titlebar = Ox.Bar({size: 16}),

        $title = Ox.$('<div>')
            .css({
                margin: '4px 4px',
                textAlign: 'center',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
            })
            .html(options.title || '')
            .appendTo($titlebar),

        $statusbar = Ox.Bar({size: 16}),

        $status = Ox.$('<div>')
            .css({
                margin: '2px 4px',
                fontSize: '9px',
                textAlign: 'center',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
            })
            .html(Ox._('Loading...'))
            .appendTo($statusbar),

        that = Ox.SplitPanel({
            elements: (options.title ? [
                {element: $titlebar, size: 24}
            ] : []).concat([
                {element: $list},
                {element: $statusbar, size: 16}
            ]),
            orientation: 'vertical'
        });

    function getOptions() {
        var options = {};
        if (ui._hash.query) {
            ui._hash.query.forEach(function(condition) {
                options[condition.key] = condition.value;
            });
        }
        return options;
    }

    that.resizePanel = function() {
        $list.size();
        return that;
    };

    return that;

};
