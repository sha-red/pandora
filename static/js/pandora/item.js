// vim: et:ts=4:sw=4:sts=4:ft=javascript
'use strict';

pandora.ui.item = function() {

    var that = Ox.Element();

    pandora.api.get({
        id: pandora.user.ui.item,
        keys: ['video', 'timeline'].indexOf(pandora.user.ui.itemView) > -1
            ? [ 'cuts', 'director', 'duration', 'layers', 'parts', 'posterFrame', 'rendered', 'rightslevel', 'size', 'title', 'videoRatio', 'year'] : []
    }, pandora.user.ui.itemView == 'info' && pandora.site.capabilities.canEditMetadata[pandora.user.level] ? 0 : -1, function(result) {

        if (result.status.code == 200) {
            // we want to cache the title in any way, so that after closing
            // a dialog and getting to this item, the title is correct
            var documentTitle = pandora.getDocumentTitle(result.data.title);
            document.title = pandora.getPageTitle(document.location.pathname) || documentTitle;
        }

        /*if (result.status.code != 200) {
            pandora.$ui.contentPanel.replaceElement(1,
                Ox.Element()
                    .css({marginTop: '32px', fontSize: '12px', textAlign: 'center'})
                    .html(
                        'Sorry, we can\'t find the '
                        + pandora.site.itemName.singular.toLowerCase()
                        + ' you\'re looking for.'
                    )
            );
        }*/

        pandora.$ui.itemTitle
            .options({
                title: '<b>' + result.data.title
                    + (Ox.len(result.data.director)
                        ? ' (' + result.data.director.join(', ') + ')'
                        : '')
                    + (result.data.year ? ' ' + result.data.year : '') + '</b>'
            })
            .show();

        if (['video', 'timeline'].indexOf(pandora.user.ui.itemView) > -1) {
            // fixme: layers have value, subtitles has text?
            var videoOptions = pandora.getVideoOptions(result.data);
        }

        if (!result.data.rendered && [
            'clips', 'map', 'video', 'timeline'
        ].indexOf(pandora.user.ui.itemView) > -1) {
            pandora.$ui.contentPanel.replaceElement(1,
                Ox.Element()
                    .css({marginTop: '32px', fontSize: '12px', textAlign: 'center'})
                    .html(
                        'Sorry, <i>' + result.data.title
                        + '</i> currently doesn\'t have a '
                        + pandora.user.ui.itemView + ' view.'
                    )
            );

        } else if (pandora.user.ui.itemView == 'info') {
            //Ox.Log('', 'result.data', result.data)
            if (pandora.user.level == 'admin' && false) {
                var $form,
                    $edit = Ox.Element()
                    .append($form = Ox.FormElementGroup({
                        elements: Ox.map(pandora.site.sortKeys, function(key) {
                            return Ox.Input({
                                id: key.id,
                                label: key.title,
                                labelWidth: 100,
                                value: result.data[key.id],
                                type: 'text',
                                width: 500
                            });
                        }),
                        separators: [
                            {title: '', width: 0}
                        ]
                    }))
                    .append(Ox.Button({
                        title: 'Save',
                        type: 'text'
                    }).bindEvent({
                        click: function(data) {
                            // fixme: cleanup
                            var values = $form.value();
                            var changed = {};
                            Ox.map(pandora.site.itemKeys, function(key, i) {
                                if(values[i] && values[i] != ''+result.data[key.id]) {
                                    if(Ox.isArray(key.type) && key.type[0] == 'string') {
                                        changed[key.id] = values[i].split(', ');
                                    } else {
                                        changed[key.id] = values[i];
                                    }
                                }
                            });
                            if(changed) {
                                pandora.api.edit(Ox.extend(changed, {id: pandora.user.ui.item}), function(result) {
                                    //fixme just reload parts that need reloading
                                    window.location.reload();
                                });
                            }
                        }
                    }));
                pandora.$ui.contentPanel.replaceElement(1, pandora.$ui.item = $edit);
            } else {
                pandora.$ui.contentPanel.replaceElement(1,
                    pandora.$ui.item = pandora.ui.infoView(result.data)
                        .bindEvent({
                            resize: function() {
                                pandora.$ui.item.resize();
                            }
                        })
                );
            }

        } else if (pandora.user.ui.itemView == 'clips') {
            pandora.$ui.contentPanel.replaceElement(1,
                pandora.ui.clipsView(result.data.videoRatio)
            );

        } else if (pandora.user.ui.itemView == 'video') {
            pandora.$ui.contentPanel.replaceElement(1, pandora.$ui.player = Ox.VideoPanel({
                annotationsCalendarSize: pandora.user.ui.annotationsCalendarSize,
                annotationsFont: pandora.user.ui.annotationsFont,
                annotationsMapSize: pandora.user.ui.annotationsMapSize,
                annotationsRange: pandora.user.ui.annotationsRange,
                annotationsSize: pandora.user.ui.annotationsSize,
                annotationsSort: pandora.user.ui.annotationsSort,
                censored: videoOptions.censored,
                clickLink: pandora.clickLink,
                cuts: result.data.cuts || [],
                duration: result.data.duration,
                enableSubtitles: pandora.user.ui.videoSubtitles,
                find: pandora.user.ui.itemFind,
                getTimelineImageURL: function(i) {
                    return '/' + pandora.user.ui.item + '/timeline64p' + i + '.png';
                },
                height: pandora.$ui.contentPanel.size(1),
                'in': pandora.user.ui.videoPoints[pandora.user.ui.item]['in'],
                layers: videoOptions.layers,
                muted: pandora.user.ui.videoMuted,
                out: pandora.user.ui.videoPoints[pandora.user.ui.item].out,
                position: pandora.user.ui.videoPoints[pandora.user.ui.item].position,
                resolution: pandora.user.ui.videoResolution,
                scaleToFill: pandora.user.ui.videoScale == 'fill',
                showAnnotations: pandora.user.ui.showAnnotations,
                showAnnotationsCalendar: pandora.user.ui.showAnnotationsCalendar,
                showAnnotationsMap: pandora.user.ui.showAnnotationsMap,
                showLayers: pandora.user.ui.showLayers,
                showUsers: pandora.site.annotations.showUsers,
                showTimeline: pandora.user.ui.showTimeline,
                subtitles: videoOptions.subtitles,
                tooltips: true,
                timeline: '/' + pandora.user.ui.item + '/timeline16p.png',
                video: videoOptions.video,
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
                subtitles: function(data) {
                    pandora.UI.set('videoSubtitles', data.subtitles);
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
            }));

        } else if (pandora.user.ui.itemView == 'timeline') {
            pandora.$ui.contentPanel.replaceElement(1,
                pandora.$ui.editor = Ox.VideoEditor({
                    annotationsCalendarSize: pandora.user.ui.annotationsCalendarSize,
                    annotationsFont: pandora.user.ui.annotationsFont,
                    annotationsMapSize: pandora.user.ui.annotationsMapSize,
                    annotationsRange: pandora.user.ui.annotationsRange,
                    annotationsSize: pandora.user.ui.annotationsSize,
                    annotationsSort: pandora.user.ui.annotationsSort,
                    censored: videoOptions.censored,
                    clickLink: pandora.clickLink,
                    cuts: result.data.cuts || [],
                    duration: result.data.duration,
                    enableDownload: pandora.site.capabilities.canDownloadVideo[pandora.user.level] >= result.data.rightslevel,
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
                    layers: videoOptions.layers.map(function(layer) {
                        return Ox.extend({
                            editable: layer.canAddAnnotations[pandora.user.level]
                        }, layer);
                    }),
                    muted: pandora.user.ui.videoMuted,
                    out: pandora.user.ui.videoPoints[pandora.user.ui.item].out,
                    position: pandora.user.ui.videoPoints[pandora.user.ui.item].position,
                    posterFrame: result.data.posterFrame,
                    posterFrameControls: !pandora.site.media.importPosterFrames,
                    resolution: pandora.user.ui.videoResolution,
                    selected: pandora.user.ui.videoPoints[pandora.user.ui.item].annotation
                        ? pandora.user.ui.item + '/' + pandora.user.ui.videoPoints[pandora.user.ui.item].annotation
                        : '',
                    showAnnotations: pandora.user.ui.showAnnotations,
                    showAnnotationsCalendar: pandora.user.ui.showAnnotationsCalendar,
                    showAnnotationsMap: pandora.user.ui.showAnnotationsMap,
                    showLargeTimeline: true,
                    showLayers: pandora.user.ui.showLayers,
                    showUsers: pandora.site.annotations.showUsers,
                    subtitles: videoOptions.subtitles,
                    tooltips: true,
                    video: videoOptions.video,
                    videoRatio: result.data.videoRatio,
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
                                date = Ox.formatDate(d, '%B %e, %Y');
                            pandora.$ui.editor.addAnnotation(data.layer, Ox.extend({
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
                            Ox.getObjectById(pandora.site.layers, data.layer).type == 'place' ? {
                                place: {lat: null, lng: null}
                            } : {},
                            Ox.getObjectById(pandora.site.layers, data.layer).type == 'event' ? {
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
                        pandora.$ui.placesDialog && pandora.$ui.placesDialog.remove();
                        pandora.$ui.placesDialog = pandora.ui.placesDialog(data).open();
                    },
                    downloadvideo: function(data) {
                        document.location.href = '/' + pandora.user.ui.item + '/torrent/';
                    },
                    downloadselection: function(data) {
                        document.location.href = [
                            '/',
                            pandora.user.ui.item,
                            '/',
                            Ox.max(pandora.site.video.resolutions),
                            'p.webm?t=',
                            data['in'],
                            ',',
                            data.out
                        ].join('');
                    },
                    editannotation: function(data) {
                        Ox.Log('', 'editAnnotation', data);
                        function callback(result) {
                            Ox.Log('', 'editAnnotation result', result);
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
                    findannotation: function(data) {
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
                        pandora.ui.annotationDialog(data.layer).open();
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
                })
            );
            pandora.$ui.editor.bindEvent('resize', function(data) {
                //Ox.Log('', 'resize item', data)
                pandora.$ui.editor.options({
                    height: data.size
                });
            });
            /*
            pandora.$ui.rightPanel.bindEvent('resize', function(data) {
                Ox.Log('', '... rightPanel resize', data, pandora.$ui.timelinePanel.size(1))
                pandora.$ui.editor.options({
                    width: data - pandora.$ui.timelinePanel.size(1) - 1
                });
            });
            */
        } else if (pandora.user.ui.itemView == 'map') {
            pandora.$ui.contentPanel.replaceElement(1, pandora.ui.navigationView('map', result.data.videoRatio));

        } else if (pandora.user.ui.itemView == 'calendar') {
            pandora.$ui.contentPanel.replaceElement(1, pandora.ui.navigationView('calendar', result.data.videoRatio));

        } else if (pandora.user.ui.itemView == 'data') {
            var stats = Ox.Container();
            Ox.TreeList({
                data: result.data,
                width: pandora.$ui.mainPanel.size(1) - Ox.UI.SCROLLBAR_SIZE
            }).appendTo(stats);
            pandora.$ui.contentPanel.replaceElement(1, stats);

        } else if (pandora.user.ui.itemView == 'files') {
            pandora.$ui.contentPanel.replaceElement(1,
                pandora.$ui.item = pandora.ui.filesView({
                    id: result.data.id
                })
            );

        } else if (pandora.user.ui.itemView == 'frames' || pandora.user.ui.itemView == 'posters') {
            pandora.$ui.contentPanel.replaceElement(1,
                pandora.$ui.item = pandora.ui.mediaView().bindEvent({
                    resize: function() {
                        pandora.$ui.item.resize();
                    }
                })
            );
        }
    });

    return that;

};

