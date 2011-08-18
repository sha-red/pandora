// vim: et:ts=4:sw=4:sts=4:ft=javascript

pandora.ui.videoPreview = function(data) {
    var frameWidth = pandora.user.ui.sidebarSize,
        frameHeight = Math.round(frameWidth / data.video.aspectRatio),
        that = Ox.VideoPreview({
            duration: data.video.duration,
            getFrame: function(position) {
                var width = pandora.user.ui.sidebarSize,
                    height = Math.round(width / pandora.user.infoRatio),
                    resolution = Ox.filter(pandora.site.resolutions, function(resolution, i) {
                        return resolution >= height || i == pandora.site.resolutions.length - 1;
                    })[0];
                return '/' + data.id + '/' + resolution + 'p' + (
                    Ox.isUndefined(position) ? '' : position
                ) + '.jpg';
            },
            frameHeight: frameHeight,
            frameWidth: frameWidth,
            timeline: '/' + data.id + '/timeline16p.png',
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
                    pandora.UI.set('videoPosition|' + data.id, event.position);
                    pandora.URL.set(
                        '/' + data.id + '/timeline' //'/' + Ox.formatDuration(event.position, 2)
                    );
                }
            }
        });
    function getResolution() {
        return 
    }
    return that;
};

