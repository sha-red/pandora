'use strict';

pandora.ui.insertEmbedDialog = function(callback) {

    var advanced = pandora.user.ui.showAdvancedEmbedOptions,
        dialogHeight = 344,
        dialogWidth = 416 + Ox.UI.SCROLLBAR_SIZE,
        formWidth = dialogWidth - 32 - Ox.UI.SCROLLBAR_SIZE,

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
                content: Ox.Element(),
                height: dialogHeight,
                keys: {enter: 'insert', escape: 'cancel'},
                removeOnClose: true,
                title: 'Insert Embed',
                width: dialogWidth
            }),
        $input = {},

        api = pandora.api,
        duration,
        item,
        options = {
            keys: ['id', 'duration'],
            query: {conditions: [], operator: '&'},
            range: [0, 1],
            sort: [{key: 'id', operator: '+'}],
        },
        sites = [pandora.site.site].concat(pandora.site.sites).map(function(site) {
            return {id: site.url, title: site.url, https: site.https};
        });

    api.find(options, function(result) {

        duration = result.data.items[0].duration;
        item = result.data.items[0].id;

        var $panel = Ox.TabPanel({
                content: function(id) {
                    if (id == 'video') {
                        var $content = Ox.TabPanel({
                            content: function(id_) {
                                pandora.UI.set({
                                    showAdvancedEmbedOptions: id_ == 'advanced'
                                });
                                return getForm(id);
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
            });

        that.options({content: $panel});

    });

    function getForm(id) {

        var $form;

        if (id == 'video') {

            $form = $('<div>')
                .attr({id: 'form'})
                .css({padding: '16px', overflowY: 'auto'});

            $input.url = Ox.Input({
                    label: 'URL',
                    labelWidth: 128,
                    width: formWidth
                })
                .bindEvent({
                    change: function(data) {
                        parseURL(data.value);
                    }
                })
                .css({display: 'inline-block', margin: '4px 0'})
                .appendTo($form);

            space().appendTo($form);

            $input.protocol = Ox.Select({
                    items: [
                        {id: 'http', title: 'http'},
                        {id: 'https', title: 'https', disabled: !pandora.site.site.https}
                    ],
                    label: 'Protocol',
                    labelWidth: 128,
                    value: pandora.site.site.https ? 'https' : 'http',
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
                    items: sites.concat([{id: 'other', title: 'Other...'}]),
                    label: 'Site',
                    labelWidth: 128,
                    placeholder: 'example.com',
                    max: 1,
                    min: 1,
                    value: pandora.site.site.url,
                    width: formWidth
                })
                .bindEvent({
                    change: function(data) {
                        if (data.value) {
                            var site = Ox.getObjectById(sites, data.value);
                            $input.protocol[
                                !site || site.https ? 'enableItem' : 'disableItem'
                            ]('https').options({
                                value: !site || !site.https ? 'http' : 'https'
                            });
                            updateAPI(data.value, formatURL);
                        }
                    }
                })
                .addClass('advanced')
                .css({display: 'inline-block', margin: '4px 0'})
                .appendTo($form);

            $input.item = Ox.Input({
                    label: pandora.site.itemName.singular,
                    labelWidth: 128,
                    value: item,
                    width: formWidth
                })
                .css({display: 'inline-block', margin: '4px 0'})
                .bindEvent({
                    change: function(data) {
                        api.get({
                            id: data.value,
                            keys: ['duration']
                        }, function(result) {
                            if (result.data) {
                                duration = result.data.duration;
                            } else {
                                $input.item.options({value: item});
                            }
                        });
                        formatURL();
                    }
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
                .css({display: 'inline-block', margin: '4px 0'})
                .bindEvent({
                    change: formatURL
                })
                .appendTo($form);

            $input.position = Ox.Input({
                    label: 'Position',
                    labelWidth: 128,
                    placeholder: '00:00:00',
                    width: formWidth
                })
                .addClass('advanced')
                .css({display: 'inline-block', margin: '4px 0'})
                .bindEvent({
                    change: function(data) {
                        if ($input['in'].options('value')) {
                            $input.position.options({
                                value: Ox.formatDuration(
                                    Ox.limit(
                                        Ox.parseDuration($input.position.options('value')),
                                        Ox.parseDuration($input['in'].options('value')),
                                        Ox.parseDuration($input.out.options('value'))
                                    )
                                )
                            });
                        }
                        $input.annotation.options({value: ''});
                        formatURL();
                    }
                })
                .appendTo($form);

            $input['in'] = Ox.Input({
                    label: 'In Point',
                    labelWidth: 128,
                    placeholder: '00:00:00',
                    width: formWidth
                })
                .css({display: 'inline-block', margin: '4px 0'})
                .bindEvent({
                    change: function(data) {
                        var min = Ox.parseDuration(data.value) + 1;
                        if (
                            $input.out.options('value') === ''
                            || input.out.options('value') < min
                        ) {
                            $input.out.options({
                                value: Ox.formatDuration(min)
                            });
                        }
                        $input.annotation.options({value: ''});
                        formatURL();
                    }
                })
                .appendTo($form);

            $input.out = Ox.Input({
                    label: 'Out Point',
                    labelWidth: 128,
                    placeholder: '00:00:00',
                    width: formWidth
                })
                .css({display: 'inline-block', margin: '4px 0'})
                .bindEvent({
                    change: function(data) {
                        if (Ox.parseDuration(data.value) < 1) {
                            $input.out.options({value: 1});
                            data.value = 1
                        }
                        var max = Ox.parseDuration(data.value) - 1;
                        if (
                            !input['in'].options('value') === ''
                            || input['in'].options > max
                        ) {
                            $input.out.options({
                                value: Ox.formatDuration(max)
                            });
                        }
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

            formatURL();
            updateForm();

            pandora.$$$input = $input

        } else {

            // ...

        }

        function formatURL() {
            var data = Ox.map($input, function($element) {
                return $element.options('value');
            });
            $input.url.value(
                data.protocol + '://'
                + data.site + '/'
                + data.item + '/'
                + (data.link == 'default' ? '' : data.link + '/')
                + ([data.position] || []).concat(
                    data['in'] || data.out
                    ? [data['in'], data.out]
                    : []
                ).join(','),
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
            var parsed = Ox.parseURL(url),
                protocol = parsed.protocol.replace(/:$/, ''),
                site = parsed.hostname,
                isSameSite = site == $input.site.options('value');
            (isSameSite ? Ox.noop : updateAPI)(site, function() {
                pandora.URL.parse(parsed.pathname + parsed.search + parsed.hash, function(state) {
                    var isSameItem = isSameSite && state.item == item,
                        id = (isSameSite ? state.item : url.split('/')[3]) || item,
                        query = {};
                    if (state.hash) {
                        state.hash.query.forEach(function(condition) {
                            query[condition.key] = condition.value;
                        });
                    }
                    (isSameItem ? Ox.noop : api.get)({id: id, keys: ['duration']}, function(result) {
                        if (result && result.data) {
                            duration = result.data.duration;
                            item = id;
                        }
                        Ox.forEach({
                            protocol: protocol,
                            site: site,
                            item: item,
                            link: state.view || 'default', // FIXME: wrong, user-dependent
                            position: Ox.isArray(state.span)
                                ? Ox.formatDuration(state.span[0]) : '',
                            'in': Ox.isArray(state.span)
                                ? Ox.formatDuration(state.span[state.span.length - 2]) : '',
                            out: Ox.isArray(state.span)
                                ? Ox.formatDuration(state.span[state.span.length - 1]) : '',
                            annotation: Ox.isString(state.span) ? state.span : '',
                            title: query.title || '',
                            showTimeline: query.showTimeline || false,
                            timeline: query.timeline || 'default',
                            showAnnotations: query.showAnnotations || false,
                            showLayers: query.showLayers || pandora.site.layers.map(function(layer) {
                                return layer.id;
                            })
                        }, function(value, key) {
                            Ox.print('????', key, value);
                            $input[key].options({value: value});
                        });
                    });
                });
            });
        }

        function updateAPI(url, callback) {
            api = Ox.API({
                url: $input.protocol.options('value') + '://' + url + '/api/'
            }, function() {
                api.find(options, function(result) {
                    duration = result.data.items[0].duration;
                    item = result.data.items[0].id;
                    $input.item.options({value: item}); // fixme: move out
                    callback();
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

        function space() {
            return $('<div>').css({height: '16px', width: formWidth + 'px'});
        }

        return $form;

    }

    return that;

};