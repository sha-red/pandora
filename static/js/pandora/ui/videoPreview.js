// vim: et:ts=4:sw=4:sts=4:ft=javascript

pandora.ui.videoPreview = function(data) {
    var that = Ox.VideoPreview({
            duration: data.duration,
            getFrame: function(position) {
                var resolution = Ox.filter(pandora.site.video.resolutions, function(resolution, i) {
                        return resolution >= data.height || i == pandora.site.video.resolutions.length - 1;
                    })[0];
                return '/' + data.id + '/' + resolution + 'p' + (
                    Ox.isUndefined(position) ? '' : position
                ) + '.jpg';
            },
            frameCSS: data.frameCSS,
            frameRatio: data.frameRatio,
            height: data.height,
            scaleToFill: true,
            timeline: '/' + data.id + '/timeline16p.png',
            width: data.width
        })
        .bindEvent({
            click: function(event) {
                if (pandora.user.ui.item) {
                    pandora.$ui[
                        pandora.user.ui.itemView == 'player' ? 'player' : 'editor'
                    ].options({
                        position: event.position
                    });
                } else {
                    pandora.UI.set(
                        'videoPoints|' + data.id,
                        {'in': 0, out: 0, position: event.position}
                    );
                    pandora.URL.set(
                        '/' + data.id + '/timeline' //'/' + Ox.formatDuration(event.position, 2)
                    );
                }
            }
        });
    return that;
};

