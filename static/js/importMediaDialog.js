'use strict';

pandora.ui.importMediaDialog = function(options) {
    var 
        $content = Ox.Element().css({margin: '16px'}),
        $url = Ox.Input({
            label: Ox._('Url'),
            labelWidth: 32,
            width: 384
        })
        .css({
            marginTop: '16px'
        })
        .bindEvent({
            change: function(data) {
                $info.empty();
                that.disableButton('import');
                if (data.value) {
                    $info.append(loadingIcon());
                    getInfo(data.value, function(items) {
                        $info.empty();
                        if (items.length) {
                            // FIXME: support playlists / multiple items
                            var info = items[0];
                            that.enableButton('import');
                            $info.append($('<img>').css({
                                'max-width': '128px',
                                margin: '4px',
                                float: 'left'
                            }).attr('src', info.thumbnail));
                            $info.append($('<div>').css({
                                'font-weight': 'bold'
                            }).html(info.title));
                            if (info.duration) {
                                $info.append($('<div>').html(Ox.formatDuration(info.duration)));
                            }
                            $info.append($('<div>').html(info.description));
                        } else {
                            $info.empty();
                            that.disableButton('import');
                        }
                    });
                }
            }
        })
        .appendTo($content),
        $info = Ox.Element()
            .css({margin: '8px'})
            .html('Enter a url from another site (like YouTube) to create a new item.')
            .appendTo($content),
        that = Ox.Dialog({
            buttons: [
                Ox.Button({
                    id: 'cancel',
                    title: Ox._('Cancel')
                })
                .bindEvent({
                    click: function() {
                        that.close();
                    }
                }),
                Ox.Button({
                    disabled: true,
                    id: 'import',
                    title: Ox._('Import')
                }).bindEvent({
                    click: importMedia
                })
            ],
            closeButton: true,
            content: $content,
            fixedSize: true,
            height: 176,
            keys: {
                escape: 'cancel'
            },
            removeOnClose: true,
            title: Ox._('Import Media'),
            width: 416
        });
    window.$info = $info;
    function getInfo(url, callback) {
        pandora.api.getMediaUrlInfo({url: url}, function(result) {
            callback(result.data.items);
        });
    }

    function addMedia(url, callback) {
        pandora.api.getMediaUrlInfo({url: url}, function(result) {
            result.data.items.forEach(function(info) {
                var infoKeys = [
                    "date", "description", "id", "tags",
                    "title", "uploader", "url"
                ];
                var values = Ox.map(pandora.site.importMetadata, function(value, key) {
                    var type = pandora.site.itemKeys[key].type;
                    infoKeys.forEach(function(infoKey) {
                        infoValue = info[infoKey];
                        if (key == 'year') {
                            infoValue = infoValue.substr(0, 4);
                        }
                        if (infoKey == 'tags' && Ox.isArray(type)) {
                            infoValue = infoValue.join(', ');
                        }
                        value = value.replace(
                            new RegExp('\{' + infoKey + '\}', 'g'), infoValue
                        );
                    });
                    if (Ox.isArray(type)) {
                        value = [value];
                    }
                    return value;
                });
                pandora.api.add({title: values.title || info.title}, function(result) {
                    var edit = Ox.extend(
                        Ox.filter(values, function(value, key) {
                            return key != 'title';
                        }),
                        {'id': result.data.id}
                    );
                    pandora.api.edit(edit, function(result) {
                        pandora.api.addMediaUrl({
                            url: info.url,
                            item: edit.id
                        }, function(result) {
                            if (result.data.taskId) {
                                pandora.wait(result.data.taskId, function(result) {
                                    callback(edit.id);
                                });
                            } else {
                                callback(edit.id);
                            }
                        });
                    });
                });
            });
        });
    };

    function importMedia() {
        var url = $url.value();
        $info.empty();
        $info.append(loadingIcon());
        that.disableButton('import');
        that.disableButton('cancel');
        addMedia(url, function(item) {
            if (item) {
                that.close();
                Ox.Request.clearCache();
                pandora.URL.push('/'+item+'/media');
            } else {
                $info.empty().html('Import failed');
                that.enableButton('cancel');
            }
        });
    }

    function loadingIcon() {
        return Ox.LoadingIcon().css({
            margin: 'auto',
            marginTop: '64px',
            width: '100%'
        }).start();
    }

    return that;
};
