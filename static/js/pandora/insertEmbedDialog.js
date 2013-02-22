'use strict';

pandora.ui.insertEmbedDialog = function(callback) {

    var advanced = pandora.user.ui.showAdvancedEmbedOptions,
        dialogWidth = 416 - Ox.UI.SCROLLBAR_SIZE,
        dialogHeight = 416,
        formWidth = dialogWidth - 32,
        $element = {},

        $panel = Ox.TabPanel({
            content: function(id) {

                if (id == 'video') {

                    var $form = Ox.Element().attr({id: 'form'}),

                    $element.advanced = Ox.ButtonGroup({
                            buttons: [
                                {id: 'basic', title: 'Basic'},
                                {id: 'advanced', title: 'Advanced'}
                            ]
                            label: 'Show Advanced Options',
                            labelWidth: 128,
                            selectable: true,
                            value: pandora.user.ui.showAdvancedEmbedOptions
                                ? 'advanced' : 'basic',
                            width: formWidth
                        })
                        .bindEvent({
                            change: function(data) {
                                pandora.UI.set({
                                    showAdvancedEmbedOptions: data.value == 'advanced'
                                });
                                updateForm();
                            }
                        })
                        .appendTo($form);

                    space().appendTo($form);

                    $element.url = Ox.Input({
                            label: 'URL',
                            labelWidth: 128,
                            width: formWidth
                        })
                        .bindEvent({
                            change: function() {
                                parseURL(data.value);
                            }
                        })
                        .appendTo($form);

                    space().appendTo($form);

                    $element.protocol = Ox.Select({
                            items: [
                                {id: 'http', title: 'http'},
                                {id: 'https', title: 'https'}
                            ],
                            label: 'Protocol',
                            labelWidth: 128,
                            value: 'http://'
                            width: formWidth
                        })
                        .bindEvent({
                            change: formatURL
                        })
                        .addClass('advanced')
                        .appendTo($form);

                    $element.site = Ox.SelectInput({
                            inputWidth: 128,
                            items: [pandora.site.site]
                                .concat(pandora.site.sites)
                                .map(function(site) {
                                    return {id: site.url, title: site.name};
                                }),
                            label: 'Site',
                            labelWidth: 128,
                            max: 1,
                            min: 1,
                            value: site.url,
                            width: formWidth
                        })
                        .bindEvent({
                            change: formatURL
                        })
                        .addClass('advanced')
                        .appendTo($form);

                    $element.item = Ox.Input({
                            label: pandora.site.itemName.singular,
                            labelWidth: 128,
                            width: formWidth
                        })
                        .bindEvent({
                            change: formatURL
                        })
                        .appendTo($input);

                    $element.link = Ox.Select({
                            items: [
                                {id: 'default', title: 'Default'},
                                {id: 'player', title: 'Player'},
                                {id: 'editor', title: 'Editor'},
                                {id: 'timeline', title: 'Timeline'}
                            ],
                            label: 'Site',
                            labelWidth: 128,
                            value: 'default',
                            width: formWidth
                        })
                        .addClass('advanced')
                        .bindEvent({
                            change: formatURL
                        })
                        .appendTo($form);

                    $element.position = Ox.Input({
                            label: 'Position',
                            labelWidth: 128,
                            width: formWidth
                        })
                        .addClass('advanced')
                        .bindEvent({
                            change: function(data) {
                                // ...
                                formatURL();
                            }
                        })
                        .appendTo($form);

                    $element['in'] = Ox.Input({
                            label: 'In Point',
                            labelWidth: 128,
                            width: formWidth
                        })
                        .bindEvent({
                            change: function(data) {
                                // ...
                                formatURL();
                            }
                        })
                        .appendTo($form);

                    $element.out = Ox.Input({
                            label: 'Out Point',
                            labelWidth: 128,
                            width: formWidth
                        })
                        .bindEvent({
                            change: function(data) {
                                // ...
                                formatURL();
                            }
                        })
                        .appendTo($form);

                    $element.annotation = Ox.Input({
                            label: 'Annotation',
                            labelWidth: 128,
                            width: formWidth
                        })
                        .bindEvent({
                            change: formatURL
                        })
                        .appendTo($form);

                    space().appendTo($form);

                    $element.title = Ox.Input({
                            label: 'Title',
                            labelWidth: 128,
                            width: formWidth
                        })
                        .bindEvent({
                            change: formatURL
                        })
                        .addClass('advanced')
                        .appendTo($form);

                    $element.showTimeline = Ox.Checkbox({
                            label: 'Show Large Timeline',
                            labelWidth: 128
                            value: false,
                            width: formWidth
                        })
                        .bindEvent({
                            change: formatURL
                        })
                        .addClass('advanced')
                        .appendTo($form);

                    $element.timeline = Ox.Select({
                            items: [
                                {id: 'default', title: 'Default'}
                            ].concat(
                                pandora.site.timelines
                            ),
                            label: 'Timeline',
                            labelWidth: 128,
                            value: 'default',
                            width: formWidth
                        })
                        .bindEvent({
                            change: formatURL
                        })
                        .addClass('advanced')
                        .appendTo($form);

                    $element.showAnnotations = Ox.Checkbox({
                            label: 'Show Annotations',
                            labelWidth: 128
                            value: false,
                            width: formWidth
                        })
                        .bindEvent({
                            change: formatURL
                        })
                        .addClass('advanced')
                        .appendTo($form);

                    $element.showLayersLabel = Ox.Label({
                            title: 'Show Layers',
                            width: formWidth
                        })
                        .bindEvent({
                            change: formatURL
                        })
                        .addClass('advanced')
                        .appendTo($form);

                    $element.showLayers = Ox.CheckboxGroup({
                            checkboxes: pandora.site.layers.map(function(layer) {
                                return {id: layer.id, title: layer.title};
                            }),
                            max: pandora.site.layers.length,
                            min: 0,
                            type: 'list',
                            value: pandora.site.layers.map(function(layer) {
                                return layer.id;
                            })
                            width: formWidth
                        })
                        .bindEvent({
                            change: formatURL
                        })
                        .addClass('advanced')
                        .appendTo($form);

                    updateForm();

                    function formatURL() {
                        var data = $element.map(function($e) {
                            return $e.options('value');
                        });
                        $url.value(
                            data.protocol + '://'
                            + data.site + '/'
                            + data.item + '/'
                            + (data.link == 'default' ? '' : data.link + '/')
                            // ...
                            + (data.annotation || '')
                            + '#?embed=true'
                            + (data.title ? '&title=' + JSON.stringify(data.title) : '')
                            + (data.showTimeline ? '&showTimeline=true' : '')
                            + (data.timeline ? '&timeline=' + JSON.stringify(data.timeline) : '')
                            + (data.showAnnotations ? '&showAnnotations=true' : '')
                            + (data.showLayers.length ? '&showLayers=' + JSON.stringify(data.showLayers) : '')
                            + '&matchRatio=true'
                        );
                    }

                    function parseURL(url) {
                        var parsed = Ox.parseURL(url);
                        pandora.URL.parse(url, function(state) {
                            var data = {
                                protocol: parsed.protocol,
                                site: parsed.hostname,
                                item: state.item,
                                link: state.view, // FIXME: wrong, user-dependent?
                                // ...
                            };
                            state.hash.query.forEach(function(condition) {
                                data[condition.key] = condition.value;
                            });
                            // loop over elements so we can set missing ones to false?
                            Ox.forEach(data, function(value, key) {
                                $element[key].options({value: value});
                            });
                        });
                    }

                    function updateForm() {
                        $form.find('.advanced')[
                            pandora.user.ui.showAdvancedEmbedOptions
                            ? 'show' : 'hide'
                        ]();
                    }

                    return $form;

                }

            },
            tabs: [{
                {id: 'video', title: 'Video', selected: true},
                {id: 'map', title: 'Map', disabled: true},
                {id: 'calendar', title: 'Calendar', disabled: true}
            }]
        }),

        that = Ox.Dialog({
            buttons: [
                Ox.Button({
                        id: 'cancel',
                        title: 'Cancel',
                        width: 64
                    })
                    .bindEvent({
                        click: function() {
                            that.close();
                        }
                    }),
                Ox.Button({
                        id: 'insert',
                        title: 'Insert',
                        width: 64
                    })
                    .bindEvent({
                        click: function() {
                            callback($element.url.options('value'));
                            that.close();
                        }
                    })
            ],
            closeButton: true,
            content: self.$content,
            height: 416,
            keys: {enter: 'insert', escape: 'cancel'},
            title: 'Insert Embed',
            width: 416 + Ox.UI.SCROLLBAR_SIZE
        });

    function space() {
        return $('<div>').css({height: '16px', width: formWidth + 'px'});
    }

    return that;

};