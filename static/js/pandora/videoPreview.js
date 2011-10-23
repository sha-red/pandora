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
            position: data.position,
            scaleToFill: true,
            timeline: '/' + data.id + '/timeline16p.png',
            width: data.width
        });
    return that;
};

