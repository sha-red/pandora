// vim: et:ts=4:sw=4:sts=4:ft=javascript
'use strict';

pandora.ui.uploadVideoDialog = function(data) {

    var cancelled = false,
        file,
        hasFirefogg = !(Ox.isUndefined(window.Firefogg)) && (
            $.browser.version < '35' || Firefogg().version >= 334
        ),
        infoContent = Ox._('Please select the video file that you want to upload.'),
        itemView = pandora.site.capabilities.canSeeExtraItemViews[
            pandora.user.level
        ] ? 'media' : 'info',
        selectFile,
        $actionButton,
        $closeButton,
        $content = Ox.Element().css({margin: '16px'}),
        $info = $('<div>')
            .css({padding: '4px'})
            .html(infoContent),
        $progress,
        $status = $('<div>').css({padding: '4px', paddingTop: '8px'}),
        that = Ox.Dialog({
            buttons: [
                $closeButton = Ox.Button({
                    id: 'close',
                    title: Ox._('Close')
                }).css({
                    float: 'left'
                }).bindEvent({
                    click: function() {
                        if ($closeButton.options('title') == Ox._('Cancel')) {
                            cancelled = true;
                            $info.html(infoContent);
                            $status.html('');
                            pandora.firefogg && pandora.firefogg.cancel();
                            pandora.$ui.upload && pandora.$ui.upload.abort();
                            $closeButton.options('title', Ox._('Close'));
                            if ($actionButton.options('title') == Ox._('Upload')) {
                                $closeButton.options('title', Ox._('Close'));
                                $actionButton.replaceWith($actionButton = hasFirefogg
                                    ? getFirefoggButton()
                                    : getSelectVideoButton()
                                );
                            }
                            $actionButton.show();
                        } else {
                            that.triggerEvent('close');
                        }
                    }
                }),
                $actionButton = hasFirefogg ? getFirefoggButton() : getSelectVideoButton()
            ],
            content: $content,
            height: 128,
            removeOnClose: true,
            width: 368,
            title: Ox._('Upload Video'),
        })
        .bindEvent({
            close: function(data) {
                if (pandora.firefogg) {
                    pandora.firefogg.cancel();
                    delete pandora.firefogg;
                }
                that.close();
            }
        });

    if (!pandora.site.itemRequiresVideo && !pandora.user.ui.item) {
        $info.html(Ox._(
            'You can only upload a video to an existing {0}.'
            + ' Please check if an entry for the {0}'
            + ' you want to upload exists, and create one otherwise.',
            [pandora.site.itemName.singular.toLowerCase()]
        ));
        $actionButton.hide();
    }
    $content.append($info);
    $content.append($status);

    function aspectratio(ratio) {
        var denominator, numerator;
        ratio = ratio.split(':');
        numerator = ratio[0];
        if (ratio.length == 2) {
            denominator = ratio[1];
        }
        if (Math.abs(numerator / denominator - 4/3) < 0.03) {
            numerator = 4;
            denominator = 3;
        } else if (Math.abs(numerator / denominator - 16/9) < 0.02) {
            numerator = 16;
            denominator = 9;
        }
        return {
            denominator: denominator,
            'float': numerator / denominator,
            numerator: numerator,
            ratio: numerator + ':' + denominator
        };
    }

    function resetProgress(status) {
        $progress = Ox.Progressbar({
            progress: 0,
            showPercent: true,
            showTime: true,
            width: 304
        });
        $status.html(status || '').append($progress);
    }

    function directUpload(file, info) {
        resetProgress();
        pandora.api.addMedia({
            filename: info.name,
            id: info.oshash,
            item: pandora.site.itemRequiresVideo
                ? undefined
                : pandora.user.ui.item
        }, function(result) {
            uploadStream(result.data.item, info, file);
        });
    }

    function encode() {
        var filename = pandora.firefogg.sourceFilename,
            info = JSON.parse(pandora.firefogg.sourceInfo),
            item,
            oshash = info.oshash;
        $info.html('<b>' + filename + '</b><br>' + Ox._('encoding...'));
        resetProgress();
        pandora.api.addMedia({
            filename: filename,
            id: oshash,
            info: info,
            item: pandora.site.itemRequiresVideo
                ? undefined
                : pandora.user.ui.item
        }, function(result) {
            item = result.data.item;
            pandora.firefogg.encode(
                getEncodingOptions(info),
                function(result, file) {
                    result = JSON.parse(result);
                    if (result.progress != 1) {
                        $status.html(
                            cancelled
                            ? Ox._('Encoding cancelled.')
                            : Ox._('Encoding failed.')
                        );
                        delete pandora.firefogg;
                        return;
                    }
                    setTimeout(function() {
                        $info.html(
                            '<b>' + filename + '</b><br>'
                            + Ox._('uploading...')
                        );
                        uploadStream(item, info, file);
                    });
                },
                Ox.throttle(function(progress) {
                    progress = JSON.parse(progress).progress || 0;
                    $progress.options({progress: progress});
                }, 1000)
            );
        });
    }

    function getInfo(file, callback) {
        Ox.oshash(file, function(oshash) {
            var $video = $('<video>'),
                url = URL.createObjectURL(file),
                info = {
                    audio: [],
                    direct: false,
                    oshash: oshash,
                    name: file.name,
                    size: file.size,
                    video: []
                };
            $video.one('error', function(event) {
                callback(info);
            });
            $video.one('loadedmetadata', function(event) {
                info.duration = $video[0].duration;
                if ($video[0].videoHeight > 0) {
                    info.video.push({
                        height: $video[0].videoHeight,
                        width: $video[0].videoWidth
                    });
                }
                if (info.duration) {
                    info.bitrate = info.size * 8 / info.duration / 1000;
                }
                var format = pandora.site.video.formats[0],
                    resolution = getResolution(info);
                info.direct = Ox.endsWith(info.name, format)
                    && info.video.length > 0
                    && info.video[0].height <= resolution;
                callback(info);
            });
            $video[0].src = url;
        });
    }

    function getResolution(info) {
        var height = info.video && info.video.length
                ? info.video[0].height
                : Ox.max(pandora.site.video.resolutions),
            resolution = Ox.sort(pandora.site.video.resolutions)
                .filter(function(resolution) {
                    return height <= resolution;
                })[0] || Ox.max(pandora.site.video.resolutions);
        return resolution;
    }

    function getFirefoggButton() {
        return Ox.Button({
            id: 'action',
            title: Ox._('Select Video')
        }).bindEvent({
            click: function() {
                if ($actionButton.options('title') == Ox._('Select Video')) {
                    if (selectVideo()) {
                        $closeButton.options('title', Ox._('Cancel'));
                        $actionButton.options('title', Ox._('Upload'));
                    }
                } else if ($actionButton.options('title') == Ox._('Cancel')) {
                    cancelled = true;
                    pandora.firefogg && pandora.firefogg.cancel();
                    pandora.$ui.upload && pandora.$ui.upload.abort();
                    $actionButton.options('title', Ox._('Select Video'));
                    $closeButton.show();
                } else {
                    $closeButton.options('title', Ox._('Cancel'));
                    $actionButton.hide().options('title', Ox._('Select Video'));
                    encode();
                }
            }
        })
    }

    function getSelectVideoButton() {
        return Ox.FileButton({
            id: 'action',
            title: Ox._('Select Video'),
            maxFiles: 1,
            width: 96
        }).css({
            float: 'left'
        }).bindEvent({
            click: function(data) {
                if (data.files.length) {
                    cancelled = false;
                    $actionButton.replaceWith($actionButton = Ox.Button({
                        id: 'action',
                        title: 'Upload',
                        disabled: true
                    }).css({
                        float: 'left'
                    }));
                    getInfo(data.files[0], function(info) {
                        $actionButton.options({
                            disabled: false
                        }).bindEvent({
                            click: function() {
                                $actionButton.replaceWith($actionButton = getSelectVideoButton().hide());
                                info.direct
                                    ? directUpload(data.files[0], info)
                                    : upload(data.files[0]);
                            }
                        });
                        $info.html(formatVideoInfo(info));
                        $status.html(
                            info.direct
                            ? Ox._(
                                'Your video will be used directly.'
                            )
                            : Ox._(
                                'Your video will be transcoded on the server.'
                            )
                        );
                    });
                    $closeButton.options('title', Ox._('Cancel'));
                }
            }
        });
    }

    function uploadStream(item, info, file) {
        var oshash = info.oshash,
            format = pandora.site.video.formats[0],
            resolution = getResolution(info);
        pandora.$ui.upload = pandora.chunkupload({
            file: file,
            url: '/api/upload/?profile=' + resolution + 'p.'
                + format + '&id=' + oshash,
            data: {}
        }).bindEvent({
            done: function(data) {
                if (data.progress == 1) {
                    Ox.Request.clearCache();
                    if (
                        pandora.user.ui.item == item
                        && pandora.user.ui.itemView == itemView
                    ) {
                        pandora.$ui.item.reload();
                    } else {
                        pandora.UI.set({
                            item: item,
                            itemView: itemView
                        });
                    }
                    delete pandora.firefogg;
                    that.close();
                } else {
                    $status.html(Ox._('Upload failed.'));
                    pandora.api.logError({
                        text: data.responseText,
                        url: '/' + item,
                        line: 1
                    });
                }
            },
            progress: function(data) {
                $progress.options({progress: data.progress || 0});
            },
        });
    }

    function upload(file) {
        resetProgress();
        $info.html(Ox._('Uploading {0}', [file.name]));
        Ox.oshash(file, function(oshash) {
            pandora.api.findMedia({
                query: {
                    conditions: [{key: 'oshash', value: oshash}]
                },
                keys: ['id', 'item', 'available']
            }, function(result) {
                if (
                    result.data.items.length === 0
                    || !result.data.items[0].available
                ) {
                    pandora.api.addMedia({
                        filename: file.name,
                        id: oshash,
                        item: pandora.site.itemRequiresVideo
                            ? undefined
                            : pandora.user.ui.item
                    }, function(result) {
                        var item = result.data.item;
                        pandora.$ui.upload = pandora.chunkupload({
                            file: file,
                            url: '/api/upload/direct/',
                            data: {
                                id: oshash
                            }
                        }).bindEvent({
                            done: function(data) {
                                if (data.progress == 1) {
                                    Ox.Request.clearCache();
                                    if (
                                        pandora.user.ui.item == item
                                        && pandora.user.ui.itemView == itemView
                                    ) {
                                        pandora.$ui.item.reload();
                                    } else {
                                        pandora.UI.set({
                                            item: item,
                                            itemView: itemView
                                        });
                                    }
                                    that.close();
                                } else {
                                    $status.html(
                                        cancelled
                                        ? Ox._('Upload cancelled.')
                                        : Ox._('Upload failed.')
                                    );
                                    !cancelled && pandora.api.logError({
                                        text: data.responseText,
                                        url: '/' + item,
                                        line: 1
                                    });
                                }
                            },
                            progress: function(data) {
                                $progress.options({
                                    progress: data.progress || 0
                                });
                            }
                        });
                    });
                } else {
                    pandora.UI.set({
                        item: result.data.items[0].item,
                        itemView: itemView
                    });
                    that.close();
                }
            });
        });
    }

    function getEncodingOptions(info) {
        var bpp = 0.17,
            dar,
            format = pandora.site.video.formats[0],
            fps,
            options = {},
            resolution = getResolution(info);
        if (format == 'webm') {
            options.videoCodec = 'vp8';
            options.audioCodec = 'vorbis';
        } else if (format == 'ogv') {
            options.videoCodec = 'theora';
            options.audioCodec = 'vorbis';
        }
        if (resolution == 720) {
            options.height = 720;
            options.samplerate = 48000;
            options.audioQuality = 5;
        } else if (resolution == 480) {
            options.height = 480;
            options.samplerate = 44100;
            options.audioQuality = 3;
            options.channels = 2;
        } else if (resolution == 432) {
            options.height = 432;
            options.samplerate = 44100;
            options.audioQuality = 3;
            options.channels = 2;
        } else if (resolution == 360) {
            options.height = 320;
            options.samplerate = 44100;
            options.audioQuality = 1;
            options.channels = 1;
        } else if (resolution == 288) {
            options.height = 288;
            options.samplerate = 44100;
            options.audioQuality = 0;
            options.channels = 1;
        } else if (resolution == 240) {
            options.height = 240;
            options.samplerate = 44100;
            options.audioQuality = 0;
            options.channels = 1;
        } else if (resolution == 144) {
            options.height = 144;
            options.samplerate = 22050;
            options.audioQuality = -1;
            options.audioBitrate = 22;
            options.channels = 1;
        } else if (resolution == 96) {
            options.height = 96;
            options.samplerate = 22050;
            options.audioQuality = -1;
            options.audioBitrate = 22;
            options.channels = 1;
        }
        if (info.video && info.video.length) {
            info.video.forEach(function(video) {
                if (!video.display_aspect_ratio) {
                    video.display_aspect_ratio = video.width + ':' + video.height;
                    video.pixel_aspect_ratio = '1:1';
                }
            });
            dar = aspectratio(info.video[0].display_aspect_ratio);
            fps = aspectratio(info.video[0].framerate).float;
            options.width = parseInt(dar.float * options.height, 10);
            options.width += options.width % 2;
            // interlaced hdv material is detected with double framerates
            if (fps == 50) {
                fps = options.framerate = 25;
            } else if (fps == 60) {
                fps = options.framerate = 30;
            }
            if (Math.abs(options.width/options.height - dar.float) < 0.02) {
                options.aspect = options.width + ':' + options.height;
            } else {
                options.aspect = dar.ratio;
            }
            options.videoBitrate = Math.round(
                options.height * options.width * fps * bpp / 1000
            );
            options.denoise = true; 
            options.deinterlace = true; 
        } else {
            options.noVideo = true;
        }
        if (info.audio) {
            if (options.cannels && info.audio[0].channels < options.channels) {
                delete options.channels;
            }
        } else {
            options.noAudio = true;
            delete options.samplerate;
            delete options.audioQuality;
            delete options.channels;
        }
        options.noUpscaling = true;
        if (
            (!info.video.length || (
                info.video[0].codec == options.videoCodec
                && info.video[0].height <= options.height
            ))
            && (!info.audio.length || info.audio[0].codec == options.audioCodec)
        ) {
            options = {passthrough: true};
        }
        return JSON.stringify(options);
    }

    function formatInfo(info) {
        var html = '<b>' + info.path + '</b><br>';
        if (info.video && info.video.length > 0) {
            var video = info.video[0];
            html += video.width + '×' + video.height  + ' (' + video.codec + ')';
        }
        if (
            info.video && info.video.length > 0
            && info.audio && info.audio.length > 0
        ) {
            html += ' / ';
        }
        if (info.audio && info.audio.length > 0) {
            var audio = info.audio[0];
            html += {1: 'mono', 2: 'stereo', 6: '5.1'}[audio.channels]
                + ' ' + audio.samplerate / 1000 + ' kHz (' + audio.codec + ')';
        }
        html += '<br>' + Ox.formatValue(info.size, 'B')
            + ' / ' + Ox.formatDuration(info.duration);
        return html; 
    }

    function formatVideoInfo(info) {
        var html = '<b>' + info.name + '</b><br>';
        if (info.video && info.video.length > 0) {
            html += info.video[0].width + '×' + info.video[0].height;
        }
        html += '<br>' + Ox.formatValue(info.size, 'B');
        if(info.duration) {
            html += ' / ' + Ox.formatDuration(info.duration);
        }
        return html; 
    }

    function selectVideo() {
        cancelled = false;
        pandora.firefogg = new Firefogg();
        pandora.firefogg.setFormat(pandora.site.video.formats[0]);
        if (pandora.firefogg.selectVideo()) {
            var info = JSON.parse(pandora.firefogg.sourceInfo),
                options = JSON.parse(getEncodingOptions(info)),
                oshash = info.oshash,
                filename = pandora.firefogg.sourceFilename,
                item;
            pandora.api.findMedia({
                query: {
                    conditions: [{key: 'oshash', value: oshash}]
                },
                keys: ['id', 'available']
            }, function(result) {
                if (
                    result.data.items.length === 0
                    || !result.data.items[0].available
                ) {
                    $info.html(formatInfo(info));
                    $status.html(
                        options.passthrough
                        ? Ox._('Your video will be uploaded directly.')
                        : Ox._('Your video will be transcoded before upload.')
                    );
                } else {
                    pandora.api.find({
                        query: {
                            conditions: [{key: 'oshash', value: oshash}]
                        },
                        keys: ['id']
                    }, function(result) {
                        pandora.UI.set({
                            item: result.data.items[0].id,
                            itemView: itemView
                        });
                        delete pandora.firefogg;
                        that.close();
                    });
                }
            });
            return true;
        }
        return false;
    }

    return that;

};
