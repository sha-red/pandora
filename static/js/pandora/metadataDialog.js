'use strict';

pandora.ui.metadataDialog = function(data) {

    var keys = [
            'title', 'alternativeTitles', 'director',
            'country', 'year', 'language', 'runtime', 'color', 'sound',
            'productionCompany',
            'producer', 'writer', 'cinematographer', 'editor', 'composer', 'actor',
            'genre', 'keyword', 'summary'
        ],
        updateKeys,
        dialogHeight = Math.round((window.innerHeight - 48) * 0.9),
        dialogWidth = Math.round(window.innerWidth * 0.9),
        formWidth = getFormWidth(),
        imdb,

        $loading = Ox.Element().append(
            $('<img>')
                .attr({src: Ox.UI.getImageURL('symbolLoadingAnimated')})
                .css({
                    position: 'absolute',
                    width: '32px',
                    height: '32px',
                    left: 0,
                    top: 0,
                    right: 0,
                    bottom: 0,
                    margin: 'auto'
                })
            ),
        $confirmDialog,
        $selectAllButton,
        $selectNoneButton,

        $label = {},
        $input = {},

        that = data.imdbId ? updateDialog() : idDialog();

    data.imdbId && getMetadata();

    function idDialog() {
        return Ox.Dialog({
            buttons: [
                Ox.Button({
                        id: 'close',
                        title: 'Not Now'
                    })
                    .bindEvent({
                        click: function() {
                            that.close();
                        }
                    }),
                Ox.Button({
                        distabled: true,
                        id: 'update',
                        title: 'Update IMDb Id...'
                    })
                    .bindEvent({
                        click: function() {
                            that.close();
                            pandora.$ui.idDialog = pandora.ui.idDialog(data).open();
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
                            'To update the metadata for this '
                            + pandora.site.itemName.singular.toLowerCase()
                            + ', please enter its IMDb ID.'
                        )
                ),
            fixedSize: true,
            height: 128,
            keyboard: {enter: 'update', escape: 'close'},
            removeOnClose: true,
            title: 'Update Metadata',
            width: 304
        });
    }
    
    function updateDialog() {
        return Ox.Dialog({
            buttons: [
                Ox.Button({
                        distabled: true,
                        id: 'switch',
                        title: 'Update IMDb Id...'
                    })
                    .bindEvent({
                        click: function() {
                            that.close();
                            pandora.$ui.idDialog = pandora.ui.idDialog(data).open();
                        }
                    })
                {},
                Ox.Button({
                        id: 'cancel',
                        title: 'Don\'t Update'
                    })
                    .bindEvent({
                        click: function() {
                            that.close();
                        }
                    }),
                Ox.Button({
                        disabled: true,
                        id: 'update',
                        title: 'Update...'
                    })
                    .bindEvent({
                        click: function() {
                            $confirmDialog = confirmDialog().open();
                        }
                    })
            ],
            closeButton: true,
            content: $loading,
            height: dialogHeight,
            maximizeButton: true,
            minHeight: 256,
            minWidth: 512,
            removeOnClose: true,
            title: 'Update Metadata',
            width: dialogWidth
        })
        .bindEvent({
            resize: setSize
        });
    }

    function confirmDialog() {
        return Ox.Dialog({
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
                Ox.Button({
                        id: 'update',
                        title: 'Update'
                    })
                    .bindEvent({
                        click: function() {
                            $confirmDialog.close();
                            updateMetadata();
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
                            'Are you sure you want to update the value'
                            + (updateKeys.length == 1 ? '' : 's')
                            + ' for ' + updateKeys.map(function(key, index) {
                                return (
                                    index == 0 ? ''
                                    : index < updateKeys.length - 1 ? ', '
                                    : ' and '
                                ) + getTitle(key)
                            }).join('') + '?'
                        )
                ),
            fixedSize: true,
            height: 128,
            keyboard: {enter: 'update', escape: 'cancel'},
            removeOnClose: true,
            title: 'Update Metadata',
            width: 304
        });
    }

    function formatValue(key, value) {
        return !value ? ''
            : key == 'alternativeTitles' ? value.map(function(v) {
                return v[0];
            }).join('; ')
            : key == 'runtime' ? Math.round(value / 60) + ' min'
            : Ox.isArray(
                Ox.getObjectById(pandora.site.itemKeys, key).type
            ) ? value.join(', ')
            : value;
    }

    function getFormWidth() {
        return dialogWidth - 32 - Ox.UI.SCROLLBAR_SIZE;
    }

    function getMetadata() {
        pandora.api.getMetadata({id: data.imdbId, keys: keys.concat(['originalTitle'])}, function(result) {
            var $bar = Ox.Bar({size: 24}),
                $data = Ox.Element()
                    .css({padding: '12px', overflowY: 'auto'}),
                $content = Ox.SplitPanel({
                    elements: [
                        {element: $bar, size: 24},
                        {element: $data}
                    ],
                    orientation: 'vertical'
                });
            $selectNoneButton = Ox.Button({
                    title: 'Select No Updates',
                })
                .css({float: 'left', margin: '4px 2px 4px 4px'})
                .bindEvent({
                    click: function() {
                        selectAll(0)
                    }
                })
                .appendTo($bar),
            $selectAllButton = Ox.Button({
                    title: 'Select All Updates',
                })
                .css({float: 'left', margin: '4px 2px 4px 2px'})
                .bindEvent({
                    click: function() {
                        selectAll(1);
                    }
                })
                .appendTo($bar);
            if (result.data) {
                imdb = Ox.clone(result.data, true);
                if (imdb.originalTitle) {
                    imdb.alternativeTitles = [[imdb.title, []]].concat(imdb.alternativeTitles || []);
                    imdb.title = imdb.originalTitle;
                }
                keys.forEach(function(key, index) {
                    var isEqual = Ox.isEqual(data[key], imdb[key]) || (
                            Ox.isEmpty(data[key]) && Ox.isUndefined(imdb[key])
                        ),
                        checked = isEqual ? [true, true]
                            : Ox.isEmpty(data[key]) && !Ox.isUndefined(imdb[key]) ? [false, true]
                            : [true, false];
                    if (index > 0) {
                        $('<div>')
                            .css({
                                height: '8px',
                                width: formWidth + 'px',
                            })
                            .appendTo($data);
                    }
                    $label[key] = Ox.Label({
                            title: getTitle(key),
                            width: formWidth
                        })
                        .css({display: 'inline-block', margin: '4px'})
                        .appendTo($data);
                    $input[key] = [data[key], imdb[key]].map(function(v, i) {
                        return Ox.InputGroup({
                                inputs: [
                                    Ox.Checkbox({
                                            disabled: isEqual,
                                            value: checked[i],
                                            width: 16
                                        })
                                        .bindEvent({
                                            change: function() {
                                                toggle(key);
                                            }
                                        }),
                                    Ox.Input({
                                            value: formatValue(key, v),
                                            width: formWidth - 80
                                        })
                                        .bindEvent({
                                            submit: function() {
                                                // on submit, revert to initial value
                                                $input[key][i].options({value: [
                                                    $input[key][i].options('value')[0],
                                                    formatValue(key, v)
                                                ]});
                                            }
                                        })
                                ],
                                separators: [
                                    {title: ['Current', 'Update'][i], width: 64}
                                ]
                            })
                            .css({display: 'inline-block', margin: '4px'})
                            .appendTo($data);
                    });
                });
                that.options({content: $content});
                updateKeys = getUpdateKeys();
                updateButtons();
            } else {
                // ...
            }
        });
    }

    function getTitle(key) {
        return key == 'alternativeTitles' ? 'Alternative Titles'
            : Ox.getObjectById(pandora.site.itemKeys, key).title;
    }

    function getUpdateKeys() {
        return keys.filter(function(key) {
            return $input[key][0].options('inputs')[0].options('value') === false;
        });
    }

    function selectAll(i) {
        keys.forEach(function(key) {
            var $checkbox = $input[key][1].options('inputs')[0];
            if (!$checkbox.options('disabled')) {
                if (
                    (i == 0 && $checkbox.options('value'))
                    || (i == 1 && !$checkbox.options('value'))
                ) {
                    toggle(key);
                }
            }
        })
    }

    function setSize(data) {
        dialogHeight = data.height;
        dialogWidth = data.width;
        formWidth = getFormWidth();
        Ox.forEach($input, function($inputs, key) {
            $label[key].options({width: formWidth});
            $inputs.forEach(function($element) {
                $element.options('inputs')[1].options({width: formWidth - 80});
            });
        });
    }

    function toggle(key) {
        var $checkbox = $input[key][1].options('inputs')[0];
        if (!$checkbox.options('disabled')) {
            Ox.loop(2, function(i) {
                var value = $input[key][i].options('value');
                $input[key][i].options({
                    value: [!value[0], value[1]]
                });
            })
        }
        updateKeys = getUpdateKeys();
        updateButtons();
    }

    function updateButtons() {
        var checked = [0, 0];
        keys.forEach(function(key) {
            var $checkbox = $input[key][1].options('inputs')[0];
            if (!$checkbox.options('disabled')) {
                checked[$checkbox.options('value') ? 1 : 0]++;
            }
        });
        $selectNoneButton.options({disabled: checked[1] == 0});
        $selectAllButton.options({disabled: checked[0] == 0})
        that[updateKeys.length ? 'enableButton' : 'disableButton']('update');
    }

    function updateMetadata() {
        var edit = {id: data.id}, type;
        updateKeys.forEach(function(key) {
            type = key == 'alternativeTitles' ? []
                : Ox.getObjectById(pandora.site.itemKeys, key).type;
            edit[key] = imdb[key] || (
                Ox.isArray(type) ? [] : ''
            );
        });
        that.options({content: $loading}).disableButtons();
        pandora.api.edit(edit, function(result) {
            that.close();
            pandora.updateItemContext();
            pandora.$ui.contentPanel.replaceElement(1,
                pandora.$ui.item = pandora.ui.item()
            );
        });
    }

    return that;

};
