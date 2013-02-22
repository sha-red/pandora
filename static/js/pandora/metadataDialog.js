'use strict';

pandora.ui.metadataDialog = function(data) {

    var keys = [
            'title', 'alternativetitles',
            'director', 'country', 'year', 'language', 'runtime',
            'productioncompany',
            'producer', 'writer', 'cinematographer', 'editor', 'cast',
            'genre', 'keywords',
            'summary'
            // color, sound
        ],
        dialogHeight = Math.round((window.innerHeight - 48) * 0.9),
        dialogWidth = Math.round(window.innerWidth * 0.9),
        formWidth = dialogWidth - 32,

        $content = Ox.Element(),

        $input = {},

        that = Ox.Dialog({
                buttons: [
                    Ox.Button({
                            id: 'cancel',
                            title: 'Don\'t Update'
                        })
                        .bindEvent({
                            click: function() {
                                that.close();
                            }
                        }),
                    {},
                    Ox.Button({
                            id: 'update',
                            title: 'Update Metadata'
                        })
                        .bindEvent({
                            click: function() {
                                Ox.print('UPDATE');
                            }
                        })
                ],
                height: dialogHeight,
                closeButton: true,
                content: $content,
                maximizeButton: true,
                removeOnClose: true,
                title: 'Update Metadata',
                width: dialogWidth
            })
            .bindEvent({
                resize: setSize
            });

    function getMetadata(id, callback) {
        // ox.data getData()
        pandora.api.getMetadata({id: id, keys: keys}, function(results) {
            var imdb;
            if (result.data) {
                imdb = result.data;
                imdb.alternativetitles = imdb.alternativetitles.map(function(value) {
                    return value[0];
                });
                imdb.cast = imdb.cast.map(function(value) {
                    return value.actor;
                });
                keys.forEach(function(key, index) {
                    var isEqual = Ox.isEqual(data[key], imdb[key]),
                        checked = isEqual ? [true, true]
                            : !Ox.isEmpty(data) && Ox.isEmpty(imdb[key]) ? [true, false]
                            : [false, true],
                        itemKey = Ox.getObjectById(pandora.site.itemKeys, key);
                    if (index > 0) {
                        $('<div>')
                            .css({
                                height: '8px',
                                width: formWidth + 'px',
                            })
                            .appendTo($content);
                    }
                    Ox.Label({
                            title: itemKey.title,
                            width: formWidth
                        })
                        .appendTo($content);
                    $input[key] = [data[key], imdb[key]].map(function(v, i) {
                        return Ox.InputGroup({
                                inputs: [
                                    Ox.Checkbox({
                                        disabled: isEqual,
                                        value: checked[i],
                                        width: 16
                                    }),
                                    Ox.Input({
                                        value: itemKey.type == 'text' ? v.replace('/\\n/g', ' ')
                                            : Ox.isArray(itemKey.type) ? v.join(', ')
                                            : v
                                        width: formWidth - 32
                                    })
                                ],
                                separators: [
                                    {title: 'foo', width: 16}
                                ]
                            })
                            .appendTo($content);
                    });
                });
            }
        });
    }

    function setSize() {
        
    }

    return that;

};