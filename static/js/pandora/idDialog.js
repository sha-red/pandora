'use strict';

pandora.ui.idDialog = function(data) {

    data = Ox.clone(data, true);

    var originalData = Ox.clone(data, true),

        dialogHeight = Math.round((window.innerHeight - 48) * 0.9),
        dialogWidth = Math.round(window.innerWidth * 0.9),
        formWidth = getFormWidth(),

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

        $checkboxGroup,

        that = Ox.Dialog({
                buttons: [
                    Ox.Button({
                            distabled: true,
                            id: 'switch',
                            title: 'Update Metadata...'
                        })
                        .bindEvent({
                            click: function() {
                                that.close();
                                pandora.$ui.metadataDialog = pandora.ui.metadataDialog(originalData).open();
                            }
                        }),
                    {},
                    Ox.Button({
                            id: 'cancel',
                            title: 'Don\'t Update IMDb ID'
                        })
                        .bindEvent({
                            click: function() {
                                that.close();
                            }
                        }),
                    Ox.Button({
                            disabled: true,
                            id: 'update',
                            title: 'Update IMDb ID'
                        })
                        .bindEvent({
                            click: updateId
                        })
                ],
                closeButton: true,
                content: $loading,
                height: dialogHeight,
                maximizeButton: true,
                minHeight: 256,
                minWidth: 512,
                removeOnClose: true,
                title: 'Update IMDb ID',
                width: dialogWidth
            })
            .bindEvent({
                resize: setSize
            });

    getIds();

    function getFormWidth() {
        return dialogWidth - 32 - Ox.UI.SCROLLBAR_SIZE;
    }

    function getIds() {
        var get = {};
        ['title', 'director', 'year'].forEach(function(key) {
            if (!Ox.isEmpty(data[key])) {
                get[key] = data[key];
            }
        });
        pandora.api.getIds(get, function(result) {
            var checkboxes = [],
                $content = Ox.Element()
                    .css({padding: '13px', overflowY: 'auto'});
            if (result.data.items) {
                ['title', 'director', 'year'].forEach(function(key) {
                    Ox.Input({
                            label: Ox.toTitleCase(key),
                            labelWidth: 128,
                            value: key == 'director'
                                ? data[key].join(', ')
                                : data[key],
                            width: formWidth
                        })
                        .css({display: 'inline-block', margin: '3px'})
                        .bindEvent({
                            change: function(data_) {
                                data[key] = key == 'director'
                                    ? data_.value.split(', ')
                                    : data_.value;
                                that.options({content: $loading});
                                getIds();
                            }
                        })
                        .appendTo($content);
                });
                $('<div>')
                    .css({width: '1px', height: '8px'})
                    .appendTo($content);
                if (!data.imdbId) {
                    checkboxes.push(
                        {id: 'none', title: getTitle(data)}
                    );
                }
                (
                    data.imdbId
                    && Ox.getIndexById(result.data.items, data.imdbId) == -1
                    ? pandora.api.findId
                    : Ox.noop
                )({id: data.imdbId}, function(result_) {
                    result_ && Ox.print(result_, '...', result_ && result_.data.items)
                    if (result_ && result_.data.items) {
                        checkboxes.push(
                            {id: data.imdbId, title: getTitle(result_.data.items[0])}
                        )
                    }
                    checkboxes = checkboxes.concat(
                        result.data.items.map(function(item) {
                            return {id: item.id, title: getTitle(item)};
                        })
                    );
                    $checkboxGroup = Ox.CheckboxGroup({
                            checkboxes: checkboxes,
                            type: 'list',
                            width: formWidth,
                            value: !data.imdbId ? 'none' : data.imdbId
                        })
                        .css({display: 'inline-block', margin: '3px'})
                        .bindEvent({
                            change: updateButton
                        })
                        .appendTo($content);
                    checkboxes.forEach(function(checkbox, index) {
                        if (checkbox.id != 'none') {
                            Ox.Button({
                                    title: 'arrowRight',
                                    tooltip: 'View on IMDb',
                                    type: 'image'
                                })
                                .css({
                                    position: 'absolute',
                                    top: 96 + index * 24 + 'px',
                                    right: 16 + Ox.UI.SCROLLBAR_SIZE + 'px'
                                })
                                .bindEvent({
                                    click: function() {
                                        window.open('/url=' + encodeURIComponent(
                                            'http://imdb.com/title/tt'
                                            + checkbox.id + '/combined'
                                        ), '_blank');
                                    }
                                })
                                .appendTo($content);
                        }
                    })
                    that.options({content: $content});
                    updateButton();
                });
            }
        });
    }

    function getTitle(data) {
        return Ox.filter([
            data.imdbId || data.id,
            data.title + (data.originalTitle ? ' (' + data.originalTitle + ')' : ''),
            data.director ? data.director.join(', ') : '',
            data.year
        ]).join(' &mdash; ');
    }

    function setSize() {
        dialogHeight = data.height;
        dialogWidth = data.width;
        formWidth = getFormWidth();
        $checkboxGroup.options({width: formWidth});
    }

    function updateButton() {
        that[
            $checkboxGroup.options('value') == data.imdbId || (
                $checkboxGroup.options('value') == 'none' && !data.imdbId
            ) ? 'disableButton' : 'enableButton'
        ]('update');
    }

    function updateId() {
        that.options({content: $loading}).disableButtons();
        pandora.api.edit({
            id: data.id,
            imdbId: $checkboxGroup.options('value')
        }, function(result) {
            that.close();
            pandora.updateItemContext();
            pandora.$ui.contentPanel.replaceElement(1,
                pandora.$ui.item = pandora.ui.item()
            );
        });
    }

    return that;

};