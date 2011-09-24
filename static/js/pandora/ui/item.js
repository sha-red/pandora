// vim: et:ts=4:sw=4:sts=4:ft=javascript
pandora.ui.item = function() {

    var that = Ox.Element();

    pandora.api.get({
        id: pandora.user.ui.item,
        keys: []
    }, pandora.user.level == 'admin' && pandora.user.ui.itemView == 'info' ? 0 : -1, function(result) {

        if (result.status.code == 200) {
            // fixme: probably does not belong here
            document.title = '0xDB - ' + result.data.title;
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

        } else if (pandora.user.ui.itemView == 'calendar') {
            pandora.api.findEvents({
                itemQuery: {conditions: [{key: 'id', value: pandora.user.ui.item, operator:'='}]},
                keys: ['id', 'name', 'start', 'end'],
                query: {}
            }, function(r) {
                if (r.data.items.length>0) {
                    pandora.$ui.contentPanel.replaceElement(1, Ox.SplitPanel({
                        elements: [
                            {
                                element: pandora.$ui.calendar = Ox.Calendar({
                                    date: new Date(0),
                                    events: r.data.items,
                                    height: window.innerHeight - pandora.user.ui.showGroups * pandora.user.ui.groupsSize - 61,
                                    range: [-5000, 5000],
                                    width: window.innerWidth - pandora.user.ui.showSidebar * pandora.user.ui.sidebarSize - 2 - 144 - Ox.UI.SCROLLBAR_SIZE,
                                    zoom: 4
                                })
                            },
                            {
                                element: Ox.Element(),
                                id: 'place',
                                size: 144 + Ox.UI.SCROLLBAR_SIZE
                            }
                        ],
                        orientation: 'horizontal'
                    })
                    .bindEvent('resize', function(data) {

                    }));
                } else {
                    pandora.$ui.contentPanel.replaceElement(1,
                        Ox.Element()
                            .css({marginTop: '32px', fontSize: '12px', textAlign: 'center'})
                            .html(
                                'Sorry, <i>' + result.data.title 
                                + '</i> currently doesn\'t have a '
                                + pandora.user.ui.itemView + ' view.'
                    ));
                }
            });

        } else if (pandora.user.ui.itemView == 'clips') {
            var ratio = result.data.stream.aspectRatio;
            pandora.$ui.contentPanel.replaceElement(1, pandora.$ui.clips = Ox.IconList({
                fixedRatio: ratio,
                item: function(data, sort, size) {
                    size = size || 128;
                    var width = ratio > 1 ? size : Math.round(size * ratio),
                        height = ratio > 1 ? Math.round(size / ratio) : size,
                        url = '/' + pandora.user.ui.item + '/' + height + 'p' + data['in'] + '.jpg';
                    return {
                        height: height,
                        id: data['id'],
                        info: Ox.formatDuration(data['in'], 'short') + ' - ' + Ox.formatDuration(data['out'], 'short'),
                        title: data.value,
                        url: url,
                        width: width 
                    };
                },
                items: function(data, callback) {
                    pandora.api.findAnnotations(Ox.extend(data, {
                        itemQuery: {
                            conditions:[{
                                key: 'id',
                                value: pandora.user.ui.item,
                                operator: '='
                            }]
                        }
                    }), callback);
                },
                keys: ['id', 'value', 'in', 'out'],
                size: 128,
                sort: pandora.user.ui.lists[pandora.user.ui.list].sort,
                unique: 'id'
            }).bindEvent({
                open: function(data) {
                    var id = data.ids[0],
                        item = pandora.user.ui.item,
                        points = {
                            'in': pandora.$ui.clips.value(id, 'in'),
                            out: pandora.$ui.clips.value(id, 'out')
                        };
                    pandora.UI.set('videoPoints|' + item, Ox.extend(points, {
                        position: points['in']
                    }));
                    pandora.URL.set(item + '/timeline');
                }
            }));

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

        } else if (pandora.user.ui.itemView == 'map') {
            var video = result.data.stream;
            pandora.$ui.contentPanel.replaceElement(1, Ox.SplitPanel({
                elements: [
                    {
                        element: pandora.$ui.map = Ox.Map({
                            height: window.innerHeight - pandora.user.ui.showGroups * pandora.user.ui.groupsSize - 61,
                            places: function(data, callback) {
                                var itemQuery = {conditions: [{
                                        key: 'id',
                                        value: pandora.user.ui.item,
                                        operator: '='
                                    }]},
                                    query = {conditions:[]};
                                return pandora.api.findPlaces(Ox.extend(data, {
                                    itemQuery: itemQuery,
                                    query: query
                                }), callback);
                            },
                            showTypes: true,
                            toolbar: true,
                            width: window.innerWidth - pandora.user.ui.showSidebar * pandora.user.ui.sidebarSize - 2 - 144 - Ox.UI.SCROLLBAR_SIZE
                        }).bindEvent({
                            selectplace: function(event, place) {
                                if(place) {
                                    pandora.$ui.clips.options({
                                        items: function(data, callback) {
                                            return pandora.api.findAnnotations(Ox.extend(data, {
                                                query: {
                                                    conditions:[{key: 'place', value: place.id, operator:'='}]
                                                },
                                                itemQuery: {conditions: [{
                                                        key: 'id',
                                                        value: pandora.user.ui.item,
                                                        operator: '='
                                                 }]}
                                            }), callback);
                                        }
                                    });
                                } else {
                                    pandora.$ui.clips.options({
                                        items: []
                                    });
                                }
                            }
                        })
                    },
                    {
                        element: pandora.$ui.clips = Ox.IconList({
                            fixedRatio: video.aspectRatio,
                            item: function(data, sort, size) {
                                size = size || 128;
                                var ratio = data.aspectRatio,
                                    width = size,
                                    height = Math.round(size / ratio),
                                    url = '/' + data.item + '/' + height + 'p' + data['in'] + '.jpg';
                                return {
                                    height: height,
                                    id: data['id'],
                                    info: Ox.formatDuration(data['in'], 'short') +' - '+ Ox.formatDuration(data['out'], 'short'),
                                    title: data.value,
                                    url: url,
                                    width: width
                                };
                            },
                            items: [],
                            keys: ['id', 'value', 'in', 'out', 'aspectRatio', 'item'],
                            size: 128,
                            sort: pandora.user.ui.lists[pandora.user.ui.list].sort,
                            unique: 'id'
                        }).bindEvent({
                            open: function(data) {
                                var id = data.ids[0],
                                    item = pandora.user.ui.item,
                                    points = {
                                        'in': pandora.$ui.clips.value(id, 'in'),
                                        out: pandora.$ui.clips.value(id, 'out')
                                    };
                                pandora.UI.set('videoPoints|' + item, Ox.extend(points, {
                                    position: points['in']
                                }));
                                pandora.URL.set(item + '/timeline');
                            }
                        }),
                        id: 'place',
                        size: 144 + Ox.UI.SCROLLBAR_SIZE
                    }
                ],
                orientation: 'horizontal'
            })
            .bindEvent('resize', function() {
                pandora.$ui.map.resizeMap();
            }));

        } else if (pandora.user.ui.itemView == 'statistics') {
            var stats = Ox.Container();
            Ox.TreeList({
                data: result.data,
                width: pandora.$ui.mainPanel.size(1) - Ox.UI.SCROLLBAR_SIZE
            }).appendTo(stats);

            pandora.$ui.contentPanel.replaceElement(1, stats);

        } else if (pandora.user.ui.itemView == 'video') {
            // fixme: duplicated
            var layers = [],
                video = {};
            pandora.site.layers.forEach(function(layer, i) {
                layers[i] = Ox.extend({}, layer, {items: result.data.layers[layer.id]});
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
                'in': pandora.user.ui.videoPoints[pandora.user.ui.item]['in'],
                muted: pandora.user.ui.videoMuted,
                out: pandora.user.ui.videoPoints[pandora.user.ui.item].out,
                position: pandora.user.ui.videoPoints[pandora.user.ui.item].position,
                scaleToFill: pandora.user.ui.videoScale == 'fill',
                showAnnotations: pandora.user.ui.showAnnotations,
                showControls: pandora.user.ui.showControls,
                subtitles: result.data.layers.subtitles ? result.data.layers.subtitles.map(function(subtitle) {
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
            }));

        } else if (pandora.user.ui.itemView == 'timeline') {
            var layers = [],
                video = {};
            pandora.site.layers.forEach(function(layer) {
                layers.push(Ox.extend({items: result.data.layers[layer.id]}, layer));
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
                'in': pandora.user.ui.videoPoints[pandora.user.ui.item]['in'],
                layers: layers,
                muted: pandora.user.ui.videoMuted,
                out: pandora.user.ui.videoPoints[pandora.user.ui.item].out,
                position: pandora.user.ui.videoPoints[pandora.user.ui.item].position,
                posterFrame: parseInt(video.duration / 2),
                showAnnotations: pandora.user.ui.showAnnotations,
                showLargeTimeline: true,
                // fixme: layers have value, subtitles has text?
                subtitles: result.data.layers.subtitles ? result.data.layers.subtitles.map(function(subtitle) {
                    return {'in': subtitle['in'], out: subtitle.out, text: subtitle.value};
                }) : [],
                tooltips: true,
                video: video,
                videoRatio: result.data.videoRatio,
                videoSize: pandora.user.ui.videoSize,
                width: pandora.$ui.document.width() - pandora.$ui.mainPanel.size(0) - 1
            }).bindEvent({
                points: function(data) {
                    pandora.UI.set('videoPoints|' + pandora.user.ui.item, {
                        'in': data['in'],
                        out: data.out,
                        position: pandora.user.ui.videoPoints[pandora.user.ui.item].position
                    });
                },
                position: function(data) {
                    pandora.UI.set('videoPoints|' + pandora.user.ui.item + '|position', data.position);
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

        } else if (pandora.user.ui.itemView == 'files') {
            pandora.$ui.contentPanel.replaceElement(1,
                pandora.$ui.item = Ox.FilesView({
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

