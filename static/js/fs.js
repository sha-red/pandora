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
                        if (Ox.startsWith(entry.name, 'partial::')) {
                            fileEntry.remove(function() {});
                        } else {
                            var name = entry.name.split('::'),
                                filename = Ox.last(name),
                                foldername = name[0] + "::" + filename.split('p')[0];
                            var key = foldername[0] + '/' + foldername;
                            createTree(key, function(folder) {
                                entry.moveTo(folder, filename, function(e) {
                                    var name = folder.name + '/' + e.name;
                                    that.local[name] = e.toURL();
                                    that.storeBlob(new Blob(['ok']), key + '/done', function() {});
                                }, function() {
                                    Ox.print('error moving', filename);
                                });
                            });
                        }
                    } else if (entry.isDirectory) {
                        entry.createReader().readEntries(function(prefixes) {
                            prefixes.forEach(function(prefix) {
                                prefix.isDirectory && prefix.createReader().readEntries(function(contents) {
                                    if (contents.filter(function(e) { return e.name == 'done'}).length) {
                                        contents.forEach(function(e) {
                                            if (e.name != 'done') {
                                                var name = prefix.name + '/' + e.name;
                                                that.local[name] = e.toURL();
                                            }
                                        });
                                    }
                                });
                            });
                        });
                    }
                });
            });
        }, function(e) {
            Ox.Log('FS', 'Error:', e);
        });
    }

    function createTree(folder, callback, root) {
        var parts = folder.split('/');
        root = root || that.fs.root;
        root.getDirectory(parts.shift(), {create: true}, function(folder) {
            if (parts.length) {
                createTree(parts.join('/'), callback, folder);
            } else {
                callback(folder);
            }
        }, function(error) {
            Ox.Log('FS', 'error', error);
            callback();
        });
    }

    function cacheVideo(id, callback) {
        var key = id[0] + '/' + id + '::' + pandora.user.ui.videoResolution;
        active = true;
        createTree(key, function(folder) {
            pandora.api.get({id: id, keys: ['parts']}, function(result) {
                var parts = result.data.parts, sizes = [];
                downloadPart(0);

                function downloadPart(part) {
                    var partName = key + '/' + pandora.user.ui.videoResolution
                        + 'p' + (part + 1) + '.' + pandora.user.videoFormat,
                        url = that.getVideoURL(id, pandora.user.ui.videoResolution, part + 1);
                    if (url) {
                        done({url: url});
                    } else {
                        that.downloadVideoURL(id, pandora.user.ui.videoResolution, part + 1, false, function(result) {
                            result.progress = 1/parts * (part + result.progress);
                            if (!that.downloads[id]) {
                                result.cancel && result.cancel();
                                return;
                            }
                            that.downloads[id].progress = result.progress;
                            if (result.cancel) {
                                that.downloads[id].cancel = result.cancel;
                            }
                            if (result.total) {
                                sizes[part] = result.total;
                                that.downloads[id].size = Ox.sum(sizes);
                            }
                            if (result.url) {
                                done(result);
                            } else {
                                callback && callback(result);
                            }
                        });
                    }
                    function done(result) {
                        that.local[partName] = result.url;
                        if (part + 1 == parts) {
                            //fixme
                            that.storeBlob(new Blob(['ok']), key + '/done', function() {
                                delete that.downloads[id];
                                active = false;
                                callback && callback(result);
                                if (queue.length) {
                                    var next = queue.shift();
                                    setTimeout(function() {
                                        cacheVideo(next[0], next[1]);
                                    }, 50);
                                }
                            });
                        } else {
                            setTimeout(function() {
                                downloadPart(part + 1);
                            });
                        }
                    }
                }
            });
        });
    }

    function renameFile(old, name, callback) {
        that.fs.root.getFile(old, {}, function(fileEntry) {
            fileEntry.moveTo(that.fs.root, name, callback, function(error) {
                Ox.Log('FS', 'failed to move', old, name);
                callback();
            });
        }, function() {
            Ox.Log('FS', 'could not find old file', old, name);
            callback();
        });
    }

    that.cacheVideo = function(id, callback) {
        if (that.getVideoURL(id, pandora.user.ui.videoResolution, 1) || that.downloads[id]) {
            callback && callback({progress: 1});
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
        return pandora.getVideoURLName(id, resolution, part, track).replace(id + '\/', id + '::' + resolution + '/');
    };

    that.removeVideo = function(id, callback) {
        if (that.downloads && that.downloads[id] && that.downloads[id].cancel) {
            that.downloads[id].cancel();
            delete that.downloads[id];
        }
        // remove legacy files too
        pandora.api.get({id: id, keys: ['parts']}, function(result) {
            var count = result.data.parts * pandora.site.video.resolutions.length, done = 0;
            Ox.range(result.data.parts).forEach(function(part) {
                pandora.site.video.resolutions.forEach(function(resolution) {
                    var name = pandora.getVideoURLName(id, resolution, part + 1).replace('/', '::');
                    that.fs.root.getFile(name, {create: false}, function(fileEntry) {
                        // remove existing file
                        fileEntry.remove(function(e) {
                            if (that.local[name]) {
                                delete that.local[name];
                            }
                        });
                    }, function() { // file not found
                    });
                    // remove partial file too
                    that.fs.root.getFile('partial::' + name, {create: false}, function(fileEntry) {
                        fileEntry.remove(function(e) {});
                    });
                });
            });
        });
        Ox.parallelForEach(pandora.site.video.resolutions,
            function(resolution, i, resolutions, cb) {
            var key = id + '::' + resolution;
            that.fs.root.getDirectory(key[0] + '/' + key, {create: false}, function(dir) {
                dir.removeRecursively(cb, cb);
                Object.keys(that.local).forEach(function(name) {
                    if (Ox.startsWith(name, key)) {
                        delete that.local[name];
                    }
                });
                cb();
            }, function() {
                cb();
            });
        }, function() {
            callback();
        });
    };

    that.storeBlob = function(blob, name, callback, append) {
        requestQuota(blob.size, function() {
            that.fs.root.getFile(name, {create: true}, function(fileEntry) {
                fileEntry.createWriter(function(fileWriter) {
                    append && fileWriter.seek(fileWriter.length);
                    fileWriter.onwriteend = function(e) {
                        callback({
                            progress: 1,
                            url: fileEntry.toURL()
                        });
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
            blobSize = 5*1024*1024, total;
        Ox.Log('FS', 'start downloading', url);
        getSize(url, function(size) {
            Ox.Log('FS', 'HEAD', url, size);
            total = size;
            that.fs.root.getFile(name, {create: false}, function(fileEntry) {
                fileEntry.getMetadata(function(meta) {
                    if (meta.size >= total) {
                        Ox.Log('FS', 'file exists, done', meta.size, total);
                        callback({
                            progress: 1,
                            total: total,
                            url: fileEntry.toURL()
                        })
                    } else {
                        Ox.Log('FS', url, 'resume from', meta.size);
                        partialDownload(meta.size);
                    }
                });
            }, function() {
                Ox.Log('FS', url, 'new download');
                partialDownload(0);
            });
        });
        function getSize(url, callback) {
            var xhr = new XMLHttpRequest();
            xhr.open('HEAD', url, true);
            xhr.addEventListener('load', function(event) {
                callback(event.total);
            });
            xhr.addEventListener('error', function (event) {
                setTimeout(function() {
                    getSize(url, callback);
                }, 1000);
            });
            xhr.addEventListener('abort', function (event) {
                callback({progress: -1, event: event});
            });
            xhr.addEventListener('timeout', function (event) {
                setTimeout(function() {
                    getSize(url, callback);
                }, 1000);
            });
            xhr.send();
        }
        function partialDownload(offset) {
            var end = offset + blobSize - 1;
            if (total) {
                end = Math.min(end, total - 1);
            }
            var range = 'bytes=' + offset + '-' + end;
            Ox.Log('FS', 'download part', url, offset, end, total, range);
            var xhr = new XMLHttpRequest();
            xhr.open('GET', url, true);
            xhr.setRequestHeader('Range', range);
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
                        total: total,
                        cancel: function() {
                            xhr.abort();
                            active = false;
                            if (queue.length) {
                                var next = queue.shift();
                                setTimeout(function() {
                                    cacheVideo(next[0], next[1]);
                                }, 50);
                            }
                        }
                    });
                }
            });
            xhr.addEventListener('load', function() {
                var blob = xhr.response;
                setTimeout(function() {
                    that.storeBlob(blob, name[0] + '/' + name, function(response) {
                        if (offset + blob.size < total) {
                            partialDownload(offset + blob.size);
                        } else {
                            callback(response);
                        }
                    }, true);
                });
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
            if (results.length) {
                Ox.parallelForEach(results, function(fileEntry, i, entries, next_entry) {
                    if (fileEntry.isFile) {
                        if (Ox.startsWith(fileEntry.name, 'partial::')) {
                            next_entry();
                        } else {
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
                                next_entry();
                            });
                        }
                    } else if (fileEntry.isDirectory) {
                        fileEntry.createReader().readEntries(function(prefixes) {
                            if (prefixes.length) {
                                Ox.parallelForEach(prefixes, function(prefix, i, prefixes, callback) {
                                    prefix.createReader().readEntries(function(contents) {
                                        if (contents.filter(function(f) { return f.name == 'done' }).length) {
                                            Ox.parallelMap(contents,
                                                function(e, i, col, callback) {
                                                    e.getMetadata(function(meta) {
                                                        callback(meta);
                                                    });
                                                }, function(meta) {
                                                    var item = prefix.name.split('::')[0],
                                                        resolution = parseInt(prefix.name.split('::')[1]),
                                                        key = item + '::' + resolution;
                                                    if (!(that.downloads && that.downloads[item])) {
                                                        files[key] = Ox.extend(files[key] || {}, {
                                                            added: Ox.min(meta.map(function(m) {
                                                                return m.modificationTime;
                                                            })),
                                                            id: item + '::' + resolution,
                                                            item: item,
                                                            progress: 1,
                                                            resolution: resolution,
                                                            size: Ox.sum(meta.map(function(m) {
                                                                return m.size;
                                                            }))
                                                        });
                                                    }
                                                    callback();
                                                }
                                            );
                                        } else {
                                            callback();
                                        }
                                    });
                                }, next_entry);
                            } else {
                                next_entry();
                            }
                        });
                    } else {
                        next_entry();
                    }
                }, function() {
                    callback(Ox.values(files).concat(Ox.values(that.downloads)));
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

    that._tree = function(root) {
        root = root || that.fs.root;
        root.createReader().readEntries(function(results) {
            results.forEach(function(entry) {
                if (entry.isFile) {
                    Ox.print(entry.fullPath);
                } else {
                    that._tree(entry);
                }
            });
        });
    };

    return that;
}());
