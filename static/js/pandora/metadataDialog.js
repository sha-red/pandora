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
        updateKeys,
        dialogHeight = Math.round((window.innerHeight - 48) * 0.9),
        dialogWidth = Math.round(window.innerWidth * 0.9),
        formWidth = dialogWidth - 32,
        imdb,

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
                            title: 'Update'
                        })
                        .bindEvent({
                            click: function() {
                                updateMetadata();
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
                                        })
                                        .bindEvent({
                                            change: function(data) {
                                                var $otherInput = $input[key][1 - i],
                                                    otherValue = $otherInput.optons('value');
                                                otherValue[0] = !otherValue[0];
                                                $otherInput.options({value: otherValue});
                                                updateKeys = getUpdateKeys();
                                                updateButton();
                                            }
                                        }),
                                    Ox.Input({
                                            value: formatValue(v, itemKey.type)
                                            width: formWidth - 80
                                        })
                                        .bindEvent({
                                            submit: function() {
                                                // on submit, revert to initial value
                                                $input[key][i].options({value: [
                                                    $input[key][i].options('value')[0],
                                                    formatValue(v, itemKey.type)
                                                ]});
                                            }
                                        })
                                ],
                                separators: [
                                    {title: ['Current', 'Update'][i], width: 64}
                                ]
                            })
                            .appendTo($content);
                    });
                });
                updateKeys = getUpdateKeys();
                updateButton();
            } else {
                // ...
            }
        });
    }

    function formatValue(value, type) {
        return type == 'text' ? value.replace('/\\n/g', ' ') // FIXME: needed?
            : Ox.isArray(type) ? value.join(', ')
            : value
    }

    function getUpdateKeys() {
        return keys.filter(function(key) {
            return $input[key][0].options('value')[0] == false;
        });
    }

    function setSize() {
        // ...
    }

    function updateButton() {
        that[updateKeys.length ? 'disableButton' : 'enableButton']('update');
    }

    function updateMetadata() {
        var $confirmDialog = Ox.Dialog({
                buttons: [
                    Ox.Button({
                            id: 'cancel',
                            title: 'Don\'t Update'
                        })
                        .bindEvent({
                            click: function() {
                                $confirmDialog.close();
                            }
                        }),
                    {},
                    Ox.Button({
                            id: 'update',
                            title: 'Update'
                        })
                        .bindEvent({
                            click: function() {
                                Ox.print('UPDATE')
                            }
                        })
                ],
                content: Ox.Element()
                    .append(
                        $('<img>')
                            .attr({src: '/static/png/icon.png'})
                            .css({position: 'absolute', left: '16px', top: '16px', width: '64px', height: '64px'})
                    )
                    .append(
                        $('<div>')
                            .css({position: 'absolute', left: '96px', top: '16px', width: '192px'})
                            .html(
                                'To add or edit ' + layer + ', ' + (
                                    isEditor ? 'please sign up or sign in.'
                                        : 'just switch to the editor.'
                                )
                            )
                    ),
                fixedSize: true,
                height: 128,
                removeOnClose: true,
                title: 'Update Metadata',
                width: 304
            }).open()
        
    }

    return that;

};