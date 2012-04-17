// vim: et:ts=4:sw=4:sts=4:ft=javascript

'use strict';

pandora.ui.player = function(data) {

    // fixme: var ui = pandora.user.ui;

    return Ox.VideoPanel({
        annotationsCalendarSize: pandora.user.ui.annotationsCalendarSize,
        annotationsFont: pandora.user.ui.annotationsFont,
        annotationsMapSize: pandora.user.ui.annotationsMapSize,
        annotationsRange: pandora.user.ui.annotationsRange,
        annotationsSize: pandora.user.ui.annotationsSize,
        annotationsSort: pandora.user.ui.annotationsSort,
        censored: data.censored,
        clickLink: pandora.clickLink,
        cuts: data.cuts || [],
        duration: data.duration,
        enableDownload: pandora.site.capabilities.canDownloadVideo[pandora.user.level] >= data.rightslevel,
        enableSubtitles: pandora.user.ui.videoSubtitles,
        find: pandora.user.ui.itemFind,
        getTimelineImageURL: function(i) {
            return '/' + pandora.user.ui.item + '/timeline64p' + i + '.png';
        },
        height: pandora.$ui.contentPanel.size(1),
        'in': pandora.user.ui.videoPoints[pandora.user.ui.item]['in'],
        layers: data.annotations,
        muted: pandora.user.ui.videoMuted,
        out: pandora.user.ui.videoPoints[pandora.user.ui.item].out,
        position: pandora.user.ui.videoPoints[pandora.user.ui.item].position,
        resolution: pandora.user.ui.videoResolution,
        scaleToFill: pandora.user.ui.videoScale == 'fill',
        selected: pandora.user.ui.videoPoints[pandora.user.ui.item].annotation
            ? pandora.user.ui.item + '/' + pandora.user.ui.videoPoints[pandora.user.ui.item].annotation
            : '',
        showAnnotations: pandora.user.ui.showAnnotations,
        showAnnotationsCalendar: pandora.user.ui.showAnnotationsCalendar,
        showAnnotationsMap: pandora.user.ui.showAnnotationsMap,
        showLayers: Ox.clone(pandora.user.ui.showLayers),
        showUsers: pandora.site.annotations.showUsers,
        showTimeline: pandora.user.ui.showTimeline,
        subtitles: data.subtitles,
        tooltips: true,
        timeline: '/' + pandora.user.ui.item + '/timeline16p.png',
        video: data.video,
        volume: pandora.user.ui.videoVolume,
        width: pandora.$ui.document.width() - pandora.$ui.mainPanel.size(0) - 1
    }).bindEvent({
        annotationsfont: function(data) {
            pandora.UI.set({annotationsFont: data.font});
        },
        annotationsrange: function(data) {
            pandora.UI.set({annotationsRange: data.range});
        },
        annotationssize: function(data) {
            pandora.UI.set({annotationsSize: data.size});
        },
        annotationssort: function(data) {
            pandora.UI.set({annotationsSort: data.sort});
        },
        downloadvideo: function(data) {
            document.location.href = '/' + pandora.user.ui.item + '/torrent/';
        },
        find: function(data) {
            pandora.UI.set('itemFind', data.find);
        },
        muted: function(data) {
            pandora.UI.set('videoMuted', data.muted);
        },
        position: function(data) {
            pandora.UI.set(
                'videoPoints.' + pandora.user.ui.item + '.position',
                data.position
            );
        },
        resizeannotations: function(data) {
            pandora.UI.set('annotationsSize', data.annotationsSize);
        },
        resizecalendar: function(data) {
            pandora.UI.set('annotationsCalendarSize', data.size);
        },
        resizemap: function(data) {
            pandora.UI.set('annotationsMapSize', data.size);
        },
        resolution: function(data) {
            pandora.UI.set('videoResolution', data.resolution);
        },
        scale: function(data) {
            pandora.UI.set('videoScale', data.scale);
        },
        select: function(data) {
            pandora.UI.set('videoPoints.' + pandora.user.ui.item + '.annotation', data.id.split('/')[1]);
        },
        subtitles: function(data) {
            pandora.UI.set('videoSubtitles', data.subtitles);
        },
        toggleannotations: function(data) {
            pandora.UI.set('showAnnotations', data.showAnnotations);
        },
        togglelayer: function(data) {
            pandora.UI.set('showLayers.' + data.layer, !data.collapsed);
        },
        togglemap: function(data) {
            pandora.UI.set('showAnnotationsMap', !data.collapsed);
        },
        togglesize: function(data) {
            pandora.UI.set({videoSize: data.size});
        },
        toggletimeline: function(data) {
            pandora.UI.set('showTimeline', data.showTimeline);
        },
        volume: function(data) {
            pandora.UI.set('videoVolume', data.volume);
        },
        pandora_showannotations: function(data) {
            pandora.$ui.player.options({showAnnotations: data.value});
        },
        pandora_showtimeline: function(data) {
            pandora.$ui.player.options({showTimeline: data.value});
        }
    });
  
};