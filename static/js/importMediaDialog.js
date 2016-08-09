'use strict';

pandora.ui.importMediaDialog = function(options) {

    var help = Ox._('You can import videos from external sites, like YouTube or Vimeo.'),

        $content = Ox.Element().css({margin: '16px'}),

        $button = Ox.Button({
            overlap: 'left',
            title: Ox._('Preview'),
            width: 128
        })
        .css({
            marginLeft: '-20px',
            paddingLeft: '20px',
            position: 'absolute',
            right: '16px',
            top: '16px'
        })
        .bindEvent({
            click: submitURL
        })
        .appendTo($content),

        $input = Ox.Input({
            label: Ox._('URL'),
            labelWidth: 64,
            width: 384
        })
        .css({
            left: '16px',
            position: 'absolute',
            top: '16px'
        })
        .bindEvent({
            change: submitURL
        })
        .appendTo($content),

        $info = Ox.Element()
            .css({
                left: '16px',
                position: 'absolute',
                top: '48px'
            })
            .html(help)
            .appendTo($content),

        $loading = Ox.LoadingScreen({
            width: 512,
            height: 224
        }),

        that = Ox.Dialog({
            buttons: [
                Ox.Button({
                    id: 'close',
                    title: Ox._('Close')
                })
                .bindEvent({
                    click: function() {
                        that.close();
                    }
                }),
                Ox.Button({
                    disabled: true,
                    id: 'import',
                    title: Ox._('Import Video')
                }).bindEvent({
                    click: importMedia
                })
            ],
            content: $content,
            fixedSize: true,
            height: 288,
            keys: {
                escape: 'close'
            },
            removeOnClose: true,
            title: Ox._('Import Video'),
            width: 544
        });

    function addMedia(url, callback) {
        pandora.api.getMediaUrlInfo({url: url}, function(result) {
            result.data.items.forEach(function(info) {
                var infoKeys = [
                    'date', 'description', 'id', 'tags',
                    'title', 'uploader', 'url'
                ];
                var values = Ox.map(pandora.site.importMetadata, function(value, key) {
                    var isArray = Ox.isArray(
                        Ox.getObjectById(pandora.site.itemKeys, key).type
                    );
                    if (isArray && value == '{tags}') {
                        value = info.tags;
                    } else {
                        infoKeys.forEach(function(infoKey) {
                            var infoValue = info[infoKey];
                            if (key == 'year' && infoKey == 'date') {
                                infoValue = infoValue.substr(0, 4);
                            }
                            if (infoKey == 'tags') {
                                infoValue = infoValue.join(', ');
                            }
                            value = value.replace(
                                new RegExp('\{' + infoKey + '\}', 'g'), infoValue
                            );
                        });
                        // For example: director -> uploader
                        if (isArray) {
                            value = [value];
                        }
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

    function getInfo(url, callback) {
        pandora.api.getMediaUrlInfo({url: url}, function(result) {
            callback(result.data.items);
        });
    }

    function importMedia() {
        var url = $input.value();
        $input.options({disabled: true});
        $button.options({disabled: true});
        $info.empty().append($loading.start());
        that.disableButton('close');
        that.disableButton('import');
        addMedia(url, function(item) {
            if (item) {
                that.close();
                Ox.Request.clearCache();
                pandora.URL.push('/' + item + '/media');
            } else {
                $input.options({disabled: false});
                $button.options({disabled: false});
                $info.empty().html(Ox._('Import failed. Please try again'));
                that.enableButton('close');
            }
        });
    }

    function submitURL() {
        var value = $input.value();
        if (value) {
            $input.options({disabled: true});
            $button.options({disabled: true});
            $info.empty().append($loading.start());
            that.disableButton('close');
            getInfo(value, function(items) {
                $input.options({disabled: false});
                $button.options({disabled: false});
                $loading.stop();
                $info.empty();
                if (items.length) {
                    // FIXME: support playlists / multiple items
                    var info = items[0];
                    $info.append($('<img>').css({
                        position: 'absolute',
                        width: '248px'
                    }).attr('src', info.thumbnail));
                    $info.append($('<div>').addClass('OxText').css({
                        height: '192px',
                        overflow: 'hidden',
                        position: 'absolute',
                        left: '264px',
                        textOverflow: 'ellipsis',
                        width: '248px'
                    }).html(
                        '<span style="font-weight: bold">' + info.title
                        + '</span><br/><br/>' + info.description
                    ));
                    that.enableButton('import');
                } else {
                    $info.html(help);
                }
            });
            that.enableButton('close');
        }
    }

    return that;

};
