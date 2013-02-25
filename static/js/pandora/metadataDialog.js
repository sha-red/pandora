'use strict';

pandora.ui.metadataDialog = function(data) {

    var keys = [
            'title', 'alternativeTitles',
            'director',
            'country', 'year', 'language', 'runtime', 'color', 'sound',
            'productionCompany',
            'producer', 'writer', 'cinematographer', 'editor', 'actor',
            'genre', 'keyword',
            'summary'
        ],
        updateKeys,
        dialogHeight = Math.round((window.innerHeight - 48) * 0.9),
        dialogWidth = Math.round(window.innerWidth * 0.9),
        formWidth = getFormWidth(),
        imdb,

        $confirmDialog,

        $label = {},
        $input = {},

        that = data.imdbId ? updateDialog() : idDialog();

    data.imdbId && getMetadata();

    function idDialog() {
        return Ox.Dialog({
            buttons: [
                Ox.Button({
                        id: 'close',
                        title: 'Close'
                    })
                    .bindEvent({
                        click: function() {
                            that.close();
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
            keyboard: {enter: 'close', escape: 'close'},
            removeOnClose: true,
            title: 'Update Metadata',
            width: 304
        });
    }
    
    function updateDialog() {
        return Ox.Dialog({
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
                Ox.Button({
                        disabled: true,
                        id: 'update',
                        title: 'Update'
                    })
                    .bindEvent({
                        click: function() {
                            $confirmDialog = confirmDialog().open();
                        }
                    })
            ],
            closeButton: true,
            content: Ox.Element().append(
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
                {},
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

    function getMetadata(id, callback) {
        pandora.api.getMetadata({id: data.imdbId, keys: keys}, function(result) {
            var $content = Ox.Element().css({padding: '12px', overflowY: 'auto'});
            if (result.data) {
                imdb = result.data;
                keys.forEach(function(key, index) {
                    var isEqual = Ox.isEqual(data[key], imdb[key]),
                        checked = isEqual ? [true, true]
                            : !Ox.isUndefined(data[key]) && Ox.isUndefined(imdb[key]) ? [true, false]
                            : [false, true];
                    if (index > 0) {
                        $('<div>')
                            .css({
                                height: '8px',
                                width: formWidth + 'px',
                            })
                            .appendTo($content);
                    }
                    $label[key] = Ox.Label({
                            title: getTitle(key),
                            width: formWidth
                        })
                        .css({display: 'inline-block', margin: '4px'})
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
                                                    otherValue = $otherInput.options('value');
                                                otherValue[0] = !otherValue[0];
                                                $otherInput.options({value: otherValue});
                                                updateKeys = getUpdateKeys();
                                                updateButton();
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
                            .appendTo($content);
                    });
                });
                that.options({content: $content})
                updateKeys = getUpdateKeys();
                updateButton();
            } else {
                // ...
            }
        });
    }

    function formatValue(key, value) {
        return !value ? ''
            : key == 'alternativeTitles' ? value.map(function(v) {
                return v[0];
            }).join('; ')
            : key == 'runtime' ? Ox.formatDuration(value, 0, 'short')
            : Ox.isArray(
                Ox.getObjectById(pandora.site.itemKeys, key).type
            ) ? value.join(', ')
            : value;
    }

    function getFormWidth() {
        return dialogWidth - 32 - Ox.UI.SCROLLBAR_SIZE;
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

    function updateButton() {
        that[updateKeys.length ? 'enableButton' : 'disableButton']('update');
    }

    function updateMetadata() {
        var edit = {id: data.id},
            type = Ox.getObjectById(pandora.site.itemKeys, key).type;
        updateKeys.forEach(function(key) {
            edit[key] = imdb[key] || (
                Ox.isArray(type) ? [] : ''
            );
        });
        that.disableButtons();
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