// vim: et:ts=4:sw=4:sts=4:ft=javascript

'use strict';

pandora.ui.videoPreview = function(data) {
    var that = Ox.VideoPreview({
            duration: data.duration,
            getFrame: function(position) {
                var resolutions = Ox.filter(pandora.site.video.resolutions, function(resolution, i) {
                        return resolution >= data.height;
                    }),
                    resolution = resolutions.length
                        ? Ox.min(resolutions)
                        : Ox.max(pandora.site.video.resolutions);
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

