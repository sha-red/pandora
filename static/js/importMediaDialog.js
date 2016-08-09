'use strict';

pandora.ui.importMediaDialog = function(options) {

    var help = Ox._('Enter a URL from an external site (like YouTube or Vimeo).'),

        $content = Ox.Element().css({margin: '16px'}),

        $input = Ox.Input({
            label: Ox._('URL'),
            labelWidth: 128,
            width: 384
        })
        .bindEvent({
            change: submitURL
        }),

        $button = Ox.Button({
            title: Ox._('Preview'),
            width: 128
        })
        .bindEvent({
            click: submitURL
        }),

        $form = Ox.FormElementGroup({
            elements: [$input, $button]
        })
        .appendTo($content),

        $info = Ox.Element()
            .html(help)
            .appendTo($content),

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
            closeButton: true,
            content: $content,
            fixedSize: true,
            height: 288,
            keys: {
                escape: 'close'
            },
            removeOnClose: true,
            title: Ox._('Import Media'),
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
                    var type = Ox.getObjectById(pandora.site.itemKeys, key).type;
                    infoKeys.forEach(function(infoKey) {
                        var infoValue = info[infoKey];
                        if (key == 'year' && infoKey == 'date') {
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

    function getInfo(url, callback) {
        pandora.api.getMediaUrlInfo({url: url}, function(result) {
            callback(result.data.items);
        });
    }

    function importMedia() {
        var url = $input.value();
        $info.empty();
        $info.append(loadingIcon());
        that.disableButton('import');
        that.disableButton('close');
        addMedia(url, function(item) {
            if (item) {
                that.close();
                Ox.Request.clearCache();
                pandora.URL.push('/' + item + '/media');
            } else {
                $info.empty().html('Import failed.');
                that.enableButton('close');
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

    function submitURL() {
        var value = $input.value();
        if (value) {
            $info.empty();
            $info.append(loadingIcon());
            getInfo(value, function(items) {
                $info.empty();
                if (items.length) {
                    // FIXME: support playlists / multiple items
                    var info = items[0];
                    $info.append($('<img>').css({
                        position: 'absolute',
                        left: '16px',
                        top: '48px',
                        width: '248px'
                    }).attr('src', info.thumbnail));
                    $info.append($('<div>').addClass('OxText').css({
                        height: '192px',
                        overflow: 'hidden',
                        position: 'absolute',
                        right: '16px',
                        textOverflow: 'ellipsis',
                        top: '48px',
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
        }
    }

    return that;

};
