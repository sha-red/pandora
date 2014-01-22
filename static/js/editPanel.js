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

    ui.edit ? getEdit(renderEdit) : renderEdits();

    function editsKey(key) {
        return 'edits.' + ui.edit.replace(/\./g, '\\.') + '.' + key;
    }

    function enableDragAndDrop() {
        pandora.enableDragAndDrop(
            Ox.UI.elements[that.find('.OxIconList').data('oxid')],
            edit.editable
        );
    }

    function getClips(ids) {
        return ids.map(function(id) {
            return Ox.getObjectById(edit.clips, id);
        });
    }

    function getEdit(callback) {
        pandora.api.getEdit({id: ui.edit}, function(result) {
            edit = result.data;
            // fixme: duration should come from backend
            edit.duration = 0;
            edit.clips.forEach(function(clip) {
                clip.position = edit.duration;
                edit.duration += clip.duration;
            });
            callback();
        });
    }

    function getSmallTimelineCanvas() {
        var fps = getSmallTimelineFPS(),
            width = Math.ceil(edit.duration * fps),
            height = fps == 1 ? 16 : 64;
        return Ox.$('<canvas>').attr({width: width, height: height})[0];
    }

    function getSmallTimelineFPS() {
        return Math.floor(edit.duration * 25) < 32768 ? 25 : 1;
    }

    function getSmallTimelineURL() {
        var fps = getSmallTimelineFPS(),
            width = Math.ceil(edit.duration * fps),
            height = fps == 1 ? 16 : 64;
        smallTimelineCanvas = Ox.$('<canvas>').attr({width: width, height: height})[0];
        smallTimelineContext = smallTimelineCanvas.getContext('2d');
        return smallTimelineCanvas.toDataURL();
    }

    function getVideos() {
        var videos = {};
        pandora.site.video.resolutions.forEach(function(resolution) {
            videos[resolution] = Ox.flatten(edit.clips.map(function(clip) {
                return pandora.getClipVideos(clip, resolution);
            }));
        });
        return videos;
    }

    function renderEdit() {
        that = pandora.$ui.editPanel = Ox.VideoEditPanel({
            annotationsCalendarSize: ui.annotationsCalendarSize,
            annotationsFont: ui.annotationsFont,
            annotationsMapSize: ui.annotationsMapSize,
            annotationsRange: ui.annotationsRange,
            annotationsSize: ui.annotationsSize,
            annotationsSort: ui.annotationsSort,
            clickLink: pandora.clickLink,
            clips: Ox.clone(edit.clips),
            clipSize: listSize,
            clipSort: ui.edits[ui.edit].sort,
            clipSortOptions: [/*...*/],
            clipTooltip: 'clips <span class="OxBright">' + Ox.SYMBOLS.SHIFT + 'C</span>',
            clipView: ui.edits[ui.edit].view,
            duration: edit.duration,
            editable: edit.editable,
            enableSubtitles: ui.videoSubtitles,
            fullscreen: false,
            getClipImageURL: function(id, width, height) {
                var clip = Ox.getObjectById(edit.clips, id);
                return '/' + clip.item + '/' + height + 'p' + clip['in'] + '.jpg';
            },
            getLargeTimelineURL: function(type, i, callback) {
                pandora.getLargeEditTimelineURL(edit, type, i, callback);
            },
            height: pandora.$ui.appPanel.size(1),
            'in': ui.edits[ui.edit]['in'],
            layers: getLayers(edit.clips),
            loop: ui.videoLoop,
            muted: ui.videoMuted,
            out: ui.edits[ui.edit].out,
            position: ui.edits[ui.edit].position,
            resolution: ui.videoResolution,
            scaleToFill: ui.videoScale == 'fill',
            selected: ui.edits[ui.edit].selection,
            showAnnotationsCalendar: ui.showAnnotationsCalendar,
            showAnnotationsMap: ui.showAnnotationsMap,
            showClips: ui.showClips,
            showLayers: ui.showLayers,
            showTimeline: ui.showTimeline,
            showUsers: pandora.site.annotations.showUsers,
            smallTimelineURL: getSmallTimelineURL(),
            sort: ui.edits[ui.edit].sort,
            sortOptions: [
                    {id: 'index', title: Ox._('Sort Manually'), operator: '+'}
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
            timelineTooltip: 'timeline <span class="OxBright">' + Ox.SYMBOLS.SHIFT + 'T</span>',
            video: getVideos(),
            volume: ui.videoVolume,
            width: pandora.$ui.document.width() - pandora.$ui.mainPanel.size(0) - 1
        })
        .bindEvent({
            copy: function(data) {
                pandora.clipboard.copy(serializeClips(data.ids), 'clip');
            },
            copyadd: function(data) {
                pandora.clipboard.add(serializeClips(data.ids), 'clip');
            },
            cut: function(data) {
                var clips = serializeClips(data.ids);
                pandora.clipboard.copy(clips, 'clip');
                pandora.doHistory('cut', clips, ui.edit, function(result) {
                    Ox.Request.clearCache('getEdit');
                    updateClips(result.data.clips);
                });
            },
            cutadd: function(data) {
                var clips = serializeClips(data.ids);
                pandora.clipboard.add(clips, 'clip');
                pandora.doHistory('cut', clips, ui.edit, function(result) {
                    Ox.Request.clearCache('getEdit');
                    updateClips(result.data.clips);
                });
            },
            'delete': function(data) {
                var clips = serializeClips(data.ids);
                pandora.doHistory('delete', clips, ui.edit, function(result) {
                    Ox.Request.clearCache('getEdit');
                    updateClips(result.data.clips);
                });
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
                    var clips;
                    if (data.key == 'out') {
                        data.value = Math.min(data.value, result.data.duration);
                    }
                    clips = serializeClips([data.id]).concat(serializeClips([{
                        id: data.id,
                        'in': data.key == 'in' ? data.value : clip['in'],
                        item: clip.item,
                        out: data.key == 'out' ? data.value : clip.out
                    }]));
                    pandora.doHistory('edit', clips, ui.edit, function(result) {
                        if (result.status.code == 200) {
                            edit.clips[index] = result.data;
                            that.updateClip(data.id, result.data);
                            updateVideos();
                        } else {
                            Ox.print('failed to edit clip', result);
                        }
                    });
                });
            },
            join: function(data) {
                var clips = [serializeClips(data.ids), serializeClips(data.join)];
                pandora.doHistory('join', clips, ui.edit, function(result) {
                    updateClips(edit.clips.filter(function(clip) {
                        return !Ox.contains(data.ids, clip.id);
                    }).concat(result.data.clips));
                });
            },
            loop: function(data) {
                pandora.UI.set({videoLoop: data.loop});
            },
            move: function(data) {
                pandora.api.orderClips({
                    edit: edit.id,
                    ids: data.ids
                }, function(result) {
                    Ox.Request.clearCache('getEdit');
                    orderClips(data.ids);
                });
            },
            muted: function(data) {
                pandora.UI.set({videoMuted: data.muted});
            },
            open: function(data) {
                pandora.UI.set(editsKey('clip'), data.ids[0]);
            },
            paste: function() {
                var clips = pandora.clipboard.paste();
                pandora.doHistory('paste', clips, ui.edit, function(result) {
                    Ox.Request.clearCache('getEdit');
                    updateClips(edit.clips.concat(result.data.clips));
                });
            },
            playing: function(data) {
                var set = {};
                set[editsKey('clip')] = '';
                set[editsKey('position')] = data.position;
                pandora.UI.set(set);
            },
            position: function(data) {
                var set = {};
                set[editsKey('clip')] = '';
                set[editsKey('position')] = data.position;
                pandora.UI.set(set);
            },
            resize: function(data) {
                // sidebar resize
                that.options({width: data.size});
            },
            resizeclips: function(data) {
                pandora.UI.set({clipsSize: data.clipsSize});
            },
            resolution: function(data) {
                pandora.UI.set({videoResolution: data.resolution});
            },
            scale: function(data) {
                pandora.UI.set({videoScale: data.scale});
            },
            select: function(data) {
                pandora.UI.set(editsKey('selection'), data.ids);
            },
            size: function(data) {
                pandora.UI.set({clipSize: data.size});
            },
            sort: function(data) {
                pandora.UI.set(editsKey('sort'), data);
                var key = data[0].key;
                if (key == 'position') {
                    key = 'in';
                }
                if ([
                    'id', 'index', 'in', 'out', 'duration',
                    'title', 'director', 'year', 'videoRatio'
                ].indexOf(key) > -1) {
                    edit.clips = Ox.sortBy(edit.clips, key);
                    if (data[0].operator == '-') {
                        edit.clips.reverse();
                    }
                    updateClips(edit.clips);
                } else {
                    pandora.api.sortClips({
                        edit: edit.id,
                        sort: data
                    }, function(result) {
                        edit.clips.forEach(function(clip) {
                            clip['sort'] = result.data.clips.indexOf(clip.id);
                        });
                        edit.clips = Ox.sortBy(edit.clips, 'sort');
                        updateClips(edit.clips);
                    });
                }
            },
            split: function(data) {
                var clips = [serializeClips(data.ids), serializeClips(data.split)];
                pandora.doHistory('split', clips, ui.edit, function(result) {
                    updateClips(edit.clips.filter(function(clip) {
                        return !Ox.contains(data.ids, clip.id);
                    }).concat(result.data.clips));
                });
            },
            subtitles: function(data) {
                pandora.UI.set({videoSubtitles: data.subtitles});
            },
            timeline: function(data) {
                pandora.UI.set({videoTimeline: data.timeline});
            },
            toggleclips: function(data) {
                pandora.UI.set({showClips: data.showClips});
            },
            toggletimeline: function(data) {
                pandora.UI.set({showTimeline: data.showTimeline});
            },
            view: function(data) {
                pandora.UI.set(editsKey('view'), data.view);
                data.view == 'grid' && enableDragAndDrop();
            },
            volume: function(data) {
                pandora.UI.set({videoVolume: data.volume});
            },
            pandora_showclips: function(data) {
                that.options({showClips: data.value});
            },
            pandora_showtimeline: function(data) {
                that.options({showTimeline: data.value});
            },
            pandora_videotimeline: function(data) {
                that.options({timeline: data.value});
            }
        });
        that.updatePanel = function() {
            Ox.Request.clearCache('getEdit');
            getEdit(updateClips);
        };
        pandora.$ui.mainPanel.replaceElement(1, that);
        updateSmallTimelineURL();
        ui.edits[ui.edit].view == 'grid' && enableDragAndDrop();
    }

    function renderEdits() {
        that = Ox.IconList({
            borderRadius: 16,
            defaultRatio: 1,
            draggable: true,
            item: function(data, sort, size) {
                size = size || 128;
                var ui = pandora.user.ui,
                    url = '/edit/' + data.id + '/icon' + size + '.jpg?' + data.modified,
                    info = Ox.formatDuration(data.duration);
                return {
                    height: size,
                    id: data.id,
                    title: data.name,
                    info: info,
                    url: url,
                    width: size,
                };
            },
            items: function(data, callback) {
                pandora.api.findEdits(data, callback);
                return Ox.clone(data, true);
            },
            keys: ['id', 'modified', 'name', 'duration'],
            size: 128,
            sort: [{key: 'id', operator: '+'}],
            unique: 'id'
        })
        .addClass('OxMedia')
        .bindEvent({
            open: function(data) {
                pandora.UI.set('edit', data.ids[0]);
            }
        });
    }

    function orderClips(ids) {
        edit.clips.forEach(function(clip) {
            clip.index = ids.indexOf(clip.id);
        });
        edit.clips = Ox.sortBy(edit.clips, 'index');
        updateVideos();
    }

    function getLayers(clips) {
        var layers = [];
        pandora.site.layers.forEach(function(layer, i) { 
            layers[i] = Ox.extend({}, layer, {
                title: Ox._(layer.title),
                item: Ox._(layer.item),
                items: Ox.flatten(clips.map(function(clip) {
                    return clip.layers[layer.id].map(function(annotation) {
                        var a = Ox.clone(annotation);
                        ['in', 'out'].forEach(function(point) {
                            a[point] = a[point] - clip['in'] + clip['position'];
                        });
                        return a;
                    });
                })),
            });
        });
        return layers;
    }

    function serializeClips(clips) {
        // can be ids or clips
        return clips.map(function(clip) {
            if (Ox.isString(clip)) {
                clip = Ox.getObjectById(edit.clips, clip);
            }
            return (
                clip.annotation || clip.item + '/' + clip['in'] + '-' + clip.out
            ) + '/' + (clip.id || '');
        });
    }

    function updateClips(clips) {
        clips = clips || edit.clips;
        edit.clips = clips;
        edit.duration = 0;
        edit.clips.forEach(function(clip) {
            clip.position = edit.duration;
            edit.duration += clip.duration;
        });
        that.options({
            clips: Ox.clone(edit.clips),
            duration: edit.duration,
            layers: getLayers(edit.clips),
            smallTimelineURL: getSmallTimelineURL(),
            video: getVideos()
        });
        updateSmallTimelineURL();
    }

    function updateSmallTimelineURL() {
        var canvas = getSmallTimelineCanvas(),
            context = canvas.getContext('2d'),
            fps = getSmallTimelineFPS();
        Ox.serialForEach(edit.clips, function(clip) {
            var callback = Ox.last(arguments);
            pandora[
                fps == 1 ? 'getSmallClipTimelineURL' : 'getLargeClipTimelineURL'
            ](clip.item, clip['in'], clip.out, ui.videoTimeline, function(url) {
                var image = Ox.$('<img>')
                    .on({
                        load: function() {
                            context.drawImage(image, Math.floor(clip.position * fps), 0);
                            that.options({smallTimelineURL: canvas.toDataURL()});
                            callback();
                        }
                    })
                    .attr({
                        src: url
                    })[0];
            });
        });
    }

    function updateVideos() {
        edit.duration = 0;
        edit.clips.forEach(function(clip) {
            clip.position = edit.duration;
            edit.duration += clip.duration;
        });
        that.options({
            duration: edit.duration,
            smallTimelineURL: getSmallTimelineURL(),
            video: getVideos()
        });
        updateSmallTimelineURL();
    }

    return that;

};
