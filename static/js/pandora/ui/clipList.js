// vim: et:ts=4:sw=4:sts=4:ft=javascript

pandora.ui.clipList = function(videoRatio) {

    var ui = pandora.user.ui,
        fixedRatio = !ui.item ? 16/9 : videoRatio,
        isClipView = !ui.item ? ui.listView == 'clip' : ui.itemView == 'clips',

        that = Ox.IconList({
            fixedRatio: fixedRatio,
            item: function(data, sort, size) {
                size = size || 128; // fixme: is this needed?
                var ratio, width, height, url, sortKey, info;
                if (!ui.item) {
                    ratio = data.videoRatio;
                    width = ratio > fixedRatio ? size : Math.round(size * ratio / fixedRatio);
                    height = Math.round(width / ratio);
                } else {
                    width = fixedRatio > 1 ? size : Math.round(size * fixedRatio);
                    height = fixedRatio > 1 ? Math.round(size / fixedRatio) : size;
                }
                url = '/' + data.id.split('/')[0] + '/' + height + 'p' + data['in'] + '.jpg';
                sortKey = sort[0].key.split(':').pop();
                info = ['hue', 'saturation', 'lightness'].indexOf(sortKey) > -1
                    ? Ox.formatColor(data[sortKey], sortKey)
                    : Ox.formatDuration(data['in'], 'short') + ' - '
                    + Ox.formatDuration(data['out'], 'short');
                return {
                    height: height,
                    id: data.id,
                    info: info,
                    title: data.value,
                    url: url,
                    width: width
                };
            },
            items: function(data, callback) {
                if (!isClipView) {
                    // fixme: this will have to be updated
                    callback({data: {items: []}});
                    return;
                }
                var itemQuery, query;
                if (!ui.item) {
                    itemQuery = ui.find;
                    query = {conditions: [], operator: '&'};
                    // if the item query contains a layer condition,
                    // then this condition is added to the clip query
                    // fixme: don't just check for 'subtitles'
                    itemQuery.conditions.forEach(function(condition) {
                        if (condition.key == 'subtitles') {
                            query.conditions.push({
                                key: 'value',
                                value: condition.value,
                                operator: condition.operator
                            });
                        }
                    });
                } else {
                    itemQuery = {
                        conditions:[{key: 'id', value: ui.item, operator: '=='}],
                        operator: '&'
                    };
                    // fixme: there is currently no way to add a clip query
                    // we'll need something like itemFind (vs. listFind)
                    query = {conditions: [], operator: '&'};
                }
                pandora.api.findAnnotations(Ox.extend({
                    itemQuery: itemQuery,
                    query: query
                }, data), callback);
            },
            keys: Ox.merge(
                ['id', 'in', 'out', 'value'],
                !ui.item ? ['videoRatio'] : []
            ),
            max: 1,
            orientation: 'both',
            size: 128,
            sort: !ui.item ? ui.listSort : ui.itemSort,
            unique: 'id'
        })
        .bindEvent({
            init: function(data) {
                // fixme: status needs an overhaul
                if (!ui.item) {
                    pandora.$ui.total.html(pandora.ui.status('total', data));
                }
            },
            open: function(data) {
                var id = data.ids[0],
                    item = !ui.item ? id.split('/')[0] : ui.item,
                    points = {
                        'in': that.value(id, 'in'),
                        out: that.value(id, 'out')
                    },
                    set = {
                        item: item,
                        itemView: pandora.user.ui.videoView
                    };
                set['videoPoints.' + item] = Ox.extend(points, {
                    position: points['in']
                });
                pandora.UI.set(set);
            },
            openpreview: function(data) {
                // on press space key
                var $video = that.find('.OxItem.OxSelected > .OxIcon > .OxVideoPlayer');
                if ($video) {
                    // trigger singleclick
                    $video.trigger('mousedown');
                    Ox.UI.$window.trigger('mouseup');
                }
                that.closePreview();
            },
            select: function(data) {
                if (data.ids.length) {
                    var id = data.ids[0],
                        item = id.split('/')[0], width, height,
                        $img = that.find('.OxItem.OxSelected > .OxIcon > img'),
                        $video = that.find('.OxItem.OxSelected > .OxIcon > .OxVideoPlayer'),
                        size = 128, ratio, width, height;
                    if ($img.length) {
                        if (!ui.item) {
                            ratio = that.value(id, 'videoRatio');
                            width = ratio > fixedRatio ? size : Math.round(size * ratio / fixedRatio);
                            height = Math.round(width / ratio);
                        } else {
                            width = fixedRatio > 1 ? size : Math.round(size * fixedRatio);
                            height = fixedRatio > 1 ? Math.round(size / fixedRatio) : size;
                        }
                        pandora.api.get({id: item, keys: ['durations']}, function(result) {
                            var points = [that.value(id, 'in'), that.value(id, 'out')],
                                partsAndPoints = pandora.getVideoPartsAndPoints(
                                    result.data.durations, points
                                ),
                                $player = Ox.VideoPlayer({
                                    height: height,
                                    'in': partsAndPoints.points[0],
                                    out: partsAndPoints.points[1],
                                    paused: true,
                                    playInToOut: true,
                                    poster: '/' + item + '/' + height + 'p' + points[0] + '.jpg',
                                    width: width,
                                    video: partsAndPoints.parts.map(function(i) {
                                        return '/' + item + '/96p' + (i + 1)
                                            + '.' + pandora.user.videoFormat;
                                    })
                                })
                                .addClass('OxTarget')
                                .bindEvent({
                                    // doubleclick opens item
                                    singleclick: function() {
                                        $player.$element.is('.OxSelectedVideo')&& $player.togglePaused();
                                    }
                                });
                            $img.replaceWith($player.$element);
                            $('.OxSelectedVideo').removeClass('OxSelectedVideo');
                            $player.$element.addClass('OxSelectedVideo');
                        });
                    } else if ($video.length) {
                        // item select fires before video click
                        // so we have to make sure that selecting
                        // an item that already has a video
                        // doesn't click through to play
                        setTimeout(function() {
                            $('.OxSelectedVideo').removeClass('OxSelectedVideo');
                            $video.addClass('OxSelectedVideo');
                        }, 300);
                    }
                    !ui.item && pandora.UI.set('listSelection', [item]);
                } else {
                    $('.OxSelectedVideo').removeClass('OxSelectedVideo');
                    !ui.item && pandora.UI.set('listSelection', []);
                }
            }
        });

    return that;

}