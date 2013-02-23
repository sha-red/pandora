'use strict';

pandora.ui.insertEmbedDialog = function(callback) {

    var advanced = pandora.user.ui.showAdvancedEmbedOptions,
        dialogHeight = 416,
        dialogWidth = 416 + Ox.UI.SCROLLBAR_SIZE,
        formWidth = dialogWidth - 32 - Ox.UI.SCROLLBAR_SIZE,
        $input = {},

        $panel = Ox.TabPanel({
            content: function(id) {

                if (id == 'video') {

                    var $content = Ox.TabPanel({
                        content: function(id) {

                            pandora.UI.set({
                                showAdvancedEmbedOptions: id == 'advanced'
                            });

                            var $form = $('<div>')
                                .attr({id: 'form'})
                                .css({padding: '16px', overflowY: 'auto'});

                            $input.url = Ox.Input({
                                    label: 'URL',
                                    labelWidth: 128,
                                    width: formWidth
                                })
                                .bindEvent({
                                    change: function() {
                                        parseURL(data.value);
                                    }
                                })
                                .css({display: 'inline-block', margin: '4px 0'})
                                .appendTo($form);

                            space().appendTo($form);

                            $input.protocol = Ox.Select({
                                    items: [
                                        {id: 'http', title: 'http'},
                                        {id: 'https', title: 'https'}
                                    ],
                                    label: 'Protocol',
                                    labelWidth: 128,
                                    value: 'http',
                                    width: formWidth
                                })
                                .bindEvent({
                                    change: formatURL
                                })
                                .addClass('advanced')
                                .css({display: 'inline-block', margin: '4px 0'})
                                .appendTo($form);

                            $input.site = Ox.SelectInput({
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
                                    value: pandora.site.site.url,
                                    width: formWidth
                                })
                                .bindEvent({
                                    change: formatURL
                                })
                                .addClass('advanced')
                                .css({display: 'inline-block', margin: '4px 0'})
                                .appendTo($form);

                            $input.item = Ox.Input({
                                    label: pandora.site.itemName.singular,
                                    labelWidth: 128,
                                    width: formWidth
                                })
                                .css({display: 'inline-block', margin: '4px 0'})
                                .bindEvent({
                                    change: formatURL
                                })
                                .appendTo($form);

                            $input.link = Ox.Select({
                                    items: [
                                        {id: 'default', title: 'Default'},
                                        {id: 'player', title: 'Player'},
                                        {id: 'editor', title: 'Editor'},
                                        {id: 'timeline', title: 'Timeline'}
                                    ],
                                    label: 'Link',
                                    labelWidth: 128,
                                    value: 'default',
                                    width: formWidth
                                })
                                .addClass('advanced')
                                .bindEvent({
                                    change: formatURL
                                })
                                .appendTo($form);

                            $input.position = Ox.Input({
                                    label: 'Position',
                                    labelWidth: 128,
                                    width: formWidth
                                })
                                .addClass('advanced')
                                .css({display: 'inline-block', margin: '4px 0'})
                                .bindEvent({
                                    change: function(data) {
                                        $input.annotation.options({value: ''});
                                        formatURL();
                                    }
                                })
                                .appendTo($form);

                            $input['in'] = Ox.Input({
                                    label: 'In Point',
                                    labelWidth: 128,
                                    width: formWidth
                                })
                                .css({display: 'inline-block', margin: '4px 0'})
                                .bindEvent({
                                    change: function(data) {
                                        $input.annotation.options({value: ''});
                                        formatURL();
                                    }
                                })
                                .appendTo($form);

                            $input.out = Ox.Input({
                                    label: 'Out Point',
                                    labelWidth: 128,
                                    width: formWidth
                                })
                                .css({display: 'inline-block', margin: '4px 0'})
                                .bindEvent({
                                    change: function(data) {
                                        $input.annotation.options({value: ''});
                                        formatURL();
                                    }
                                })
                                .appendTo($form);

                            $input.annotation = Ox.Input({
                                    label: 'Annotation',
                                    labelWidth: 128,
                                    width: formWidth
                                })
                                .css({display: 'inline-block', margin: '4px 0'})
                                .bindEvent({
                                    change: function(data) {
                                        ['position', 'in', 'out'].forEach(function(key) {
                                            $input[key].options({value: ''});
                                        });
                                        formatURL();
                                    }
                                })
                                .appendTo($form);

                            space().appendTo($form);

                            $input.title = Ox.Input({
                                    label: 'Title',
                                    labelWidth: 128,
                                    width: formWidth
                                })
                                .addClass('advanced')
                                .css({display: 'inline-block', margin: '4px 0'})
                                .bindEvent({
                                    change: formatURL
                                })
                                .appendTo($form);

                            $input.showTimeline = Ox.Checkbox({
                                    label: 'Show Large Timeline',
                                    labelWidth: 128,
                                    value: false,
                                    width: formWidth
                                })
                                .addClass('advanced')
                                .css({display: 'inline-block', margin: '4px 0'})
                                .bindEvent({
                                    change: formatURL
                                })
                                .appendTo($form);

                            $input.timeline = Ox.Select({
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
                                .addClass('advanced')
                                .css({display: 'inline-block', margin: '4px 0'})
                                .bindEvent({
                                    change: formatURL
                                })
                                .appendTo($form);

                            $input.showAnnotations = Ox.Checkbox({
                                    label: 'Show Annotations',
                                    labelWidth: 128,
                                    value: false,
                                    width: formWidth
                                })
                                .addClass('advanced')
                                .css({display: 'inline-block', margin: '4px 0'})
                                .bindEvent({
                                    change: formatURL
                                })
                                .appendTo($form);

                            var $showLayersLabel = Ox.Label({
                                    title: 'Show Layers',
                                    width: formWidth
                                })
                                .addClass('advanced')
                                .css({display: 'inline-block', margin: '4px 0'})
                                .bindEvent({
                                    change: formatURL
                                })
                                .appendTo($form);

                            $input.showLayers = Ox.CheckboxGroup({
                                    checkboxes: pandora.site.layers.map(function(layer) {
                                        return {id: layer.id, title: layer.title};
                                    }),
                                    max: pandora.site.layers.length,
                                    min: 0,
                                    type: 'list',
                                    value: pandora.site.layers.map(function(layer) {
                                        return layer.id;
                                    }),
                                    width: formWidth - 128
                                })
                                .addClass('advanced')
                                .css({display: 'inline-block', margin: '4px 0 4px 128px'})
                                .bindEvent({
                                    change: formatURL
                                })
                                .appendTo($form);

                            updateForm();

                            function formatURL() {
                                var data = Ox.map($input, function($element) {
                                    return $element.options('value');
                                });
                                $input.url.value(
                                    data.protocol + '://'
                                    + data.site + '/'
                                    + data.item + '/'
                                    + (data.link == 'default' ? '' : data.link + '/')
                                    // ...
                                    + (data.annotation || '')
                                    + '#?embed=true'
                                    + (data.title ? '&title=' + JSON.stringify(data.title) : '')
                                    + (data.showTimeline ? '&showTimeline=true' : '')
                                    + (data.timeline != 'default' ? '&timeline=' + JSON.stringify(data.timeline) : '')
                                    + (data.showAnnotations ? '&showAnnotations=true' : '')
                                    + (data.showAnnotations && data.showLayers.length ? '&showLayers=' + JSON.stringify(data.showLayers) : '')
                                    + '&matchRatio=true'
                                );
                            }

                            function parseURL(url) {
                                var parsed = Ox.parseURL(url);
                                pandora.URL.parse(parsed.pathname + path.search + path.hash, function(state) {
                                    var query = {};
                                    state.hash.query.forEach(function(condition) {
                                        query[condition.key] = condition.value;
                                    });
                                    Ox.forEach({
                                        protocol: parsed.protocol,
                                        site: parsed.hostname,
                                        item: state.item || '',
                                        link: state.view || 'default', // FIXME: wrong, user-dependent
                                        position: Ox.isArray(state.span)
                                            ? Ox.formatDuration(state.span[0]) : '',
                                        'in': Ox.isArray(state.span)
                                            ? Ox.formatDuration(state.span[state.span.length - 2]) : '',
                                        out: Ox.isArray(state.span)
                                            ? Ox.formatDuration(state.span[state.span.length - 1]) : '',
                                        annotation: Ox.isString(state.span) ? state.span : '',
                                        title: hash.title || '',
                                        showTimeline: hash.showTimeline || false,
                                        timeline: hash.timeline || 'default',
                                        showAnnotations: hash.showAnnotations || false,
                                        showLayers: hash.showLayers || pandora.site.layers.map(function(layer) {
                                            return layer.id;
                                        })
                                    }, function(value, key) {
                                        $input[key].options({value: value});
                                    });
                                });
                            }

                            function updateForm() {
                                $form.find('.advanced')[
                                    pandora.user.ui.showAdvancedEmbedOptions
                                    ? 'show' : 'hide'
                                ]();
                                $input.timeline[
                                    $input.showTimeline.options('value')
                                    ? 'show' : 'hide'
                                ]();
                                $showLayersLabel[
                                    $input.showAnnotations.options('value')
                                    ? 'show' : 'hide'
                                ]();
                                $input.showLayers[
                                    $input.showAnnotations.options('value')
                                    ? 'show' : 'hide'
                                ]();
                            }

                            return $form;

                        },
                        tabs: [
                            {id: 'basic', title: 'Basic', selected: !advanced},
                            {id: 'advanced', title: 'Advanced', selected: advanced}
                        ]
                    });

                } else {
                    // ...
                }

                return $content;

            },
            tabs: [
                {id: 'video', title: 'Video', selected: true},
                {id: 'map', title: 'Map', disabled: true},
                {id: 'calendar', title: 'Calendar', disabled: true}
            ]
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
                            callback($input.url.options('value'));
                            that.close();
                        }
                    })
            ],
            closeButton: true,
            content: $panel,
            height: dialogHeight,
            keys: {enter: 'insert', escape: 'cancel'},
            removeOnClose: true,
            title: 'Insert Embed',
            width: dialogWidth
        });

    function space() {
        return $('<div>').css({height: '16px', width: formWidth + 'px'});
    }

    return that;

};