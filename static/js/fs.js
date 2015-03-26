'use strict';

pandora.fs = (function() {
    var that = {
            local: {},
            downloads: {},
            enabled: false,
        },
        active,
        queue = [],
        requestedBytes = 100*1024*1024*1024; // 100GB

    if(window.webkitRequestFileSystem) {
        that.enabled = true;
        window.webkitRequestFileSystem(window.PERSISTENT, requestedBytes, function(fs) {
            that.fs = fs;
            that.fs.root.createReader().readEntries(function(results) {
                results.forEach(function(entry) {
                    if (entry.isFile) {
                        that.local[entry.name] = entry.toURL();
                    }
                });
            });
        }, function(e) {
            Ox.Log('FS', 'Error:', e);
        });
    }

    function cacheVideo(id, callback) {
        active = true;
        pandora.api.get({id: id, keys: ['parts']}, function(result) {
            var parts = result.data.parts, sizes = [];
            downloadPart(0);

            function downloadPart(part) {
                that.downloadVideoURL(id, pandora.user.ui.videoResolution, part + 1, false, function(result) {
                    result.progress = 1/parts * (part + result.progress);
                    that.downloads[id].progress = result.progress;
                    if (result.cancel) {
                        that.downloads[id].cancel = result.cancel;
                    }
                    if (result.total) {
                        sizes[part] = result.total;
                        that.downloads[id].size = Ox.sum(sizes);
                    }
                    if (result.url) {
                        if (part + 1 == parts) {
                            delete that.downloads[id];
                            active = false;
                            if (queue.length) {
                                var next = queue.shift();
                                setTimeout(function() {
                                    cacheVideo(next[0], next[1]);
                                });
                            }
                        } else {
                            downloadPart(part + 1);
                        }
                    }
                    callback && callback(result);
                });
            }
        });
    }

    that.cacheVideo = function(id, callback) {
        if (that.getVideoURL(id, pandora.user.ui.videoResolution, 1) || that.downloads[id]) {
            callback({progress: 1});
            return;
        } else {
            that.downloads = that.downloads || {};
            that.downloads[id] = {
                added: new Date(),
                cancel: function() {
                },
                id: id + '::' + pandora.user.ui.videoResolution,
                item: id,
                progress: 0,
                resolution: pandora.user.ui.videoResolution,
                size: 0
            };

            (active || queue.length)
                ? queue.push([id, callback])
                : cacheVideo(id, callback);
        }

    };

    that.getVideoName = function(id, resolution, part, track) {
        return pandora.getVideoURLName(id, resolution, part, track).replace('/', '::');
    };

    that.removeVideo = function(id, callback) {
        if (that.downloads && that.downloads[id] && that.downloads[id].cancel) {
            that.downloads[id].cancel();
            delete that.downloads[id];
            active = false;
            if (queue.length) {
                var next = queue.shift();
                setTimeout(function() {
                    cacheVideo(next[0], next[1]);
                });
            }
        } else {
            pandora.api.get({id: id, keys: ['parts']}, function(result) {
                var count = result.data.parts * pandora.site.video.resolutions.length, done = 0;
                Ox.range(result.data.parts).forEach(function(part) {
                    pandora.site.video.resolutions.forEach(function(resolution) {
                        var name = that.getVideoName(id, resolution, part + 1);
                        that.fs.root.getFile(name, {create: false}, function(fileEntry) {
                            // remove existing file
                            fileEntry.remove(function(e) {
                                if (that.local[name]) {
                                    delete that.local[name];
                                }
                            });
                            ++done == count && callback();
                        }, function() { // file not found
                            ++done == count && callback();
                        });
                    });
                });
            });
        }
    };

    that.storeBlob = function(blob, name, callback) {
        requestQuota(blob.size, function() {
            that.fs.root.getFile(name, {create: true}, function(fileEntry) {
                fileEntry.createWriter(function(fileWriter) {
                    fileWriter.onwriteend = function(e) {
                        that.local[name] = fileEntry.toURL();
                        callback({progress: 1, url: that.local[name]});
                    };
                    fileWriter.onerror = function(event) {
                        Ox.Log('FS', 'Write failed: ' + event.toString());
                        callback({progress: -1, event: event});
                    };
                    fileWriter.write(blob);
                }, function(event) {
                    callback({progress: -1, event: event});
                });
            }, function(event) {
                callback({progress: -1, event: event});
            });
        }, function(event) {
            callback({progress: -1, event: event});
        });

        function requestQuota(size, callback, error) {
            navigator.webkitPersistentStorage.queryUsageAndQuota(function(usage, quota) {
                if (quota - usage < size) {
                    navigator.webkitPersistentStorage.requestQuota(quota + requestedBytes, function(grantedBytes) {
                        callback();
                    }, error);
                } else {
                    callback();
                }
            });
        }
    };

    that.downloadVideoURL = function(id, resolution, part, track, callback) {
        //fixme: would be nice to download videos from subdomains,
        //       currently throws a cross domain error
        var name = that.getVideoName(id, resolution, part, track),
            url = '/' + pandora.getVideoURLName(id, resolution, part, track),
            blobs = [], blobSize = 5*1024*1024, total;
        Ox.Log('FS', 'start downloading', url);
        partialDownload(0);
        function partialDownload(offset) {
            var end = offset + blobSize;
            if (total) {
                end = Math.min(end, total);
            }
            Ox.Log('FS', 'download part', url, offset, end);
            var xhr = new XMLHttpRequest();
            xhr.open('GET', url, true);
            xhr.setRequestHeader('Range', 'bytes=' + offset + '-' + end);
            xhr.withCredentials = true;
            xhr.responseType = 'blob';
            xhr.timeout = 1000 * 60 * 5;
            xhr.addEventListener('progress', function(event) {
                if (event.lengthComputable) {
                    if (!total) {
                        var range = xhr.getResponseHeader('Content-Range');
                        total = Math.round(Ox.last(range.split('/')));
                    }
                    var progress = (event.loaded + offset) / total;
                    callback({
                        progress: progress,
                        request: xhr,
                        total: total,
                        cancel: function() {
                            xhr.abort();
                        }
                    });
                }
            });
            xhr.addEventListener('load', function() {
                blobs.push(xhr.response);
                if (offset + blobSize < total) {
                    partialDownload(offset + blobSize + 1);
                } else {
                    setTimeout(function() {
                        that.storeBlob(new Blob(blobs), name, callback);
                    });
                }
            });
            xhr.addEventListener('error', function (event) {
                Ox.print('partial download failed. retrying in 1 second');
                //fixme. make blobSize smaller if this fails?
                setTimeout(function() {
                    partialDownload(offset);
                }, 1000);
            });
            xhr.addEventListener('abort', function (event) {
                callback({progress: -1, event: event});
            });
            xhr.addEventListener('timeout', function (event) {
                Ox.print('partial download, timeout');
                setTimeout(function() {
                    partialDownload(offset);
                }, 1000);
            });
            xhr.send();
        }
    };

    that.getVideos = function(callback) {
        var files = {};
        that.fs.root.createReader().readEntries(function(results) {
            var n = 0;
            if (results.length) {
                results.forEach(function(fileEntry) {
                    fileEntry.getMetadata(function(meta) {
                        var item = fileEntry.name.split('::')[0],
                            resolution = parseInt(fileEntry.name.split('::')[1].split('p')[0]),
                            part = parseInt(fileEntry.name.split('::')[1].split('p')[1].split('.')[0]),
                            key = item + '::' + resolution;
                        if (!(that.downloads && that.downloads[item])) {
                            files[key] = Ox.extend(files[key] || {}, {
                                added: meta.modificationTime,
                                id: item + '::' + resolution,
                                item: item,
                                progress: 1,
                                resolution: resolution,
                                size: files[key] ? files[key].size + meta.size: meta.size
                            });
                        }
                        ++n == results.length && callback(Ox.values(files).concat(Ox.values(that.downloads)));
                    });
                });
            } else {
                callback(Ox.values(that.downloads));
            }
        });
    };

    that.getVideoURL = function(id, resolution, part, track) {
        var name = that.getVideoName(id, resolution, part, track);
        return that.local[name];
    };

    return that;
}());
