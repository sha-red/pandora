// vim: et:ts=4:sw=4:sts=4:ft=js
pandora.ui.item = function() {
    var that = new Ox.Element();
    pandora.api.getItem(app.user.ui.item, function(result) {
        if (result.status.code != 200) {
            app.$ui.contentPanel.replaceElement(1,
                Ox.Element().html(
                    'The '+app.site.itemName.singular+' you are looking for does not exist.'));
        } else if (app.user.ui.itemView == 'calendar') {
            app.$ui.contentPanel.replaceElement(1, Ox.Element().html('Calendar'));
        } else if (app.user.ui.itemView == 'clips') {
            app.$ui.contentPanel.replaceElement(1, Ox.Element().html('Clips'));
        } else if (app.user.ui.itemView == 'info') {
            //Ox.print('result.data', result.data)
            if (app.user.level == 'admin') {
                var $form,
                    $edit = new Ox.Element()
                    .append($form = new Ox.FormElementGroup({
                        elements: Ox.map(app.site.itemKeys, function(key) {
                            return new Ox.Input({
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
                    .append(new Ox.Button({
                        title: 'Save',
                        type: 'text'
                    }).bindEvent({
                        click: function(event, data) {
                            var values = $form.value();
                            var changed = {};
                            Ox.map(app.site.itemKeys, function(key, i) {
                                if(values[i] && values[i] != ''+result.data[key.id]) {
                                    if(Ox.isArray(key.type) && key.type[0] == 'string') {
                                        changed[key.id] = values[i].split(', ');
                                    } else {
                                        changed[key.id] = values[i];
                                    }
                                }
                            });
                            if(changed) {
                                pandora.api.editItem(Ox.extend(changed, {id: app.user.ui.item}), function(result) {
                                    //fixme just reload parts that need reloading
                                    window.location.reload();
                                });    
                            }
                        }
                    }));
                app.$ui.contentPanel.replaceElement(1, app.$ui.item = $edit);
            } else {
                $.get('/static/html/itemInfo.html', {}, function(template) {
                    //Ox.print(template);
                    app.$ui.contentPanel.replaceElement(1,
                        app.$ui.item = new Ox.Element()
                        .append($.tmpl(template, result.data))
                    );
                });
            }

        } else if (app.user.ui.itemView == 'map') {
            app.$ui.contentPanel.replaceElement(1, Ox.Element().html('Map'));
        } else if (app.user.ui.itemView == 'player') {
            var video = result.data.stream,
                format = $.support.video.supportedFormat(video.formats);
                video.height = video.profiles[0];
            video.width = parseInt(video.height * video.aspectRatio / 2) * 2;
            video.url = video.baseUrl + '/' + video.height + 'p.' + format;
            app.$ui.contentPanel.replaceElement(1, app.$ui.player = new Ox.VideoPanelPlayer({
                annotationsSize: app.user.ui.annotationsSize,
                duration: video.duration,
                height: app.$ui.contentPanel.size(1),
                position: app.user.ui.videoPosition[app.user.ui.item] || 0,
                showAnnotations: app.user.ui.showAnnotations,
                showControls: app.user.ui.showControls,
                subtitles: result.data.layers.subtitles.map(function(subtitle) {
                    return {'in': subtitle['in'], out: subtitle.out, text: subtitle.value};
                }),
                videoHeight: video.height,
                videoId: app.user.ui.item,
                videoWidth: video.width,
                videoSize: app.user.ui.videoScreen,
                videoURL: video.url,
                width: app.$ui.document.width() - app.$ui.mainPanel.size(0) - 1
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
                    app.$ui.player.options({
                        height: data
                    });
                }
            }));
        } else if (app.user.ui.itemView == 'statistics') {
            app.$ui.contentPanel.replaceElement(1, Ox.Element().html('Statistics'));
        } else if (app.user.ui.itemView == 'timeline') {
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
            $.each(app.site.layers, function(i, layer) {
                layers[i] = $.extend({}, layer, {items: result.data.layers[layer.id]});
            });
            app.$ui.contentPanel.replaceElement(1, app.$ui.editor = new Ox.VideoEditor({
                annotationsSize: app.user.ui.annotationsSize,
                cuts: cuts,
                duration: video.duration,
                find: '',
                getFrameURL: function(position) {
                    return '/' + app.user.ui.item + '/frame/' + video.width.toString() + '/' + position.toString() + '.jpg';
                },
                getLargeTimelineImageURL: function(i) {
                    return '/' + app.user.ui.item + '/timelines/timeline.64.' + i + '.png';
                },
                getSmallTimelineImageURL: function(i) {
                    return '/' + app.user.ui.item + '/timelines/timeline.16.' + i + '.png';
                },
                height: app.$ui.contentPanel.size(1),
                id: 'editor',
                'in': 0,
                layers: layers,
                out: 0,
                position: app.user.ui.videoPosition[app.user.ui.item] || 0,
                posterFrame: parseInt(video.duration / 2),
                showAnnotations: app.user.ui.showAnnotations,
                showLargeTimeline: true,
                // fixme: layers have value, subtitles has text?
                subtitles: result.data.layers.subtitles.map(function(subtitle) {
                    return {'in': subtitle['in'], out: subtitle.out, text: subtitle.value};
                }),
                videoHeight: video.height,
                videoId: app.user.ui.item,
                videoWidth: video.width,
                videoSize: app.user.ui.videoSize,
                video: streams,
                width: app.$ui.document.width() - app.$ui.mainPanel.size(0) - 1
            }).bindEvent({
                resize: function(event, data) {
                    app.$ui.editor.options({
                        height: data
                    });
                },
                togglesize: function(event, data) {
                    pandora.UI.set({videoSize: data.size});
                },
                addAnnotation: function(event, data) {
                    Ox.print('addAnnotation', data);
                    data.item = app.user.ui.item;
                    data.value = 'Click to edit';
                    pandora.api.addAnnotation(data, function(result) {
                        app.$ui.editor.addAnnotation(data.layer, result.data);
                    });
                },
                removeAnnotations: function(event, data) {
                    pandora.api.removeAnnotations(data, function(result) {
                        //fixme: check for errors
                        app.$ui.editor.removeAnnotations(data.layer, data.ids);
                    });
                },
                updateAnnotation: function(event, data) {
                    //fixme: check that edit was successfull
                    Ox.print('updateAnnotation', data);
                    pandora.api.editAnnotation(data);
                }
            }));
            that.bindEvent('resize', function(event, data) {
                //Ox.print('resize item', data)
                app.$ui.editor.options({
                    height: data
                });
            });
            /*
            app.$ui.rightPanel.bindEvent('resize', function(event, data) {
                Ox.print('... rightPanel resize', data, app.$ui.timelinePanel.size(1))
                app.$ui.editor.options({
                    width: data - app.$ui.timelinePanel.size(1) - 1
                });
            });
            */                        
        } else if (app.user.ui.itemView == 'files') {
            app.$ui.contentPanel.replaceElement(1,
                app.$ui.item = new Ox.FilesView({
                    id: result.data.id
                })
            );
        }
        var director = result.data.director?' ('+result.data.director.join(', ')+')':'';
        app.$ui.total.html(result.data.title + director);
    });
    return that;
};

