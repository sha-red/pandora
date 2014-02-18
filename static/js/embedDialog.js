'use strict';

pandora.ui.embedDialog = function(/*[url, ]callback*/) {

    if (arguments.length == 1) {
        var url, callback = arguments[0];
    } else {
        var url = arguments[0], callback = arguments[1];
    }

    var api,
        defaults = {},
        duration,
        formWidth = 612,
        iframeHeight = Ox.last(pandora.site.video.resolutions),
        iframeWidth = Math.round(iframeHeight * pandora.site.video.previewRatio),
        listWidth = 128 + Ox.UI.SCROLLBAR_SIZE,
        labelWidth = 192,
        dialogWidth = listWidth + formWidth + 32 + Ox.UI.SCROLLBAR_SIZE,
        dialogHeight = 384,
        linkPlaceholder = '...',
        options = {},
        positionPlaceholder = '00:00:00.000',
        sites = [pandora.site.site].concat(pandora.site.sites).map(function(site) {
            return {id: site.url, title: site.url, https: site.https};
        }),
        ui = pandora.user.ui,
        videoRatio,

        views = [
            {
                id: 'info',
                title: Ox._('Info'),
                description: Ox._('Embed a Poster and Basic Metadata'),
                inputs: ['item']
            },
            {
                id: 'video',
                title: Ox._('Video'),
                description: Ox._('Embed a Clip or a Full Video'),
                inputs: [
                    'item', 'position', 'in', 'out', 'annotation', 'title',
                    'showTimeline', 'showAnnotations', 'matchRatio'
                ]
            },
            {
                id: 'timeline',
                title: Ox._('Timeline'),
                description: Ox._('Embed a Timeline'),
                inputs: ['item', 'position', 'title']
            },
            {
                id: 'list',
                title: Ox._('List'),
                description: Ox._('Embed a List Icon with Description'),
                inputs: ['list']
            },
            {
                id: 'grid',
                title: Ox._('Grid'),
                description: Ox._('Embed Movies as a Grid'),
                inputs: ['find', 'sort', 'title']
            },
            {
                id: 'map',
                title: Ox._('Map'),
                description: Ox._('Embed a Map View'),
                inputs: ['mapMode', 'item', 'find', 'sort', 'title']
            },
            {
                id: 'calendar',
                title: Ox._('Calendar'),
                description: Ox._('Embed a Calendar View'),
                inputs: ['mapMode', 'item', 'find', 'sort', 'title']
            },
            {
                id: 'document',
                title: Ox._('Document'),
                description: Ox._('Embed a Document'),
                inputs: ['document']
            },
            {
                id: 'edit',
                title: Ox._('Edit'),
                description: Ox._('Embed an Edited Video'),
                inputs: [
                    'edit', 'editMode', 'position',
                    'showTimeline', 'showAnnotations', 'matchRatio'
                ]
            },
            {
                id: 'text',
                title: Ox._('Text'),
                description: Ox._('Embed a Text Icon with Description'),
                inputs: ['text']
            }
        ].map(function(item, index) {
            return Ox.extend(item, {index: index});
        }),

        viewInputs = Ox.unique(Ox.flatten(views.map(function(view) {
            return view.inputs;
        }))),

        $list = Ox.TableList({
            columns: [
                {
                    id: 'title',
                    visible: true,
                    width: 128 - Ox.UI.SCROLLBAR_SIZE
                }
            ],
            items: views,
            max: 1,
            min: 1,
            scrollbarVisible: true,
            selected: ['info'],
            sort: [{key: 'index', operator: '+'}],
            unique: 'id'
        })
        .bindEvent({
            select: function() {
                updateHTML();
                updateForm();
            }
        }),

        $input = {
            advanced: Ox.Checkbox({
                    title: Ox._('Show Advanced Options'),
                    value: pandora.user.ui.showAdvancedEmbedOptions
                })
                .css({float: 'left', margin: '4px'})
                .bindEvent({
                    change: function(data) {
                        pandora.UI.set({showAdvancedEmbedOptions: data.value});
                        updateForm();
                    }
                })
        },

        $form = getForm(),

        $panel = Ox.SplitPanel({
            elements: [
                {element: $list, size: 128 + Ox.UI.SCROLLBAR_SIZE},
                {element: $form}
            ],
            orientation: 'horizontal'
        }),

        that = Ox.Dialog({
            buttons: [
                Ox.Button({
                        id: 'cancel',
                        title: Ox._('Cancel'),
                        width: 64
                    })
                    .bindEvent({
                        click: function() {
                            that.close();
                        }
                    }),
                Ox.Button({
                        id: 'insert',
                        title: Ox._('Insert'),
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
            fixedSize: true,
            height: dialogHeight,
            removeOnClose: true,
            title: Ox._('Embed'),
            width: dialogWidth
        });

    $($input.advanced.find('.OxButton')[0]).css({margin: 0});
    $(that.find('.OxBar')[1]).append($input.advanced);

    updateOptions();
    updateAPI(function() {
        updateDefaults(true);
    });

    function formatCondition(condition) {
        // See Ox.URL (constructCondition)
        var key = condition.key == '*' ? '' : condition.key,
            operator = condition.operator,
            value = (
                Ox.isArray(condition.value) ? condition.value : [condition.value]
            ).map(formatValue).join(',');
        if (!key) {
            operator = operator.replace('=', '');
        } else if (operator.indexOf('^') > -1) {
            operator = operator.replace('^', '=');
            value += '*';
        } else if (operator.indexOf('$') > -1) {
            operator = operator.replace('$', '=');
            value = '*' + value;
        }
        return [key, operator, value].join('');
    }

    function formatFind(find) {
        // See Ox.URL (constructFind)
        return find.conditions.map(function(condition) {
            return condition.conditions
                ? '(' + formatFind(condition) + ')'
                : formatCondition(condition);
        }).join(find.operator);
    }

    function formatHTML() {
        var type = $input.type.value();
        return type == 'link'
            ? '<a href="' + formatURL()
                + '">' + $input.link.value()
                + '</a>'
            : '<iframe src="' + formatURL()
                + '" width="' + $input.width.value()
                + '" height="' + $input.height.value()
                + '" frameborder="0" allowfullscreen></iframe>';
    }

    function formatURL() {
        var type = $input.type.value(),
            view = $list.options('selected')[0],
            data = Ox.map($input, function($element, key) {
                return Ox.contains(Ox.getObjectById(views, view).inputs, key)
                    && (
                        !Ox.contains(['map', 'calendar'], view)
                        || ($input.mapMode.value() == 'item' && key != 'find')
                        || ($input.mapMode.value() == 'find' && key != 'item')
                    )
                    && $element.value ? $element.value() : void 0;
            }),
            options = Ox.serialize({
                title: data.title || void 0,
                showTimeline: data.showTimeline || void 0,
                timeline: data.timeline || void 0,
                showAnnotations: data.showAnnotations || void 0,
                showLayers: data.showAnnotations && data.showLayers ? data.showLayers : void 0,
                matchRatio: Ox.contains(['video', 'edit'], view) ? data.matchRatio || void 0 : void 0,
                showInfo: Ox.contains(['list', 'text'], view) || (view == 'edit' && !!$input.editMode.value()) || void 0
            }, true),
            position = (
                data.position ? [data.position] : []
            ).concat(
                data['in'] || data.out ? [data['in'], data.out] : []
            ).join(',')
            + (data['annotation'] || '');
        return Ox.encodeHTMLEntities(
            (
                type == 'iframe'
                ? (pandora.site.site.https ? 'https' : 'http')
                    + '://' + pandora.site.site.url + '/'
                : '/'
            )
            + (
                Ox.contains(['info', 'video', 'timeline'], view) || data.mapMode == 'item' ? data.item
                : view == 'list' ? 'list==' + data.list
                : view == 'document' ? 'documents/' + data.document
                : view == 'edit' ? 'edits/' + data.edit
                : view == 'text' ? 'texts/' + data.text
                : ''
            )
            + (
                Ox.contains(['info', 'timeline'], view) ? '/' + view
                : view == 'video' ? '/player'
                : Ox.contains(['grid', 'map', 'calendar'], view) ? (data.mapMode == 'item' ? '/' : '') + view
                : ''
            )
            + (data.sort ? '/' + data.sort : '')
            + (data.find ? '/' + formatFind(data.find) : '')
            + (position ? '/' + position : '')
            + '#embed'
            + (options ? '?' + options : '')
        ).replace(/ /g, '_');
    }

    function formatValue(value) {
        // See Ox.URL (encodeValue)
        var chars = '*=&|()#%',
            ret = '';
        value.toString().split('').forEach(function(char) {
            var index = chars.indexOf(char);
            ret += index > -1
                ? '%' + char.charCodeAt(0).toString(16).toUpperCase()
                : char;
        });
        return ret.replace(/_/g, '%09')
            .replace(/\s/g, '_')
            .replace(/</g, '%0E')
            .replace(/>/g, '%0F');
    }

    function getForm() {

        var css = {display: 'inline-block', margin: '4px 0'},
            view = $list.options('selected')[0];

        $form = Ox.Element()
            .attr({id: 'form'})
            .css({padding: '16px', overflowY: 'auto'});

        $input.description = Ox.Label({
                textAlign: 'center',
                title: '',
                width: formWidth
            })
            .css(css)
            .appendTo($form);

        $input.type = Ox.ButtonGroup({
                buttons: [
                    {id: 'link', title: Ox._('Embed in Texts Section'), width: formWidth / 2, selected: true},
                    {id: 'iframe', title: Ox._('Embed in External Site'), width: formWidth / 2}
                ],
                selectable: true
            })
            .css(css)
            .bindEvent({
                change: function() {
                    updateForm();
                    updateHTML();
                }
            })
            .appendTo($form);

        $input.html = Ox.Input({
                height: 64,
                type: 'textarea',
                width: formWidth
            })
            .css(css)
            .bindEvent({
                change: function(data) {
                    // ...
                }
            })
            .appendTo($form);

        $input.link = Ox.Input({
                label: Ox._('Link Text'),
                labelWidth: labelWidth,
                width: formWidth,
                value: linkPlaceholder
            })
            .css(css)
            .bindEvent({
                change: function(data) {
                    $input.link.options({
                        value: Ox.sanitizeHTML(data.value).trim() || linkPlaceholder
                    });
                    updateHTML();
                }
            })
            .appendTo($form);

        $input.size = Ox.FormElementGroup({
                elements: [
                    Ox.Label({
                        overlap: 'right',
                        textAlign: 'right',
                        title: Ox._('Frame Size'),
                        width: labelWidth
                    }),
                    Ox.InputGroup({
                        inputs: [
                            $input.width = Ox.Input({id: 'width', placeholder: 'Width', value: iframeWidth, width: (formWidth - labelWidth - 16) / 2}),
                            $input.height = Ox.Input({id: 'height', placeholder: 'Height', value: iframeHeight, width: (formWidth - labelWidth - 16) / 2})
                        ],
                        separators: [{title: '×', width: 16}]
                    })
                ]
            })
            .css(css)
            .bindEvent({
                change: updateHTML
            })
            .appendTo($form);

        space().appendTo($form);

        $input.site = Ox.FormElementGroup({
                elements: [
                    Ox.Label({
                        overlap: 'right',
                        textAlign: 'right',
                        title: Ox._('Site'),
                        width: labelWidth
                    }),
                    $input.protocol = Ox.Select({
                        id: 'protocol',
                        items: [
                            {id: 'http', title: 'http://'},
                            {id: 'https', title: 'https://', disabled: !pandora.site.site.https}
                        ],
                        overlap: 'right',
                        value: pandora.site.site.https ? 'https' : 'http',
                        width: 80
                    }),
                    $input.hostname = Ox.SelectInput({
                        inputWidth: 192,
                        id: 'hostname',
                        items: sites.concat([{id: 'other', title: Ox._('Other...')}]),
                        max: 1,
                        min: 1,
                        placeholder: 'example.com',
                        value: pandora.site.site.url,
                        width: formWidth - labelWidth - 80
                    })
                ]
            })
            .addClass('advanced')
            .css(css)
            .bindEvent({
                change: function() {
                    updateHTML();
                    updateAPI(updateDefaults);
                }
            })
            .appendTo($form);

        $input.mapMode = Ox.Select({
                items: [
                    {id: 'item', title: Ox._(pandora.site.itemName.singular)},
                    {id: 'find', title: Ox._('Query')}
                ],
                label: ' ',
                labelWidth: labelWidth,
                width: formWidth
            })
            .css(css)
            .bindEvent({
                change: function() {
                    updateForm();
                    updateHTML();
                }
            })
            .appendTo($form);

        $input.item = Ox.Input({
                label: Ox._(pandora.site.itemName.singular),
                labelWidth: labelWidth,
                width: formWidth,
                value: ''
            })
            .css(css)
            .bindEvent({
                change: function() {
                    updateHTML();
                    validateId('item');
                }
            })
            .appendTo($form);

        $input.list = Ox.Input({
                label: Ox._('List'),
                labelWidth: labelWidth,
                width: formWidth,
                value: ''
            })
            .css(css)
            .bindEvent({
                change: function() {
                    updateHTML();
                    validateId('list');
                }
            })
            .appendTo($form);

        $input.document = Ox.Input({
                label: Ox._('Document'),
                labelWidth: labelWidth,
                width: formWidth,
                value: ''
            })
            .css(css)
            .bindEvent({
                change: function() {
                    updateHTML();
                    validateId('document');
                }
            })
            .appendTo($form);

        $input.edit = Ox.Input({
                label: Ox._('Edit{noun}'),
                labelWidth: labelWidth,
                width: formWidth,
                value: ''
            })
            .css(css)
            .bindEvent({
                change: function() {
                    updateHTML();
                    validateId('edit');
                }
            })
            .appendTo($form);

        $input.text = Ox.Input({
                label: Ox._('Text'),
                labelWidth: labelWidth,
                width: formWidth,
                value: ''
            })
            .css(css)
            .bindEvent({
                change: function() {
                    updateHTML();
                    validateId('text');
                }
            })
            .appendTo($form);

        $input.editMode = Ox.Select({
                items: [
                    {id: 'icon', title: Ox._('Icon and Description')},
                    {id: 'video', title: Ox._('Video')}
                ],
                label: 'Embed',
                labelWidth: labelWidth,
                width: formWidth
            })
            .css(css)
            .bindEvent({
                change: function() {
                    updateForm();
                    updateHTML();
                }
            })
            .appendTo($form);

        $input.position = Ox.Input({
                label: Ox._('Position'),
                labelWidth: labelWidth,
                placeholder: positionPlaceholder,
                width: formWidth
            })
            .css(css)
            .bindEvent({
                change: function(data) {
                    validatePoint('position');
                    updateHTML()
                }
            })
            .appendTo($form);

        $input['in'] = Ox.Input({
                label: Ox._('In Point'),
                labelWidth: labelWidth,
                placeholder: positionPlaceholder,
                width: formWidth
            })
            .css(css)
            .bindEvent({
                change: function(data) {
                    validatePoint('in');
                    updateHTML();
                }
            })
            .appendTo($form);

        $input.out = Ox.Input({
                label: Ox._('Out Point'),
                labelWidth: labelWidth,
                placeholder: positionPlaceholder,
                width: formWidth
            })
            .css(css)
            .bindEvent({
                change: function(data) {
                    validatePoint('out');
                    updateHTML();
                }
            })
            .appendTo($form);

        $input.annotation = Ox.Input({
                label: Ox._('Annotation'),
                labelWidth: labelWidth,
                width: formWidth
            })
            .css(css)
            .bindEvent({
                change: function(data) {
                    validatePoint('annotation');
                    updateHTML();
                }
            })
            .appendTo($form);

        $input.find = pandora.ui.filterForm({mode: 'embed'})
            .css(css)
            .bindEvent({
                change: updateHTML
            })
            .appendTo($form);

        $input.sort = Ox.Select({
                items: (
                    Ox.contains(['map', 'calendar'], view)
                    ? pandora.site.clipKeys.map(function(key) {
                        return Ox.extend(Ox.clone(key), {
                            title: Ox._('Clip {0}', [Ox._(key.title)])
                        });
                    })
                    : []
                ).concat(
                    pandora.site.sortKeys.map(function(key) {
                        return Ox.extend(Ox.clone(key), {
                            title: Ox._(key.title)
                        });
                    })
                ),
                label: Ox._('Sort by'),
                labelWidth: labelWidth,
                width: formWidth
            })
            .addClass('advanced')
            .css(css)
            .bindEvent({
                change: updateHTML
            })
            .appendTo($form);

        $input.title = Ox.Input({
                label: Ox._('Title'),
                labelWidth: labelWidth,
                width: formWidth,
                value: ''
            })
            .addClass('advanced')
            .css(css)
            .bindEvent({
                change: updateHTML
            })
            .appendTo($form);

        $input.showTimeline = Ox.Checkbox({
                label: Ox._('Show Timeline'),
                labelWidth: labelWidth,
                value: false,
                width: formWidth
            })
            .addClass('advanced')
            .css(css)
            .bindEvent({
                change: function() {
                    updateForm();
                    updateHTML();
                }
            })
            .appendTo($form);

        $input.timeline = Ox.Select({
                items: pandora.site.timelines,
                label: Ox._('Timeline'),
                labelWidth: labelWidth,
                value: pandora.site.user.ui.videoTimeline,
                width: formWidth
            })
            .addClass('advanced')
            .css(css)
            .bindEvent({
                change: updateHTML
            })
            .appendTo($form);

        $input.showAnnotations = Ox.Checkbox({
                label: Ox._('Show Annotations'),
                labelWidth: labelWidth,
                value: false,
                width: formWidth
            })
            .addClass('advanced')
            .css(css)
            .bindEvent({
                change: function() {
                    updateForm();
                    updateHTML();
                }
            })
            .appendTo($form);

        $input.showLayersLabel = Ox.Label({
                title: Ox._('Show Layers'),
                width: formWidth
            })
            .addClass('advanced')
            .css(css)
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
                width: formWidth - labelWidth
            })
            .addClass('advanced')
            .css({display: 'inline-block', margin: '4px 0 4px ' + labelWidth + 'px'})
            .bindEvent({
                change: updateHTML
            })
            .appendTo($form);

        $input.matchRatio = Ox.Checkbox({
                label: Ox._('Match Video Ratio'),
                labelWidth: labelWidth,
                value: true,
                width: formWidth
            })
            .addClass('advanced')
            .css(css)
            .bindEvent({
                change: updateHTML
            })
            .appendTo($form);

        updateHTML();
        updateForm();

        function space() {
            return $('<div>').css({height: '16px', width: formWidth + 'px'});
        }

        return $form;

    }

    function limitPoint(value, min, max) {
        if (Ox.typeOf(min) == 'number') {
            min = Ox.formatDuration(min)
        }
        if (Ox.typeOf(max) == 'number') {
            max = Ox.formatDuration(max)
        }
        return Ox.formatDuration(
            Ox.limit(
                Ox.parseDuration(value),
                Ox.parseDuration(min),
                Ox.parseDuration(max)
            )
        );
    }

    function parseURL(callback) {
        var parsed = Ox.parseURL(url),
            protocol = parsed.protocol.replace(/:$/, ''),
            hostname = parsed.hostname,
            isSameSite = hostname == $input.hostname.value();
        (isSameSite ? Ox.noop : updateAPI)(site, function() {
            pandora.URL.parse(parsed.pathname + parsed.search + parsed.hash, function(state) {
                var isSameItem = isSameSite && state.item == $input.item.value(),
                    query = {};
                if (state.hash && state.hash.query) {
                    state.hash.query.forEach(function(condition) {
                        query[condition.key] = condition.value;
                    });
                }
                (isSameItem ? Ox.noop : updateDuration)(function() {
                    if (duration) {
                        item = $input.item.value();
                    }
                    Ox.forEach({
                        protocol: protocol,
                        site: site,
                        item: item,
                        position: Ox.isArray(state.span) && state.span.length == 3
                            ? Ox.formatDuration(state.span[0]) : '',
                        'in': Ox.isArray(state.span)
                            ? Ox.formatDuration(state.span[state.span.length - 2]) : '',
                        out: Ox.isArray(state.span)
                            ? Ox.formatDuration(state.span[state.span.length - 1]) : '',
                        annotation: Ox.isString(state.span) ? state.span : '',
                        title: query.title || '',
                        showTimeline: query.showTimeline || false,
                        timeline: query.timeline || pandora.site.user.ui.videoTimeline,
                        showAnnotations: query.showAnnotations || false,
                        showLayers: query.showLayers || pandora.site.layers.map(function(layer) {
                            return layer.id;
                        })
                    }, function(value, key) {
                        $input[key].options({value: value});
                    });
                    callback();
                })
            });
        });
    }

    function updateAPI(callback) {
        api = Ox.API({
            url: $input.protocol.value() + '://' + $input.hostname.value() + '/api/'
        }, function() {
            api.getEmbedDefaults(function(result) {
                defaults = result.data;
                callback && callback();
            });
        });
    }

    function updateDefaults(keepValues) {
        $input.width.options({value: Math.round(defaults.videoResolution * defaults.videoRatio)});
        $input.height.options({value: defaults.videoResolution});
        ['item', 'document', 'list', 'edit', 'text'].forEach(function(key) {
            if (!keepValues || !$input[key].options('value')) {
                $input[key].options({value: defaults[key]});
            }
        });
        ['position', 'in', 'out'].forEach(function(key) {
            validatePoint(key);
        });
        updateHTML();
    }

    function updateForm() {
        var advanced = $input.advanced.value(),
            type = $input.type.value(),
            view = $list.options('selected')[0];
        $input.description.options({title: Ox.getObjectById(views, view).description});
        $input.link[type == 'link' ? 'show' : 'hide']();
        $input.size[type == 'iframe' ? 'show' : 'hide']();
        $input.site[advanced ? 'show' : 'hide']();
        viewInputs.forEach(function(key) {
            $input[key][
                Ox.contains(Ox.getObjectById(views, view).inputs, key)
                && (advanced || !$input[key].is('.advanced'))  ? 'show' : 'hide'
            ]();
        });
        $input.timeline[
            advanced && view == 'video' && $input.showTimeline.options('value') ? 'show' : 'hide'
        ]();
        $input.showLayersLabel[
            advanced && view == 'video' && $input.showAnnotations.options('value') ? 'show' : 'hide'
        ]();
        $input.showLayers[
            advanced && view == 'video' && $input.showAnnotations.options('value') ? 'show' : 'hide'
        ]();
        if (Ox.contains(['map', 'calendar'], view)) {
            $input.mapMode.options({
                label: Ox._('{0} for', [
                    Ox.getObjectById(views, $list.options('selected')[0]).title
                ])
            });
            $input.item[$input.mapMode.value() == 'item' ? 'show' : 'hide']();
            $input.find[$input.mapMode.value() == 'find' ? 'show' : 'hide']();
        } else if (view == 'edit') {
            [
                'position', 'showTimeline', 'timeline', 'showAnnotations',
                'showLayersLabel', 'showLayers', 'matchRatio'
            ].forEach(function(key) {
                $input[key][$input.editMode.value() == 'video' ? 'show' : 'hide'];
            });
        }
    }

    function updateHTML() {
        $input.html.options({value: formatHTML()});
    }

    function updateOptions() {
        if (ui.section == 'items') {
            if (!ui.item) {
                if (ui.listView == 'map') {
                    options.view = 'map';
                } else if (ui.listView == 'calendar') {
                    options.view = 'calendar';
                } else if (
                    ui.find.conditions.length == 1
                    && ui.find.conditions[0].key == 'list'
                    && ui.find.conditions[0].operator == '=='
                ) {
                    options.view = 'list';
                } else {
                    options.view = 'grid';
                }
            } else {
                if (ui.itemView == 'documents') {
                    options.view = 'document';
                } else if (Ox.contains(['player', 'editor'], ui.itemView)) {
                    options.view = 'video';
                } else if (ui.itemView == 'timeline') {
                    options.view = 'timeline';
                } else if (ui.itemView == 'map') {
                    options.view = 'map';
                } else if (ui.itemView == 'calendar') {
                    options.view = 'calendar';
                } else {
                    options.view = 'info';
                }
            }
        } else if (ui.section == 'edits') {
            options.view = 'edit';
        } else {
            options.view = 'text';
        }
        options.mapMode = !ui.item ? 'find' : 'item';
        options.item = ui.item;
        options.document = ui.documentsSelection[ui.item] && ui.documentsSelection[ui.item].length
            ? ui.documentsSelection[ui.item][0]
            : '';
        options.list = ui._list;
        options.edit = ui.edit;
        options.text = ui.text;
        options.find = ui.find;
        if (ui.item && ui.videoPoints[ui.item]) {
            if (ui.videoPoints[ui.item].annotation) {
                options.annotation = ui.videoPoints[ui.item].annotation;
            } else {
                ['position', 'in', 'out'].forEach(function(key) {
                    options[key] = ui.videoPoints[ui.item][key] || '';
                });
            }
            if (pandora.$ui[pandora.user.ui.videoView]) {
                duration = pandora.$ui[pandora.user.ui.videoView].options('duration');
            }
        }
        Ox.forEach(options, function(value, key) {
            if (key == 'view') {
                $list.options({selected: [value]});
            } else {
                $input[key].options({value: value});
            }
        });
        updateForm();
        updateHTML();
    }

    function validateId(key) {
        // key can be item, document, list, edit, text
        pandora.api['get' + (key == 'item' ? '' : Ox.toTitleCase(key))]({
            id: $input[key].value(),
            keys: key == 'item' ? ['aspectratio', 'duration']
                : key == 'edit' ? ['duration']
                : []
        }, function(result) {
            if (result.status == 200) {
                if (key == 'item' || key == 'edit') {
                    duration = result.data.duration;
                    ['position', 'in', 'out'].forEach(function(key) {
                        validatePoint(key);
                    });
                }
                if (key == 'item') {
                    videoRatio = result.data.aspectratio;
                    // ...
                }
            } else {
                $input[key].value(defaults[key]);
                updateHTML();
            }
        });
    }

    function validatePoint(key) {
        // key can be position, in, out, annotation
        var hasInAndOut = $input['in'].options('value') !== '',
            value = $input[key].value();
        if (value) {
            if (key == 'position') {
                $input.position.options({
                    value: limitPoint(
                        value,
                        hasInAndOut ? $input['in'].options('value') : 0,
                        hasInAndOut ? $input.out.options('value') : duration
                    )
                });
                $input.annotation.options({value: ''});
            } else if (key == 'in') {
                $input['in'].options({
                    value: limitPoint(value, 0, duration)
                });
                if ($input.out.options('value') === '') {
                    $input.out.options({value: Ox.formatDuration(duration)});
                } else if (
                    Ox.parseDuration($input.out.options('value'))
                    < Ox.parseDuration(value)
                ) {
                    $input.out.options({value: value});
                }
                $input.annotation.options({value: ''});
            } else if (key == 'out') {
                $input.out.options({
                     value: limitPoint(value, 0, duration)
                 });
                 if ($input['in'].options('value') === '') {
                     $input['in'].options({value: Ox.formatDuration(0)});
                 } else if (
                     Ox.parseDuration($input['in'].options('value'))
                     > Ox.parseDuration(value)
                 ) {
                     $input['in'].options({value: value});
                 }
                 $input.annotation.options({value: ''});
            } else if (key == 'annotation') {
                // TODO: validate
                ['position', 'in', 'out'].forEach(function(key) {
                    $input[key].options({value: ''});
                });
            }
        }
    }

    return that;

};
