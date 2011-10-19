pandora.ui.itemClips = function(options) {

    var self = {},
        that = Ox.Element()
            .css({
                height: '192px',
                margin: '4px'
            })
            .bindEvent({
                singleclick: singleclick
            });

    self.options = Ox.extend({
        clips: 5,
        duration: 0,
        id: '',
        ratio: 8/5
    }, options);

    self.clips = pandora.getClipPoints(self.options.duration, self.options.clips);
    self.size = 128;
    self.width = self.options.ratio > 1 ? self.size : Math.round(self.size * self.options.ratio);
    self.height = self.options.ratio > 1 ? Math.round(self.size / self.options.ratio) : self.size;

    self.clips.forEach(function(clip, i) {
        var id = self.options.id + '/' + clip['in'],
            url = '/' + self.options.id + '/' + self.height + 'p' + clip['in'] + '.jpg',
            $item = Ox.IconItem({
                imageHeight: self.height,
                imageWidth: self.width,
                id: id,
                info: Ox.formatDuration(clip['in']) + ' - ' + Ox.formatDuration(clip.out),
                title: '',
                url: url,
            })
            .addClass('OxInfoIcon')
            .css({
                float: 'left',
                margin: '2px'
            })
            .data({'in': clip['in'], out: clip.out});
        $item.$element.find('.OxTarget').addClass('OxSpecialTarget');
        that.append($item);
    });

    function singleclick(data) {
        var $img, $item, $target = $(data.target), $video, points;
        if ($target.is('.OxSpecialTarget')) {
            $item = $target.parent().parent();
            $img = $item.find('.OxIcon > img');
            $video = $item.find('.OxIcon > .OxVideoPlayer');
            points = [$item.data('in'), $item.data('out')];
            if ($img.length) {
                pandora.api.get({id: self.options.id, keys: ['durations']}, function(result) {
                    var partsAndPoints = pandora.getVideoPartsAndPoints(
                            result.data.durations, points
                        ),
                        $player = Ox.VideoPlayer({
                            height: self.height,
                            'in': partsAndPoints.points[0],
                            out: partsAndPoints.points[1],
                            //paused: true,
                            playInToOut: true,
                            poster: '/' + self.options.id + '/' + self.height + 'p' + points[0] + '.jpg',
                            rewind: true,
                            video: partsAndPoints.parts.map(function(i) {
                                return '/' + self.options.id + '/96p' + (i + 1)
                                    + '.' + pandora.user.videoFormat;
                            }),
                            width: self.width
                        })
                        .addClass('OxTarget OxSpecialTarget')
                        .bindEvent({
                            doubleclick: function() {
                                var item = self.options.id,
                                    set = {
                                        item: item,
                                        itemView: pandora.user.ui.videoView
                                    };
                                set['videoPoints.' + item] = {
                                    'in': points[0],
                                    out: points[1],
                                    position: points[0]
                                };
                                pandora.UI.set(set);
                            },
                            singleclick: function() {
                                $player.togglePaused();
                            }
                        });
                        $img.replaceWith($player.$element);
                });
            }
        }
    }

    return that;

};