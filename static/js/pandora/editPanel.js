'use strict';

pandora.ui.editPanel = function() {

    var ui = pandora.user.ui,
        edit,
        listSizes = [
            144 + Ox.UI.SCROLLBAR_SIZE,
            280 + Ox.UI.SCROLLBAR_SIZE,
            416 + Ox.UI.SCROLLBAR_SIZE
        ],
        listSize = listSizes[ui.clipColumns],
        smallTimelineCanvas,
        smallTimelineContext,
        that = Ox.Element();

    ui.edit && render();

    function editPointsKey(key) {
        return 'editPoints.' + ui.edit.replace(/\./g, '\\.') + '.' + key;
    }

    function getSmallTimelineURL() {
        var fps = 25,
            width = Math.floor(edit.duration * fps),
            height = 64;
        smallTimelineCanvas = Ox.$('<canvas>').attr({width: width, height: height})[0];
        smallTimelineContext = smallTimelineCanvas.getContext('2d');
        return smallTimelineCanvas.toDataURL();
    }

    function getVideos() {
        return Ox.flatten(edit.clips.map(function(clip) {
            return pandora.getClipVideos(clip);
        }));
    }

    function render() {
        pandora.api.getEdit({id: pandora.user.ui.edit}, function(result) {
            edit = result.data;
            // fixme: duration should come from backend
            edit.duration = 0;
            edit.clips.forEach(function(clip) {
                clip.position = edit.duration;
                edit.duration += clip.duration;
            });
            //Ox.print('EDIT', edit)
            pandora.$ui.mainPanel.replaceElement(1,
                that = Ox.VideoEditPanel({
                    clips: edit.clips,
                    clipsSize: listSize,
                    clipSort: ui.clipSort,
                    clipSortOptions: [/*...*/],
                    clipView: ui.clipView,
                    cuts: [],
                    duration: edit.duration,
                    editable: edit.editable,
                    enableSubtitles: ui.videoSubtitles,
                    fullscreen: false,
                    getLargeTimelineURL: function(type, i, callback) {
                        pandora.getLargeEditTimelineURL(edit, type, i, callback);
                    },
                    height: pandora.$ui.appPanel.size(1),
                    'in': ui.editPoints[ui.edit]['in'],
                    loop: ui.videoLoop,
                    muted: ui.videoMuted,
                    out: ui.editPoints[ui.edit].out,
                    position: ui.editPoints[ui.edit].position,
                    resolution: ui.videoResolution,
                    scaleToFill: ui.videoScale == 'fill',
                    // selected: ...
                    showClips: ui.showClips,
                    showTimeline: ui.showTimeline,
                    smallTimelineURL: getSmallTimelineURL(),
                    sort: ui.clipSort,
                    sortOptions: [
                            {key: 'index', title: Ox._('Sort Manually'), operator: '+'}
                        ].concat(
                            pandora.site.clipKeys.map(function(key) {
                                return Ox.extend(Ox.clone(key), {
                                    title: Ox._(('Sort by Clip {0}'), [Ox._(key.title)])
                                });
                            })
                        ).concat(
                            pandora.site.sortKeys.map(function(key) {
                                return Ox.extend(Ox.clone(key), {
                                    title: Ox._('Sort by {0}', [Ox._(key.title)])
                                });
                            })
                        ),
                    timeline: ui.videoTimeline,
                    video: getVideos(),
                    volume: ui.videoVolume,
                    width: pandora.$ui.document.width() - pandora.$ui.mainPanel.size(0) - 1
                })
                .bindEvent({
                    clipssort: function(data) {
                        pandora.UI.set({clipSort: data.sort});
                    },
                    copy: function(data) {
                        
                    },
                    cut: function(data) {
                        
                    },
                    edit: function(data) {
                        var args = {id: data.id},
                            index = Ox.getIndexById(edit.clips, data.id),
                            clip = edit.clips[index];
                        if (data.key == 'duration') {
                            data.key = 'out';
                            data.value += clip['in'];
                        }
                        pandora.api.get({id: clip.item, keys: ['duration']}, function(result) {
                            data.value = Math.min(data.value, result.data.duration);
                            args[data.key] = data.value;
                            if (data.key == 'in' && data.value > clip.out) {
                                args.out = args['in'];
                            } else if (data.key == 'out' && data.value < clip['in']) {
                                args['in'] = args.out;
                            }
                            pandora.api.editClip(args, function(result) {
                                edit.clips[index] = result.data;
                                that.updateClip(data.id, result.data);
                            });
                        });
                    },
                    move: function(data) {
                        pandora.api.sortClips({
                            edit: edit.id,
                            ids: data.ids
                        }, function() {
                            Ox.Request.clearCache('getEdit');
                        });
                    },
                    muted: function(data) {
                        pandora.UI.set('videoMuted', data.muted);
                    },
                    paste: function() {
                        if (Ox.Clipboard.type() == 'clip') {
                            pandora.api.addClips({
                                clips: Ox.Clipboard.paste(),
                                edit: pandora.user.ui.edit
                            }, function(result) {
                                updateClips(edit.clips.concat(result.data.clips));
                            });
                        }
                    },
                    playing: function(data) {
                        pandora.UI.set(editPointsKey('position'), data.position);
                    },
                    position: function(data) {
                        pandora.UI.set(editPointsKey('position'), data.position);
                    },
                    remove: function(data) {
                        if (edit.editable) {
                            pandora.api.removeClips({
                                ids: data.ids,
                                edit: pandora.user.ui.edit
                            }, function(result) {
                                updateClips(result.data.clips);
                            });
                        }
                    },
                    resizeclips: function(data) {
                        pandora.UI.set('clipsSize', data.clipsSize);
                    },
                    resolution: function(data) {
                        pandora.UI.set('videoResolution', data.resolution);
                    },
                    scale: function(data) {
                        pandora.UI.set('videoScale', data.scale);
                    },
                    select: function(data) {
                        pandora.UI.set(editPointsKey('clip'), data.ids[0]);
                    },
                    subtitles: function(data) {
                        pandora.UI.set('videoSubtitles', data.subtitles);
                    },
                    timeline: function(data) {
                        pandora.UI.set('videoTimeline', data.timeline);
                    },
                    toggleclips: function(data) {
                        pandora.UI.set('showAnnotations', data.showAnnotations);
                    },
                    toggletimeline: function(data) {
                        pandora.UI.set('showTimeline', data.showTimeline);
                    },
                    volume: function(data) {
                        pandora.UI.set('videoVolume', data.volume);
                    },
                    pandora_showannotations: function(data) {
                        that.options({showAnnotations: data.value});
                    },
                    pandora_showtimeline: function(data) {
                        that.options({showTimeline: data.value});
                    },
                    pandora_videotimeline: function(data) {
                        that.options({timeline: data.value});
                    }
                })
            );
            updateSmallTimelineURL();
        });
    }

    function updateClips(clips) {
        Ox.Request.clearCache();
        edit.clips = clips;
        edit.duration = 0;
        edit.clips.forEach(function(clip) {
            clip.position = edit.duration;
            edit.duration += clip.duration;
        });
        that.options({
            clips: clips,
            smallTimelineURL: getSmallTimelineURL(),
            video: getVideos()
        });
        updateSmallTimelineURL();

    }

    function updateSmallTimelineURL() {
        var fps = 25;
        Ox.serialForEach(edit.clips, function(clip) {
            var callback = Ox.last(arguments);
            pandora.getLargeClipTimelineURL(clip.item, clip['in'], clip.out, ui.videoTimeline, function(url) {
                var image = Ox.$('<img>')
                    .on({
                        load: function() {
                            smallTimelineContext.drawImage(image, Math.floor(clip.position * fps), 0);
                            that.options({smallTimelineURL: smallTimelineCanvas.toDataURL()});
                            callback();
                        }
                    })
                    .attr({
                        src: url
                    })[0];
            });
        });
    }

    return that;

};
