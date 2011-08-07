// vim: et:ts=4:sw=4:sts=4:ft=javascript
pandora.ui.item = function() {
    var that = Ox.Element();
    pandora.api.get({
        id: pandora.user.ui.item,
        keys: []
    }, pandora.user.level == 'admin' && pandora.user.ui.itemView == 'info' ? 0 : -1, function(result) {
        if (result.status.code != 200) {
            pandora.$ui.contentPanel.replaceElement(1,
                Ox.Element().html(
                    'The '+pandora.site.itemName.singular+' you are looking for does not exist.'));
        } else if (!result.data.rendered &&
                   ['clips', 'map',
                    'player', 'timeline'].indexOf(pandora.user.ui.itemView)>-1) {
            pandora.$ui.contentPanel.replaceElement(1,
                Ox.Element().css({margin: '16px'}).html(
                    'We are sorry, "' + result.data.title +
                    '" does not have a '+pandora.user.ui.itemView +
                    ' view right now.'));
        } else if (pandora.user.ui.itemView == 'calendar') {
            pandora.$ui.contentPanel.replaceElement(1, Ox.Element().html('Calendar'));
        } else if (pandora.user.ui.itemView == 'clips') {
            var ratio = result.data.stream.aspectRatio;
            Ox.print('RATIO', ratio)
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
                    pandora.api.findAnnotations($.extend(data, {
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
                open: function(event, data) {
                    var id = data.ids[0],
                        item = pandora.user.ui.item,
                        position = pandora.$ui.clips.value(id, 'in');
                    pandora.UI.set('videoPosition|' + item, position);
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
                        click: function(event, data) {
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
                /*
                $.get('/static/html/itemInfo.html', {}, function(template) {
                    //Ox.print(template);
                    var posterRatio = result.data.poster.width / result.data.poster.height;
                    result.data.posterWidth = posterRatio > 1 ? 256 : Math.round(256 * posterRatio);
                    result.data.posterHeight = posterRatio < 1 ? 256 : Math.round(256 / posterRatio);
                    result.data.posterLeft = Math.floor((256 - result.data.posterWidth) / 2);
                    pandora.$ui.contentPanel.replaceElement(1,
                        pandora.$ui.item = Ox.Element().append($.tmpl(template, result.data))
                    );
                });
                */
            }

        } else if (pandora.user.ui.itemView == 'map') {
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
                                return pandora.api.findPlaces($.extend(data, {
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
                                            return pandora.api.findAnnotations($.extend(data, {
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
                            item: function(data, sort, size) {
                                size = size || 128;
                                var ratio = data.aspectRatio,
                                    width = size,
                                    height = size/ratio,
                                    url = '/' + data.item + '/' + size + '/'+data['in'] + '.jpg';
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
                            open: function(event, data) {
                                var id = data.ids[0],
                                    item = pandora.user.ui.item,
                                    position = pandora.$ui.clips.value(id, 'in');
                                pandora.UI.set('videoPosition|' + item, position);
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
        } else if (pandora.user.ui.itemView == 'player') {
            var video = result.data.stream,
                format = $.support.video.supportedFormat(video.formats);
                video.height = video.profiles[0];
            video.width = parseInt(video.height * video.aspectRatio / 2) * 2;
            video.url = video.baseUrl + '/' + video.height + 'p.' + format;
            pandora.$ui.contentPanel.replaceElement(1, pandora.$ui.player = Ox.VideoPanelPlayer({
                annotationsSize: pandora.user.ui.annotationsSize,
                duration: video.duration,
                height: pandora.$ui.contentPanel.size(1),
                position: pandora.user.ui.videoPosition[pandora.user.ui.item] || 0,
                showAnnotations: pandora.user.ui.showAnnotations,
                showControls: pandora.user.ui.showControls,
                subtitles: result.data.layers.subtitles,
                videoHeight: video.height,
                videoId: pandora.user.ui.item,
                videoWidth: video.width,
                videoSize: pandora.user.ui.videoScreen,
                videoURL: video.url,
                width: pandora.$ui.document.width() - pandora.$ui.mainPanel.size(0) - 1
            }).bindEvent({
                change: function(event, data) {
                    // showAnnotations, showControls, videoScreen
                    pandora.UI.set('videoSize' in data ? {
                        videoScreen: data.videoSize
                    } : data);
                },
                enterfullscreen: pandora.enterFullscreen,
                exitfullscreen: pandora.exitFullscreen,
                resize: function(event, data) {
                    pandora.$ui.player.options({
                        height: data
                    });
                }
            }));
        } else if (pandora.user.ui.itemView == 'statistics') {
            var stats = Ox.Container();
            Ox.TreeList({
                data: result.data,
                width: pandora.$ui.mainPanel.size(1) - Ox.UI.SCROLLBAR_SIZE
            }).appendTo(stats);

            pandora.$ui.contentPanel.replaceElement(1, stats);

        } else if (pandora.user.ui.itemView == 'timeline') {
            var layers = [],
                video = result.data.stream,
                cuts = result.data.cuts || [],
                format = $.support.video.supportedFormat(video.formats),
                streams = {};
            video.height = video.profiles[0];
            video.width = parseInt(video.height * video.aspectRatio / 2) * 2;
            video.profiles.forEach(function(profile) {
                streams[profile] = video.baseUrl + '/' + profile + 'p.' + format;
            });
            $.each(pandora.site.layers, function(i, layer) {
                layers[i] = $.extend({}, layer, {items: result.data.layers[layer.id]});
            });
            pandora.$ui.contentPanel.replaceElement(1, pandora.$ui.editor = Ox.VideoEditor({
                annotationsSize: pandora.user.ui.annotationsSize,
                cuts: cuts,
                duration: video.duration,
                find: '',
                getFrameURL: function(position) {
                    return '/' + pandora.user.ui.item + '/' + video.height.toString() + 'p' + position.toString() + '.jpg';
                },
                getLargeTimelineImageURL: function(i) {
                    return '/' + pandora.user.ui.item + '/timeline64p' + i + '.png';
                },
                getSmallTimelineImageURL: function(i) {
                    return '/' + pandora.user.ui.item + '/timeline16p' + i + '.png';
                },
                height: pandora.$ui.contentPanel.size(1),
                id: 'editor',
                'in': 0,
                layers: layers,
                out: 0,
                position: pandora.user.ui.videoPosition[pandora.user.ui.item] || 0,
                posterFrame: parseInt(video.duration / 2),
                showAnnotations: pandora.user.ui.showAnnotations,
                showLargeTimeline: true,
                // fixme: layers have value, subtitles has text?
                subtitles: result.data.layers.subtitles.map(function(subtitle) {
                    return {'in': subtitle['in'], out: subtitle.out, text: subtitle.value};
                }),
                videoHeight: video.height,
                videoId: pandora.user.ui.item,
                videoWidth: video.width,
                videoSize: pandora.user.ui.videoSize,
                video: streams,
                width: pandora.$ui.document.width() - pandora.$ui.mainPanel.size(0) - 1
            }).bindEvent({
                resize: function(event, data) {
                    pandora.$ui.editor.options({
                        height: data
                    });
                },
                togglesize: function(event, data) {
                    pandora.UI.set({videoSize: data.size});
                },
                addAnnotation: function(event, data) {
                    Ox.print('addAnnotation', data);
                    data.item = pandora.user.ui.item;
                    data.value = 'Click to edit';
                    pandora.api.addAnnotation(data, function(result) {
                        pandora.$ui.editor.addAnnotation(data.layer, result.data);
                    });
                },
                removeAnnotations: function(event, data) {
                    pandora.api.removeAnnotations(data, function(result) {
                        //fixme: check for errors
                        pandora.$ui.editor.removeAnnotations(data.layer, data.ids);
                    });
                },
                updateAnnotation: function(event, data) {
                    //fixme: check that edit was successfull
                    pandora.api.editAnnotation(data, function(result) {
                        Ox.print('done updateAnnotation', result);
                        
                    });
                }
            }));
            that.bindEvent('resize', function(event, data) {
                //Ox.print('resize item', data)
                pandora.$ui.editor.options({
                    height: data
                });
            });
            /*
            pandora.$ui.rightPanel.bindEvent('resize', function(event, data) {
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
        var director = result.data.director?' ('+result.data.director.join(', ')+')':'';
        pandora.$ui.total.html(result.data.title + director);
    });
    return that;
};

