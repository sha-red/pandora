// vim: et:ts=4:sw=4:sts=4:ft=javascript
pandora.ui.clipPlayer = function() {
    var that = Ox.VideoPlayer({
        controlsBottom: ['play', 'previous', 'next', 'volume'],
        controlsTop: ['fullscreen', 'scale'],
        enableMouse: true,
        height: 384,
        paused: true,
        position: 0,
        video: function(range, callback) {
            var callback = arguments[arguments.length - 1],
                range = arguments.length == 2 ? arguments[0] : null,
                itemQuery = pandora.user.ui.find,
                query = {conditions:[]};
            //fixme: can this be in pandora.Query? dont just check for subtitles
            itemQuery.conditions.forEach(function(q) {
                if (q.key == 'subtitles') {
                    query.conditions.push({key: 'subtitles', value: q.value, operator: q.operator});
                }
            });
            pandora.api.findClips(Ox.extend({
                query: query,
                itemQuery: itemQuery
            }, range ? {
                keys: ['id', 'in', 'out', 'subtitles'],
                range: range,
                sort: pandora.user.ui.listSort
            } : {}), function(result) {
                //Ox.print('API findClips range', range, 'result', result.data);
                if (!range) {
                    callback(result.data.items);
                } else {
                    var counter = 0,
                        length = range[1] - range[0],
                        data = [];
                    result.data.items.forEach(function(item, i) {
                        var id = item.id.split('/')[0]
                        pandora.api.get({id: id, keys: ['durations']}, function(result) {
                            //Ox.print('API get item', id, 'result', result.data);
                            var points = [item['in'], item.out],
                                partsAndPoints = pandora.getVideoPartsAndPoints(result.data.durations, points);                       
                            data[i] = {
                                parts: partsAndPoints.parts.map(function(i) {
                                    return '/' + id + '/96p' + (i + 1) + '.' + pandora.user.videoFormat;
                                }),
                                points: partsAndPoints.points
                            }
                            if (++counter == length) {
                                callback(data);
                            }
                        });
                    });
                }
            });
        },
        width: 512
    });
    return that;
};
