// vim: et:ts=4:sw=4:sts=4:ft=javascript

pandora.ui.videoPreview = function(data) {
    var that = Ox.VideoPreview({
            duration: data.duration,
            getFrame: function(position) {
                var width = pandora.user.ui.sidebarSize,
                    height = Math.min(width, 256),
                    resolution = Ox.filter(pandora.site.video.resolutions, function(resolution, i) {
                        return resolution >= height || i == pandora.site.video.resolutions.length - 1;
                    })[0];
                return '/' + data.id + '/' + resolution + 'p' + (
                    Ox.isUndefined(position) ? '' : position
                ) + '.jpg';
            },
            frameRatio: data.frameRatio,
            height: pandora.getInfoHeight(),
            scaleToFill: true,
            timeline: '/' + data.id + '/timeline16p.png',
            width: pandora.user.ui.sidebarSize
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

