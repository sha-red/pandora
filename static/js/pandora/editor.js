// vim: et:ts=4:sw=4:sts=4:ft=javascript

'use strict';

pandora.ui.editor = function(data) {

    // fixme: var ui = pandora.user.ui;

    return Ox.VideoEditor({
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
        enableImport: pandora.site.capabilities.canImportAnnotations[pandora.user.level],
        enableSubtitles: pandora.user.ui.videoSubtitles,
        find: pandora.user.ui.itemFind,
        getFrameURL: function(position) {
            return '/' + pandora.user.ui.item + '/' + pandora.user.ui.videoResolution + 'p' + position + '.jpg';
        },
        getLargeTimelineImageURL: function(i) {
            return '/' + pandora.user.ui.item + '/timeline64p' + i + '.png';
        },
        getSmallTimelineImageURL: function(i) {
            return '/' + pandora.user.ui.item + '/timeline16p' + i + '.png';
        },
        height: pandora.$ui.contentPanel.size(1),
        id: 'editor',
        'in': pandora.user.ui.videoPoints[pandora.user.ui.item]['in'],
        layers: data.annotations.map(function(layer) {
            return Ox.extend({
                editable: layer.canAddAnnotations[pandora.user.level]
            }, layer);
        }),
        muted: pandora.user.ui.videoMuted,
        out: pandora.user.ui.videoPoints[pandora.user.ui.item].out,
        position: pandora.user.ui.videoPoints[pandora.user.ui.item].position,
        posterFrame: data.posterFrame,
        posterFrameControls: !pandora.site.media.importFrames,
        resolution: pandora.user.ui.videoResolution,
        selected: pandora.user.ui.videoPoints[pandora.user.ui.item].annotation
            ? pandora.user.ui.item + '/' + pandora.user.ui.videoPoints[pandora.user.ui.item].annotation
            : '',
        showAnnotations: pandora.user.ui.showAnnotations,
        showAnnotationsCalendar: pandora.user.ui.showAnnotationsCalendar,
        showAnnotationsMap: pandora.user.ui.showAnnotationsMap,
        showLargeTimeline: true,
        showLayers: Ox.clone(pandora.user.ui.showLayers),
        showUsers: pandora.site.annotations.showUsers,
        subtitles: data.subtitles,
        tooltips: true,
        video: data.video,
        videoRatio: data.videoRatio,
        videoSize: pandora.user.ui.videoSize,
        volume: pandora.user.ui.videoVolume,
        width: pandora.$ui.document.width() - pandora.$ui.mainPanel.size(0) - 1
    }).bindEvent({
        addannotation: function(data) {
            Ox.Log('', 'addAnnotation', data);
            // async to not capture keyboard input
            setTimeout(function() {
                var d = new Date(),
                    created = Ox.formatDate(d, '%Y-%m-%dT%H:%M:%SZ'),
                    date = Ox.formatDate(d, '%B %e, %Y'),
                    type = Ox.getObjectById(pandora.site.layers, data.layer).type;
                pandora.$ui.editor.addAnnotation(data.layer, Ox.extend(
                    {
                        created: created,
                        date: date,
                        duration: data.out - data['in'],
                        editable: true,
                        id: '_' + Ox.uid(),
                        'in': data['in'],
                        modified: created,
                        out: data.out,
                        user: pandora.user.username,
                        value: '',
                    },
                    type == 'place' ? {
                        place: {lat: null, lng: null}
                    } : type == 'event' ? {
                        event: {start: '', end: ''}
                    } : {}
                ));
            });
        },
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
        define: function(data) {
            var dialog = data.type + 'sDialog';
            pandora.$ui[dialog] && pandora.$ui[dialog].remove();
            pandora.$ui[dialog] = pandora.ui[dialog](data).open();
        },
        downloadvideo: function(data) {
            document.location.href = '/' + pandora.user.ui.item + '/torrent/';
        },
        downloadselection: function(data) {
            document.location.href = '/' + pandora.user.ui.item
                + '/' + Ox.max(pandora.site.video.resolutions)
                + 'p.webm?t=' + data['in'] + ',' + data.out;
        },
        editannotation: function(data) {
            Ox.Log('', 'editAnnotation', data);
            function callback(result) {
                Ox.Log('', 'editAnnotation result', result);
                result.data.date = Ox.formatDate(
                    result.data.modified.substr(0, 10), '%B %e, %Y'
                );
                pandora.$ui.editor.updateAnnotation(data.id, result.data);
            };
            if (data.id[0] == '_') {
                pandora.api.addAnnotation({
                    'in': data['in'],
                    item: pandora.user.ui.item,
                    layer: data.layer,
                    out: data.out,
                    value: data.value
                }, callback);
            } else {
                pandora.api.editAnnotation({
                    id: data.id,
                    'in': data['in'],
                    out: data.out,
                    value: data.value
                }, callback);
            }
        },
        embedselection: function(data) {
            pandora.$ui.embedDialog && pandora.$ui.embedDialog.remove();
            pandora.$ui.embedDialog = pandora.ui.embedDialog(data).open();
        },
        find: function(data) {
            pandora.UI.set('itemFind', data.find);
        },
        findannotations: function(data) {
            pandora.UI.set({
                item: '',
                find: {
                    conditions: [{key: data.key, value: data.value, operator: '='}],
                    operator: '&'
                },
                listView: 'clip'
            });
        },
        importannotations: function(data) {
            pandora.ui.importAnnotations().open();
        },
        info: function(data) {
            pandora.ui.annotationDialog(Ox.getObjectById(pandora.site.layers, data.layer).title).open();
        },
        muted: function(data) {
            pandora.UI.set('videoMuted', data.muted);
        },
        points: function(data) {
            pandora.UI.set('videoPoints.' + pandora.user.ui.item, {
                annotation: pandora.user.ui.videoPoints[pandora.user.ui.item].annotation,
                'in': data['in'],
                out: data.out,
                position: pandora.user.ui.videoPoints[pandora.user.ui.item].position
            });
        },
        position: function(data) {
            pandora.UI.set(
                'videoPoints.' + pandora.user.ui.item + '.position',
                data.position
            );
        },
        posterframe: function(data) {
            pandora.api.setPosterFrame({
                id: pandora.user.ui.item,
                position: data.position
            });
        },
        removeannotation: function(data) {
            pandora.UI.set('videoPoints.' + pandora.user.ui.item + '.annotation', null);
            pandora.api.removeAnnotation({
                id: data.id
            }, function(result) {
                //fixme: check for errors
                //pandora.$ui.editor.removeAnnotation(data.layer, data.id);
            });
        },
        resize: function(data) {
            pandora.$ui.editor.options({
                height: data.size
            });
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
        select: function(data) {
            pandora.UI.set('videoPoints.' + pandora.user.ui.item + '.annotation', data.id.split('/')[1]);
        },
        subtitles: function(data) {
            pandora.UI.set('videoSubtitles', data.subtitles);
        },
        togglecalendar: function(data) {
            pandora.UI.set('showAnnotationsCalendar', !data.collapsed);
        },
        togglemap: function(data) {
            pandora.UI.set('showAnnotationsMap', !data.collapsed);
        },
        togglesize: function(data) {
            pandora.UI.set({videoSize: data.size});
        },
        toggleannotations: function(data) {
            pandora.UI.set('showAnnotations', data.showAnnotations);
        },
        togglelayer: function(data) {
            pandora.UI.set('showLayers.' + data.layer, !data.collapsed);
        },
        pandora_showannotations: function(data) {
            pandora.$ui.editor.options({showAnnotations: data.value});
        }
    });

};



