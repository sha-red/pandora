'use strict';

pandora.ui.editor = function(data) {

    var ui = pandora.user.ui,
        rightsLevel = data.rightslevel,
        canEdit = pandora.hasCapability('canEditMetadata') || data.editable,

        that = Ox.VideoAnnotationPanel({
            annotationsCalendarSize: ui.annotationsCalendarSize,
            annotationsHighlight: ui.annotationsHighlight,
            annotationsMapSize: ui.annotationsMapSize,
            annotationsRange: ui.annotationsRange,
            annotationsSeparator: pandora.site.annotations.separator,
            annotationsSize: ui.annotationsSize,
            annotationsSort: ui.annotationsSort,
            annotationsTooltip: Ox._('annotations')
                + ' <span class="OxBright">' + Ox.SYMBOLS.shift + 'A</span>',
            audioTrack: data.audioTrack,
            censored: data.censored,
            censoredIcon: pandora.site.cantPlay.icon,
            censoredTooltip: Ox._(pandora.site.cantPlay.text),
            clickLink: pandora.clickLink,
            cuts: data.cuts || [],
            duration: data.duration,
            enableDownload: pandora.hasCapability('canDownloadVideo') >= data.rightslevel || data.editable,
            enableExport: pandora.hasCapability('canExportAnnotations') || data.editable,
            enableImport: pandora.hasCapability('canImportAnnotations') || data.editable,
            enableSetPosterFrame: !pandora.site.media.importFrames && data.editable,
            enableSubtitles: ui.videoSubtitles,
            find: ui.itemFind,
            findLayer: pandora.getFindLayer(),
            getFrameURL: function(position) {
                return pandora.getMediaURL('/' + ui.item + '/' + ui.videoResolution + 'p' + position + '.jpg?' + data.modified);
            },
            getLargeTimelineURL: function(type, i) {
                return pandora.getMediaURL('/' + ui.item + '/timeline' + type + '64p' + i + '.jpg?' + data.modified);
            },
            getSmallTimelineURL: function(type, i) {
                return pandora.getMediaURL('/' + ui.item + '/timeline' + type + '16p' + i + '.jpg?' + data.modified);
            },
            height: pandora.$ui.contentPanel.size(1),
            id: 'editor',
            'in': ui.videoPoints[ui.item]['in'],
            itemName: pandora.site.itemName,
            layers: data.annotations.map(function(layer) {
                return Ox.extend({
                    editable: layer.canAddAnnotations[pandora.user.level] || canEdit
                }, layer, {
                    autocomplete: layer.type == 'entity'
                        ? function(key, value, callback) {
                            pandora.api.autocompleteEntities({
                                key: layer.entity,
                                operator: '=',
                                range: [0, 100],
                                value: value
                            }, function(result) {
                                callback(result.data.items);
                            })
                        } : layer.autocomplete
                        ? function(key, value, callback) {
                            var keys = layer.autocompleteKeys && layer.autocompleteKeys.length
                                ? layer.autocompleteKeys
                                : [key];
                            var n = keys.length;
                            var itemss = [];

                            keys.forEach(function(key) {
                                pandora.api.autocomplete({
                                    key: key,
                                    operator: '=',
                                    range: [0, 100],
                                    value: value
                                }, function(result) {
                                    n--;
                                    itemss.push(result.data.items);
                                    if (n == 0) {
                                        callback(Ox.unique(Ox.flatten(itemss)));
                                    }
                                });
                            });
                        } : null
                });
            }),
            loop: ui.videoLoop,
            muted: ui.videoMuted,
            out: ui.videoPoints[ui.item].out,
            position: ui.videoPoints[ui.item].position,
            posterFrame: data.posterFrame,
            resolution: ui.videoResolution,
            selected: ui.videoPoints[ui.item].annotation
                ? ui.item + '/' + ui.videoPoints[ui.item].annotation
                : '',
            selectResult: !pandora._dontSelectResult,
            showAnnotations: ui.showAnnotations,
            showAnnotationsCalendar: ui.showAnnotationsCalendar,
            showAnnotationsMap: ui.showAnnotationsMap,
            showLargeTimeline: true,
            showLayers: Ox.clone(ui.showLayers),
            showUsers: pandora.site.annotations.showUsers,
            subtitles: data.subtitles,
            subtitlesDefaultTrack: data.subtitlesDefaultTrack || Ox.getLanguageNameByCode(pandora.site.language),
            subtitlesLayer: data.subtitlesLayer,
            subtitlesOffset: ui.videoSubtitlesOffset,
            subtitlesTrack: data.subtitlesTrack || Ox.getLanguageNameByCode(pandora.site.language),
            timeline: ui.videoTimeline,
            timelines: pandora.site.timelines,
            video: data.video,
            videoRatio: data.videoRatio,
            videoSize: ui.videoSize,
            volume: ui.videoVolume,
            width: Ox.$document.width() - pandora.$ui.mainPanel.size(0) - 1
        }).bindEvent({
            addannotation: function(data) {
                Ox.Log('', 'addAnnotation', data);
                // async to not capture keyboard input
                setTimeout(function() {
                    var created = Ox.formatDate(new Date(), '%Y-%m-%dT%H:%M:%SZ'),
                        layer = Ox.getObjectById(pandora.site.layers, data.layer),
                        type = layer.type;
                    if (layer.getDefaults) {
                        pandora.api.addAnnotation(Ox.extend({
                                'in': data['in'],
                                item: ui.item,
                                layer: data.layer,
                                out: data.out
                            },
                            pandora[layer.getDefaults](data)
                        ), function(result) {
                            that.addAnnotation(data.layer, result.data)
                        })
                    } else {
                        that.addAnnotation(data.layer, Ox.extend({
                                created: created,
                                duration: data.out - data['in'],
                                editable: true,
                                id: '_' + Ox.uid(),
                                'in': data['in'],
                                modified: created,
                                out: data.out,
                                user: pandora.user.username,
                                value: ''
                            },
                            type == 'place' ? {
                                place: {lat: null, lng: null}
                            } : type == 'event' ? {
                                event: {start: '', end: ''}
                            } : {},
                        ));
                    }
                    Ox.Request.clearCache();
                });
            },
            annotationshighlight: function(data) {
                pandora.UI.set({annotationsHighlight: data});
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
            censored: function() {
                pandora.URL.push(pandora.site.cantPlay.link);
            },
            copy: function(data) {
                pandora.clipboard.copy(data.map(function(clip) {
                    return clip.annotation || ui.item + '/' + clip['in'] + '-' + clip.out
                }), 'clip');
            },
            copyadd: function(data) {
                pandora.clipboard.add(data.map(function(clip) {
                    return clip.annotation || ui.item + '/' + clip['in'] + '-' + clip.out
                }), 'clip');
            },
            define: function(data) {
                var dialog = data.type + 'sDialog';
                pandora.$ui[dialog] && pandora.$ui[dialog].remove();
                pandora.$ui[dialog] = pandora.ui[dialog](data).open();
            },
            downloadframe: function(data_) {
                var url = '/' + ui.item + '/' + Ox.max(pandora.site.video.resolutions) + 'p' + data_.position + '.jpg',
                    name = data.title + ' - ' + Ox.formatDuration(data_.position) + '.jpg';
                pandora.saveURL(url, name)
            },
            downloadvideo: function() {
                pandora.ui.downloadVideoDialog({
                    item: ui.item,
                    rightsLevel: rightsLevel,
                    source: data.source && pandora.hasCapability('canDownloadSource'),
                    title: data.title,
                    video: data.video
                }).open();
            },
            downloadselection: function(selection) {
                pandora.ui.downloadVideoDialog({
                    item: ui.item,
                    'in': selection['in'],
                    out: selection.out,
                    rightsLevel: rightsLevel,
                    title: data.title,
                    video: data.video
                }).open();
            },
            editannotation: function(data) {
                Ox.Log('', 'editAnnotation', data.id, data);
                function callback(result) {
                    Ox.Log('', 'editAnnotation result', result.data.id, result);
                    if (!Ox.isEmpty(result.data)) {
                        result.data.date = Ox.formatDate(
                            result.data.modified.slice(0, 10), '%B %e, %Y'
                        );
                        result.data.languages = (
                            result.data.languages || [pandora.site.language]
                        ).map(function(language) {
                            return Ox.getLanguageNameByCode(language);
                        });
                    }
                    that.updateAnnotation(data.id, result.data);
                    pandora.UI.set('videoPoints.' + ui.item + '.annotation', result.data.id.split('/')[1] || '');
                    Ox.Request.clearCache();
                };
                var edit = {
                    'in': data['in'],
                    out: data.out,
                    value: data.value
                }
                if (data.id[0] == '_') {
                    edit.item = ui.item;
                    edit.layer = data.layer;

                    if (queue[data.id]) {
                        queue[data.id].push(edit);
                    } else {
                        queue[data.id] = [];
                        pandora.api.addAnnotation(edit, function(result) {
                            callback(result);
                            var id = result.data.id,
                                pending = queue[id];
                            delete queue[id];
                            pending && pending.length && Ox.serialForEach(pending, function(edit, index, array, callback) {
                                edit.id = id
                                Ox.Log('', 'process pending editAnnotation request', id, edit);
                                pandora.api.editAnnotation(edit, function(result) {
                                    callback();
                                })
                            }, function() {
                                Ox.Request.clearCache();
                            });
                        });
                    }
                } else {
                    edit.id = data.id;
                    if (queue[data.id]) {
                        queue[data.id].push(edit);
                    } else {
                        queue[data.id] = [];
                        pandora.api.editAnnotation(edit, function(result) {
                            callback(result);
                            var pending = queue[edit.id];
                            delete queue[edit.id];
                            pending && pending.length && Ox.serialForEach(pending, function(edit, index, array, cb) {
                                Ox.Log('', 'process pending editAnnotation request', edit.id, edit);
                                pandora.api.editAnnotation(edit, function(result) {
                                    callback(result);
                                    cb();
                                })
                            }, function() {
                                Ox.Request.clearCache();
                            });
                        });
                    }
                }
            },
            embedselection: function() {
                pandora.$ui.embedVideoDialog && pandora.$ui.embedVideoDialog.remove();
                pandora.$ui.embedVideoDialog = pandora.ui.embedVideoDialog().open();
            },
            exportannotations: function() {
                pandora.api.get({
                    id: ui.item,
                    keys: ['title']
                }, function(result) {
                    pandora.$ui.exportAnnotationsDialog = pandora.ui.exportAnnotationsDialog({title: result.data.title}).open();
                })
            },
            find: function(data) {
                pandora.UI.set({itemFind: data.find});
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
            findlayer: function(data) {
                ui._findState.key = data;
            },
            gainfocus: function() {
                pandora.$ui.mainMenu.replaceItemMenu();
            },
            importannotations: function() {
                pandora.$ui.importAnnotationsDialog = pandora.ui.importAnnotationsDialog({duration: data.duration}).open();
            },
            info: function(data) {
                pandora.ui.annotationDialog(
                    Ox.getObjectById(pandora.site.layers, data.layer).title
                ).open();
            },
            linktoselection: function(data) {
                pandora.$ui.linkVideoDialog && pandora.$ui.linkVideoDialog.remove();
                pandora.$ui.linkVideoDialog = pandora.ui.linkVideoDialog().open();
            },
            loop: function(data) {
                pandora.UI.set({videoLoop: data.loop});
            },
            muted: function(data) {
                pandora.UI.set({videoMuted: data.muted});
            },
            playing: function(data) {
                pandora.UI.set(
                    'videoPoints.' + ui.item + '.position',
                    data.position
                );
            },
            points: function(data) {
                pandora.UI.set('videoPoints.' + ui.item, {
                    annotation: ui.videoPoints[ui.item].annotation,
                    'in': data['in'],
                    out: data.out,
                    position: data.position
                });
            },
            position: function(data) {
                pandora.UI.set(
                    'videoPoints.' + ui.item + '.position',
                    data.position
                );
            },
            posterframe: function(data) {
                pandora.api.setPosterFrame({
                    id: ui.item,
                    position: data.position
                }, function() {
                    if (pandora.$ui.videoPreview) {
                        pandora.$ui.videoPreview.options({
                            position: data.position
                        });
                    }
                    if (ui.listSort[0].key == 'modified') {
                        Ox.Request.clearCache('find');
                        pandora.$ui.browser
                            .reloadList()
                            .bindEventOnce({
                                load: function() {
                                    updateBrowser();
                                }
                            });
                    } else {
                        updateBrowser();
                    }
                });
            },
            removeannotation: function(data) {
                pandora.UI.set('videoPoints.' + ui.item + '.annotation', null);
                pandora.api.removeAnnotation({
                    id: data.id
                }, function(result) {
                    //fixme: check for errors
                    //that.removeAnnotation(data.layer, data.id);
                    Ox.Request.clearCache();
                });
            },
            resize: function(data) {
                that.options({height: data.size});
            },
            resizecalendar: function(data) {
                pandora.UI.set({annotationsCalendarSize: data.size});
            },
            resizemap: function(data) {
                pandora.UI.set({annotationsMapSize: data.size});
            },
            resolution: function(data) {
                pandora.UI.set({videoResolution: data.resolution});
            },
            select: function(data) {
                pandora.UI.set('videoPoints.' + ui.item + '.annotation', data.id.split('/')[1] || '');
            },
            showentityinfo: function(data) {
                pandora.URL.push('/entities/' + data.id)
            },
            subtitles: function(data) {
                pandora.UI.set({videoSubtitles: data.subtitles});
            },
            timeline: function(data) {
                pandora.UI.set({videoTimeline: data.timeline});
            },
            toggleannotations: function(data) {
                pandora.UI.set({showAnnotations: data.showAnnotations});
            },
            togglecalendar: function(data) {
                pandora.UI.set({showAnnotationsCalendar: !data.collapsed});
            },
            togglelayer: function(data) {
                pandora.UI.set('showLayers.' + data.layer, !data.collapsed);
            },
            togglemap: function(data) {
                pandora.UI.set({showAnnotationsMap: !data.collapsed});
            },
            togglesize: function(data) {
                pandora.UI.set({videoSize: data.size});
            },
            pandora_showannotations: function(data) {
                that.options({showAnnotations: data.value});
            },
            pandora_videotimeline: function(data) {
                that.options({timeline: data.value});
            }
        }),
        queue = [];

    pandora._dontSelectResult = false;

    function updateBrowser() {
        pandora.$ui.browser.find('img[src*="/' + ui.item + '/"]').each(function() {
            $(this).attr({
                src: pandora.getMediaURL('/' + ui.item + '/' + (
                    ui.icons == 'posters' ? 'poster' : 'icon'
                ) + '128.jpg?' + Ox.uid())
            });
        });
    }

    return that;

};
