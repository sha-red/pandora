// vim: et:ts=4:sw=4:sts=4:ft=javascript

pandora.ui.item = function() {

    var that = Ox.Element();

    pandora.api.get({
        id: pandora.user.ui.item,
        keys: []
    }, pandora.user.level == 'admin' && pandora.user.ui.itemView == 'info' ? 0 : -1, function(result) {

        if (result.status.code == 200) {
            // fixme: can the history state title get updated too?
            document.title = pandora.getPageTitle(result.data.title);
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

        if (!result.data.rendered && [
            'clips', 'map', 'video', 'timeline'
        ].indexOf(pandora.user.ui.itemView)>-1) {
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
            //Ox.print('result.data', result.data)
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
                                pandora.api.editItem(Ox.extend(changed, {id: pandora.user.ui.item}), function(result) {
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
                pandora.$ui.clips = pandora.ui.clipList(result.data.videoRatio)
            );

        } else if (pandora.user.ui.itemView == 'video') {
            pandora.api.get({id: pandora.user.ui.item, keys: ['layers']}, function(r) {
                // fixme: duplicated
                var layers = [],
                    video = {};
                pandora.site.layers.forEach(function(layer, i) {
                    layers[i] = Ox.extend({}, layer, {items: r.data.layers[layer.id]});
                });
                pandora.site.video.resolutions.forEach(function(resolution) {
                    video[resolution] = Ox.range(result.data.parts).map(function(i) {
                        return '/' + pandora.user.ui.item + '/'
                            + resolution + 'p' + (i + 1) + '.' + pandora.user.videoFormat;
                    });
                });
                //
                pandora.$ui.contentPanel.replaceElement(1, pandora.$ui.player = Ox.VideoPanelPlayer({
                    annotationsSize: pandora.user.ui.annotationsSize,
                    cuts: result.data.cuts || [],
                    duration: result.data.duration,
                    getTimelineImageURL: function(i) {
                        return '/' + pandora.user.ui.item + '/timeline64p' + i + '.png';
                    },
                    height: pandora.$ui.contentPanel.size(1),
                    'in': pandora.user.ui.videoPoints[pandora.user.ui.item]
                        ? pandora.user.ui.videoPoints[pandora.user.ui.item]['in'] : 0,
                    muted: pandora.user.ui.videoMuted,
                    out: pandora.user.ui.videoPoints[pandora.user.ui.item]
                        ? pandora.user.ui.videoPoints[pandora.user.ui.item].out : 0,
                    position: pandora.user.ui.videoPoints[pandora.user.ui.item]
                        ? pandora.user.ui.videoPoints[pandora.user.ui.item].position : 0,
                    scaleToFill: pandora.user.ui.videoScale == 'fill',
                    showAnnotations: pandora.user.ui.showAnnotations,
                    showControls: pandora.user.ui.showControls,
                    subtitles: r.data.layers.subtitles ?
                        r.data.layers.subtitles.map(function(subtitle) {
                            return {'in': subtitle['in'], out: subtitle.out, text: subtitle.value};
                        }) : [],
                    tooltips: true,
                    timeline: '/' + pandora.user.ui.item + '/timeline16p.png',
                    video: video,
                    volume: pandora.user.ui.videoVolume,
                    width: pandora.$ui.document.width() - pandora.$ui.mainPanel.size(0) - 1
                }).bindEvent({
                    muted: function(data) {
                        pandora.UI.set('muted', data.muted);
                    },
                    position: function(data) {
                        pandora.UI.set('videoPoints.' + pandora.user.ui.item + '.position', data.position);
                    },
                    resizeannotations: function(data) {
                        pandora.UI.set('annotationsSize', data.annotationsSize);
                    },
                    scale: function(data) {
                        pandora.UI.set('videoScale', data.scale);
                    },
                    toggleannotations: function(data) {
                        pandora.UI.set('showAnnotations', data.showAnnotations);
                    },
                    togglecontrols: function(data) {
                        pandora.UI.set('showControls', data.showControls);
                    },
                    volume: function(data) {
                        pandora.UI.set('volume', data.volume);
                    },
                    pandora_showannotations: function(data) {
                        pandora.$ui.player.options({showAnnotations: data.value});
                    }
                }));
            });

        } else if (pandora.user.ui.itemView == 'timeline') {
            pandora.api.get({id: pandora.user.ui.item, keys: ['layers']}, function(r) {
                var layers = [],
                    video = {};
                pandora.site.layers.forEach(function(layer) {
                    layers.push(Ox.extend({items: r.data.layers[layer.id]}, layer));
                });
                pandora.site.video.resolutions.forEach(function(resolution) {
                    video[resolution] = Ox.range(result.data.parts).map(function(i) {
                        return '/' + pandora.user.ui.item + '/'
                            + resolution + 'p' + (i + 1) + '.' + pandora.user.videoFormat;
                    });
                });
                pandora.$ui.contentPanel.replaceElement(1, pandora.$ui.editor = Ox.VideoEditor({
                    annotationsSize: pandora.user.ui.annotationsSize,
                    cuts: result.data.cuts || [],
                    duration: result.data.duration,
                    find: '',
                    getFrameURL: function(position) {
                        return '/' + pandora.user.ui.item + '/' + Ox.last(pandora.site.video.resolutions) + 'p' + position + '.jpg';
                    },
                    getLargeTimelineImageURL: function(i) {
                        return '/' + pandora.user.ui.item + '/timeline64p' + i + '.png';
                    },
                    getSmallTimelineImageURL: function(i) {
                        return '/' + pandora.user.ui.item + '/timeline16p' + i + '.png';
                    },
                    height: pandora.$ui.contentPanel.size(1),
                    id: 'editor',
                    'in': pandora.user.ui.videoPoints[pandora.user.ui.item]
                        ? pandora.user.ui.videoPoints[pandora.user.ui.item]['in'] : 0,
                    layers: layers,
                    muted: pandora.user.ui.videoMuted,
                    out: pandora.user.ui.videoPoints[pandora.user.ui.item]
                        ? pandora.user.ui.videoPoints[pandora.user.ui.item].out : 0,
                    position: pandora.user.ui.videoPoints[pandora.user.ui.item]
                        ? pandora.user.ui.videoPoints[pandora.user.ui.item].position : 0,
                    posterFrame: parseInt(video.duration / 2),
                    showAnnotations: pandora.user.ui.showAnnotations,
                    showLargeTimeline: true,
                    // fixme: layers have value, subtitles has text?
                    subtitles: r.data.layers.subtitles ?
                        r.data.layers.subtitles.map(function(subtitle) {
                            return {'in': subtitle['in'], out: subtitle.out, text: subtitle.value};
                        }) : [],
                    tooltips: true,
                    video: video,
                    videoRatio: result.data.videoRatio,
                    videoSize: pandora.user.ui.videoSize,
                    width: pandora.$ui.document.width() - pandora.$ui.mainPanel.size(0) - 1
                }).bindEvent({
                    points: function(data) {
                        pandora.UI.set('videoPoints.' + pandora.user.ui.item, {
                            'in': data['in'],
                            out: data.out,
                            position: pandora.user.ui.videoPoints[pandora.user.ui.item].position
                        });
                    },
                    position: function(data) {
                        pandora.UI.set('videoPoints.' + pandora.user.ui.item + '.position', data.position);
                    },
                    resize: function(data) {
                        Ox.print('RESIZE!!', data.size)
                        pandora.$ui.editor.options({
                            height: data.size
                        });
                    },
                    resizeend: function(data) {
                        pandora.UI.set({annotationsSize: data.size});
                    },
                    togglesize: function(data) {
                        pandora.UI.set({videoSize: data.size});
                    },
                    addannotation: function(data) {
                        Ox.print('addAnnotation', data);
                        data.item = pandora.user.ui.item;
                        data.value = 'Click to edit';
                        pandora.api.addAnnotation(data, function(result) {
                            pandora.$ui.editor.addAnnotation(data.layer, result.data);
                        });
                    },
                    removeannotations: function(data) {
                        pandora.api.removeAnnotations(data, function(result) {
                            //fixme: check for errors
                            pandora.$ui.editor.removeAnnotations(data.layer, data.ids);
                        });
                    },
                    toggleannotations: function(data) {
                        pandora.UI.set('showAnnotations', data.showAnnotations);
                    },
                    updateannotation: function(data) {
                        //fixme: check that edit was successfull
                        pandora.api.editAnnotation(data, function(result) {
                            Ox.print('done updateAnnotation', result);
                            
                        });
                    },
                    pandora_showannotations: function(data) {
                        pandora.$ui.editor.options({showAnnotations: data.value});
                    }
                }));
                that.bindEvent('resize', function(data) {
                    //Ox.print('resize item', data)
                    pandora.$ui.editor.options({
                        height: data.size
                    });
                });
                /*
                pandora.$ui.rightPanel.bindEvent('resize', function(data) {
                    Ox.print('... rightPanel resize', data, pandora.$ui.timelinePanel.size(1))
                    pandora.$ui.editor.options({
                        width: data - pandora.$ui.timelinePanel.size(1) - 1
                    });
                });
                */
            });
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

        if (result.data) {
            var director = result.data.director ? ' ('+result.data.director.join(', ') + ')' : '';
            pandora.$ui.total.html(result.data.title + director);
        }

    });

    return that;

};

