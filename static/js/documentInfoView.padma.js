'use strict';

pandora.ui.documentInfoView = function(data, isMixed) {
    isMixed = isMixed || {};

    var ui = pandora.user.ui,
        isMultiple = arguments.length == 2,
        canEdit = pandora.hasCapability('canEditMetadata') || isMultiple || data.editable,
        canRemove = pandora.hasCapability('canRemoveItems'),
        css = {
            marginTop: '4px',
            textAlign: 'justify'
        },
        html,
        descriptions = [],
        iconRatio = data.ratio,
        iconSize = isMultiple ? 0 : ui.infoIconSize,
        iconWidth = isMultiple ? 0 : iconRatio > 1 ? iconSize : Math.round(iconSize * iconRatio),
        iconHeight = iconRatio < 1 ? iconSize : Math.round(iconSize / iconRatio),
        iconLeft = iconSize == 256 ? Math.floor((iconSize - iconWidth) / 2) : 0,
        margin = 16,
        nameKeys = pandora.site.documentKeys.filter(function(key) {
            return key.sortType == 'person';
        }).map(function(key) {
            return key.id;
        }),
        listKeys = pandora.site.documentKeys.filter(function(key) {
            return Ox.isArray(key.type);
        }).map(function(key){
            return key.id;
        }),
        linkKeys = [
            'type', 'publisher', 'source', 'project'
        ],
        displayedKeys = [ // FIXME: can tis be a flag in the config?
            'title', 'notes', 'name', 'description', 'id',
            'user', 'rightslevel', 'timesaccessed',
            'extension', 'dimensions', 'size', 'matches',
            'created', 'modified', 'accessed',
            'random', 'entity',
            'content', 'translation'
        ].concat(pandora.site.documentKeys.filter(key => { return key.fulltext }).map(key => key.id)),
        statisticsWidth = 128,

        $bar = Ox.Bar({size: 16})
            .bindEvent({
                doubleclick: function(e) {
                    if ($(e.target).is('.OxBar')) {
                        $info.animate({scrollTop: 0}, 250);
                    }
                }
            }),

        $options = Ox.MenuButton({
                items: [
                    {
                        id: 'delete',
                        title: Ox._('Delete {0}...', [Ox._('Document')]),
                        disabled: !canRemove
                    }
                ],
                style: 'square',
                title: 'set',
                tooltip: Ox._('Options'),
                type: 'image',
            })
            .css({
                float: 'left',
                borderColor: 'rgba(0, 0, 0, 0)',
                background: 'rgba(0, 0, 0, 0)'
            })
            .bindEvent({
                click: function(data_) {
                    if (data_.id == 'delete') {
                        pandora.ui.deleteDocumentDialog(
                            [data],
                            function() {
                                Ox.Request.clearCache();
                                if (ui.document) {
                                    pandora.UI.set({document: ''});
                                } else {
                                    pandora.$ui.list.reloadList()
                                }
                            }
                        ).open();
                    }
                }
            })
            .appendTo($bar),

        $edit = Ox.MenuButton({
                items: [
                    {
                        id: 'insert',
                        title: Ox._('Insert HTML...'),
                        disabled: true
                    }
                ],
                style: 'square',
                title: 'edit',
                tooltip: Ox._('Edit'),
                type: 'image',
            })
            .css({
                float: 'right',
                borderColor: 'rgba(0, 0, 0, 0)',
                background: 'rgba(0, 0, 0, 0)'
            })
            .bindEvent({
                click: function(data) {
                    // ...
                }
            })
            .appendTo($bar),

        $info = Ox.Element().css({overflowY: 'auto'}),

        that = Ox.SplitPanel({
            elements: [
                {element: $bar, size: isMultiple ? 0 : 16},
                {element: $info}
            ],
            orientation: 'vertical'
        }),

        $left = Ox.Element()
            .css({
                position: 'absolute'
            })
            .appendTo($info);


        if (!isMultiple) {
            var $icon = Ox.Element({
                    element: '<img>',
                })
                .attr({
                    src: '/documents/' + data.id + '/512p.jpg?' + data.modified
                })
                .css({
                    position: 'absolute',
                    left: margin + iconLeft + 'px',
                    top: margin + 'px',
                    width: iconWidth + 'px',
                    height: iconHeight + 'px'
                })
                .bindEvent({
                    singleclick: toggleIconSize
                })
                .appendTo($left),

            $reflection = $('<div>')
                .addClass('OxReflection')
                .css({
                    position: 'absolute',
                    left: margin + 'px',
                    top: margin + iconHeight + 'px',
                    width: iconSize + 'px',
                    height: iconSize / 2 + 'px',
                    overflow: 'hidden'
                })
                .appendTo($left),

            $reflectionIcon = $('<img>')
                .attr({
                    src: '/documents/' + data.id + '/512p.jpg?' + data.modified
                })
                .css({
                    position: 'absolute',
                    left: iconLeft + 'px',
                    width: iconWidth + 'px',
                    height: iconHeight + 'px',
                })
                .appendTo($reflection),

            $reflectionGradient = $('<div>')
                .css({
                    position: 'absolute',
                    width: iconSize + 'px',
                    height: iconSize / 2 + 'px'
                })
                .appendTo($reflection);
        }

        var $data = $('<div>')
            .addClass('OxTextPage')
            .css({
                position: 'absolute',
                left: margin + 'px',
                top: margin + iconHeight + margin + 'px',
                width: iconSize + 'px',
            })
            .appendTo($left);

        var $text = Ox.Element()
            .addClass('OxTextPage')
            .css({
                position: 'absolute',
                left: margin + (iconSize == 256 ? 256 : iconWidth) + margin + 'px',
                top: margin + 'px',
                right: margin + statisticsWidth + margin + 'px',
            })
            .appendTo($info),

        $statistics = $('<div>')
            .css({
                position: 'absolute',
                width: statisticsWidth + 'px',
                top: margin + 'px',
                right: margin + 'px'
            })
            .appendTo($info),

        $capabilities;

    [$options, $edit].forEach(function($element) {
        $element.find('input').css({
            borderWidth: 0,
            borderRadius: 0,
            padding: '3px'
        });
    });

    listKeys.forEach(function(key) {
        if (Ox.isString(data[key])) {
            data[key] = [data[key]];
        }
    });

    if (!canEdit) {
        pandora.createLinks($info);
    }

    // Source & Project --------------------------------------------------------
    if (!isMultiple) {
        ['source', 'project'].forEach(function(key) {
            displayedKeys.push(key);
            if (canEdit || data[key]) {
                var $div = $('<div>')
                    .addClass('OxSelectable')
                    .css(css)
                    .css({margin: 0})
                    .appendTo($data);
                $('<span>')
                    .html(
                        formatKey({
                            category: 'categories',
                        }[key] || key).replace('</span>', '&nbsp;</span>')
                    )
                    .appendTo($div);
                Ox.EditableContent({
                        clickLink: pandora.clickLink,
                        format: function(value) {
                            return formatValue(key, value);
                        },
                        placeholder: formatLight(Ox._(isMixed[key] ? 'mixed' : 'unknown')),
                        editable: canEdit,
                        tooltip: canEdit ? pandora.getEditTooltip() : '',
                        value: listKeys.indexOf(key) >= 0
                              ? (data[key] || []).join(', ')
                              : data[key] || ''
                    })
                    .bindEvent({
                        submit: function(event) {
                            editMetadata(key, event.value);
                        }
                    })
                    .appendTo($div);
                /*
                if (canEdit || data[key + 'description']) {
                    $('<div>')
                        .addClass("InlineImages")
                        .append(
                            descriptions[key] = Ox.EditableContent({
                                clickLink: pandora.clickLink,
                                editable: canEdit,
                                placeholder: formatLight(Ox._('No {0} Description', [Ox._(Ox.toTitleCase(key))])),
                                tooltip: canEdit ? pandora.getEditTooltip() : '',
                                type: 'textarea',
                                value: data[key + 'description'] || ''
                            })
                            .css(css)
                            .bindEvent({
                                submit: function(event) {
                                    editMetadata(key + 'description', event.value);
                                }
                            })
                        ).css({
                            margin: '12px 0',
                        })
                        .appendTo($div);
                }
                */
            }
        });
    }

    // Title -------------------------------------------------------------------

    $('<div>')
        .css({
            marginTop: '-2px',
        })
        .append(
            Ox.EditableContent({
                    editable: canEdit,
                    placeholder: formatLight(Ox._( isMixed.title ? 'Mixed title' : 'Untitled')),
                    tooltip: canEdit ? pandora.getEditTooltip() : '',
                    value: data.title || ''
                })
                .css({
                    marginBottom: '-3px',
                    fontWeight: 'bold',
                    fontSize: '13px'
                })
                .bindEvent({
                    submit: function(event) {
                        editMetadata('title', event.value);
                    }
                })
        )
        .appendTo($text);

    // Director, Year and Country ----------------------------------------------

    renderGroup(['author', 'date', 'type']);
    renderGroup(['publisher', 'place', 'series', 'edition', 'language']);

    Ox.getObjectById(pandora.site.documentKeys, 'keywords') && renderGroup(['keywords'])
    if (isMultiple) {
        renderGroup(['source', 'project']);
    }

    // Render any remaing keys defined in config

    renderRemainingKeys();


    // Description -------------------------------------------------------------

    if (canEdit || data.description) {
        $('<div>')
            .addClass("InlineImages")
            .append(
                Ox.EditableContent({
                    clickLink: pandora.clickLink,
                    editable: canEdit,
                    maxHeight: Infinity,
                    placeholder: formatLight(Ox._('No Description')),
                    tooltip: canEdit ? pandora.getEditTooltip() : '',
                    type: 'textarea',
                    value: data.description || ''
                })
                .css(css)
                .css({
                    marginTop: '12px',
                    overflow: 'hidden'
                })
                .bindEvent({
                    submit: function(event) {
                        editMetadata('description', event.value);
                    }
                })
            )
            .appendTo($text);
    }

    ;['content', 'translation'].forEach(key => {
        if (canEdit || data[key]) {
            var item = Ox.getObjectById(pandora.site.documentKeys, key);
            $('<div>')
                .addClass("InlineImages")
                .append(
                    Ox.EditableContent({
                        clickLink: pandora.clickLink,
                        editable: canEdit,
                        maxHeight: Infinity,
                        placeholder: formatLight(Ox._('No {0}', [Ox._(Ox.toTitleCase(key))])),
                        tooltip: canEdit ? pandora.getEditTooltip() : '',
                        type: 'textarea',
                        value: data[key] || ''
                    })
                    .css(css)
                    .css({
                        marginTop: '12px',
                        overflow: 'hidden'
                    })
                    .bindEvent({
                        submit: function(event) {
                            editMetadata(key, event.value);
                        }
                    })
                )
                .appendTo($text);
        }
    })

    // Referenced --------------------------------------------------------------
    if (
        !isMultiple && (
        data.referenced.items.length
        || data.referenced.annotations.length
        || data.referenced.documents.length
        || data.referenced.entities.length  
    )) {
    
        var itemsById = {}
        data.referenced.items.forEach(function(item) {
            itemsById[item.id] = Ox.extend(item, {annotations: [], referenced: true});
        });
        data.referenced.annotations.forEach(function(annotation) {
            var itemId = annotation.id.split('/')[0];
            if (!itemsById[itemId]) {
                itemsById[itemId] = {
                    id: itemId,
                    title: annotation.title,
                    annotations: []
                };
            }
            itemsById[itemId].annotations = itemsById[itemId].annotations.concat(annotation);
        });
        var html = Ox.sortBy(Object.values(itemsById), 'title').map(function(item) {
            return (item.referenced ? '<a href="/' + item.id + '/documents">' : '')
                + item.title //Ox.encodeHTMLEntities(item.title)
                + (item.referenced ? '</a>' : '')
                + (item.annotations.length
                ? ' (' + Ox.sortBy(item.annotations, 'in').map(function(annotation) {
                    return '<a href="/' + annotation.id + '">'
                        + Ox.formatDuration(annotation.in) + '</a>'
                }).join(', ')
                + ')'
                : '')
        }).join(', ');
        html += data.referenced.documents.map(function(document) {
            return ', <a href="/documents/' + document.id + '/info">' + document.title + '</a>';
        }).join('');
        html += data.referenced.entities.map(function(entity) {
            return ', <a href="/entities/' + entity.id + '">' + entity.name + '</a>';
        }).join('');
    
        var $div = $('<div>')
            .css({marginTop: '12px'})
            .html(formatKey('Referenced', 'text') + html)
            .appendTo($text);

        pandora.createLinks($div);

    }


    // Extension, Dimensions, Size ---------------------------------------------

    ['extension', 'dimensions', 'size'].forEach(function(key) {
        $('<div>')
            .css({marginBottom: '4px'})
            .append(formatKey(key, 'statistics'))
            .append(
                Ox.Theme.formatColor(null, 'gradient')
                    .css({textAlign: 'right'})
                    .html(formatValue(key, data[key]))
            )
            .appendTo($statistics);
    });

    // Rights Level ------------------------------------------------------------

    var $rightsLevel = $('<div>');
    $('<div>')
        .css({marginBottom: '4px'})
        .append(formatKey('Rights Level', 'statistics'))
        .append($rightsLevel)
        .appendTo($statistics);
    renderRightsLevel();

    // User and Groups ---------------------------------------------------------
    if (!isMultiple) {

    ['user', 'groups'].forEach(function(key) {
        var $input;
        (canEdit || data[key] && data[key].length) && $('<div>')
            .css({marginBottom: '4px'})
            .append(formatKey(key, 'statistics'))
            .append(
                $('<div>')
                    .css({margin: '2px 0 0 -1px'}) // fixme: weird
                    .append(
                        $input = Ox.Editable({
                            placeholder: key == 'groups' ? formatLight(Ox._('No Groups')) : '',
                            editable: key == 'user' && canEdit,
                            tooltip: canEdit ? pandora.getEditTooltip() : '',
                            value: key == 'user' ? data[key] : data[key].join(', ')
                        })
                        .bindEvent(Ox.extend({
                            submit: function(event) {
                                editMetadata(key, event.value);
                            }
                        }, key == 'groups' ? {
                            doubleclick: canEdit ? function() {
                                setTimeout(function() {
                                    if (window.getSelection) {
                                        window.getSelection().removeAllRanges();
                                    } else if (document.selection) {
                                        document.selection.empty();
                                    }
                                });
                                pandora.$ui.groupsDialog = pandora.ui.groupsDialog({
                                        id: data.id,
                                        name: data.title,
                                        type: 'document'
                                    })
                                    .bindEvent({
                                        groups: function(data) {
                                            $input.options({
                                                value: data.groups.join(', ')
                                            });
                                        }
                                    })
                                    .open();
                            } : function() {}
                        } : {}))
                    )
            )
            .appendTo($statistics);
    });

    }

    // Created and Modified ----------------------------------------------------
    if (!isMultiple && canEdit) {
        ['created', 'modified'].forEach(function(key) {
            $('<div>')
                .css({marginBottom: '4px'})
                .append(formatKey(key, 'statistics'))
                .append(
                    $('<div>').html(Ox.formatDate(data[key], '%B %e, %Y'))
                )
                .appendTo($statistics);
        });
    }

    // Notes --------------------------------------------------------------------

    if (canEdit) {
        $('<div>')
            .css({marginBottom: '4px'})
            .append(
                formatKey('Notes', 'statistics').options({
                    tooltip: Ox._('Only {0} can see and edit these comments', [
                        Object.keys(pandora.site.capabilities.canEditMetadata).map(function(level, i) {
                            return (
                                i == 0 ? ''
                                : i < Ox.len(pandora.site.capabilities.canEditMetadata) - 1 ? ', '
                                : ' ' + Ox._('and') + ' '
                            ) + Ox.toTitleCase(level)
                        }).join('')])
                })
            )
            .append(
                Ox.EditableContent({
                        height: 128,
                        placeholder: formatLight(Ox._(isMixed.notes ? 'Mixed notes' : 'No notes')),
                        tooltip: pandora.getEditTooltip(),
                        type: 'textarea',
                        value: data.notes || '',
                        width: 128
                    })
                    .bindEvent({
                        submit: function(event) {
                            editMetadata('notes', event.value);
                        }
                    })
            )
            .appendTo($statistics);
    }

    function editMetadata(key, value) {
        if (value != data[key]) {
            var edit = {
                id: isMultiple ? ui.collectionSelection : data.id,
            };
            if (key == 'title') {
                edit[key] = value;
            } else if (listKeys.indexOf(key) >= 0) {
                edit[key] = value ? value.split(', ') : [];
            } else {
                edit[key] = value ? value : null;
            }
            pandora.api.editDocument(edit, function(result) {
                if (!isMultiple) {
                    var src;
                    data[key] = result.data[key];
                    Ox.Request.clearCache(); // fixme: too much? can change filter/list etc
                    if (result.data.id != data.id) {
                        pandora.UI.set({document: result.data.id});
                        pandora.$ui.browser.value(data.id, 'id', result.data.id);
                    }
                    //pandora.updateItemContext();
                    //pandora.$ui.browser.value(result.data.id, key, result.data[key]);
                    pandora.$ui.itemTitle
                        .options({title: '<b>' + (pandora.getDocumentTitle(result.data)) + '</b>'});
                }
                that.triggerEvent('change', Ox.extend({}, key, value));
            });
        }
    }

    function formatKey(key, mode) {
        var item = Ox.getObjectById(pandora.site.documentKeys, key);
        key = Ox._(item ? item.title : key);
        mode = mode || 'text';
        return mode == 'text'
            ? '<span style="font-weight: bold">' + Ox.toTitleCase(key) + ':</span> '
            : mode == 'description'
            ? Ox.toTitleCase(key)
            : Ox.Element()
                .css({marginBottom: '4px', fontWeight: 'bold'})
                .html(Ox.toTitleCase(key)
                .replace(' Per ', ' per '));
    }

    function formatLight(str) {
        return '<span class="OxLight">' + str + '</span>';
    }

    function formatLink(value, key) {
        return (Ox.isArray(value) ? value : [value]).map(function(value) {
            return key
                ? '<a href="/documents/' + key + '=' + pandora.escapeQueryValue(value) + '">' + value + '</a>'
                : value;
        }).join(', ');
    }

    function formatValue(key, value) {
        var ret;
        if (key == 'date' && (!value || value.split('-').length < 4)) {
            ret = pandora.formatDate(value);
        } else if (nameKeys.indexOf(key) > -1) {
            ret = formatLink(value.split(', '), key);
        } else if (listKeys.indexOf(key) > -1) {
            ret = formatLink(value.split(', '), key);
        } else if (linkKeys.indexOf(key) > -1) {
            ret = formatLink(value, key);
        } else {
            if (isMixed[key]) {
                ret = 'Mixed'
            } else {
                ret = pandora.formatDocumentKey(Ox.getObjectById(pandora.site.documentKeys, key), data);
            }
        }
        return ret;
    }

    function getRightsLevelElement(rightsLevel) {
        return Ox.Theme.formatColorLevel(
            rightsLevel,
            pandora.site.documentRightsLevels.map(function(rightsLevel) {
                return rightsLevel.name;
            })
        );
    }

    function getValue(key, value) {
        return !value ? ''
            : Ox.contains(listKeys, key) ? value.join(', ')
            : value;
    }

    function renderCapabilities(rightsLevel) {
        var capabilities = [].concat(
                canEdit ? [{name: 'canSeeItem', symbol: 'Find'}] : [],
                [
                    {name: 'canPlayClips', symbol: 'PlayInToOut'},
                    {name: 'canPlayVideo', symbol: 'Play'},
                    {name: 'canDownloadVideo', symbol: 'Download'}
                ]
            ),
            userLevels = canEdit ? pandora.site.userLevels : [pandora.user.level];
        $capabilities.empty();
        userLevels.forEach(function(userLevel, i) {
            var $element,
                $line = $('<div>')
                    .css({
                        height: '16px',
                        marginBottom: '4px'
                    })
                    .appendTo($capabilities);
            if (canEdit) {
                $element = Ox.Theme.formatColorLevel(i, userLevels.map(function(userLevel) {
                    return Ox.toTitleCase(userLevel);
                }), [0, 240]);
                Ox.Label({
                        textAlign: 'center',
                        title: Ox.toTitleCase(userLevel),
                        width: 60
                    })
                    .addClass('OxColor OxColorGradient')
                    .css({
                        float: 'left',
                        height: '12px',
                        paddingTop: '2px',
                        background: $element.css('background'),
                        fontSize: '8px',
                        color: $element.css('color')
                    })
                    .data({OxColor: $element.data('OxColor')})
                    .appendTo($line);
            }
            capabilities.forEach(function(capability) {
                var hasCapability = pandora.hasCapability(capability.name, userLevel) >= rightsLevel,
                    $element = Ox.Theme.formatColorLevel(hasCapability, ['', '']);
                Ox.Button({
                        tooltip: (canEdit ? Ox.toTitleCase(userLevel) : 'You') + ' '
                            + (hasCapability ? 'can' : 'can\'t') + ' '
                            + Ox.toSlashes(capability.name)
                                .split('/').slice(1).join(' ')
                                .toLowerCase(),
                        title: capability.symbol,
                        type: 'image'
                    })
                    .addClass('OxColor OxColorGradient')
                    .css({background: $element.css('background')})
                    .css('margin' + (canEdit ? 'Left' : 'Right'), '4px')
                    .data({OxColor: $element.data('OxColor')})
                    .appendTo($line);
            });
            if (!canEdit) {
                Ox.Button({
                    title: Ox._('Help'),
                    tooltip: Ox._('About Rights'),
                    type: 'image'
                })
                .css({marginLeft: '52px'})
                .bindEvent({
                    click: function() {
                        pandora.UI.set({page: 'rights'});
                    }
                })
                .appendTo($line);
            }
        });
    }

    function renderGroup(keys) {
        var $element;
        keys.forEach(function(key) { displayedKeys.push(key) });
        if (canEdit || keys.filter(function(key) {
            return data[key];
        }).length) {
            $element = $('<div>').addClass('OxSelectable').css(css);
            keys.forEach(function(key, i) {
                if (canEdit || data[key]) {
                    if ($element.children().length) {
                        $('<span>').html('; ').appendTo($element);
                    }
                    $('<span>').html(formatKey(key)).appendTo($element);
                    Ox.EditableContent({
                            clickLink: pandora.clickLink,
                            editable: canEdit,
                            format: function(value) {
                                return formatValue(key, value);
                            },
                            placeholder: formatLight(Ox._(isMixed[key] ? 'mixed' : 'unknown')),
                            tooltip: canEdit ? pandora.getEditTooltip() : '',
                            value: getValue(key, data[key])
                        })
                        .bindEvent({
                            submit: function(data) {
                                editMetadata(key, data.value);
                            }
                        })
                        .appendTo($element);
                    if (isMixed[key] && Ox.contains(listKeys, key)) {
                        pandora.ui.addRemoveKeyDialog({
                            ids: ui.collectionSelection,
                            key: key,
                            section: ui.section
                        }).appendTo($element)
                    }
                }
            });
            $element.appendTo($text);
        }
        return $element;
    }

    function renderRemainingKeys() {
        var keys = pandora.site.documentKeys.filter(function(item) {
            return item.id != '*' && !Ox.contains(displayedKeys, item.id);
        }).map(function(item) {
            return item.id;
        });
        if (keys.length) {
            renderGroup(keys)
        }
    }

    function renderRightsLevel() {
        var $rightsLevelElement = getRightsLevelElement(data.rightslevel),
            $rightsLevelSelect;
        $rightsLevel.empty();
        if (canEdit) {
            $rightsLevelSelect = Ox.Select({
                    items: pandora.site.documentRightsLevels.map(function(rightsLevel, i) {
                        return {id: i, title: rightsLevel.name};
                    }),
                    width: 128,
                    value: data.rightslevel
                })
                .addClass('OxColor OxColorGradient')
                .css({
                    marginBottom: '4px',
                    background: $rightsLevelElement.css('background')
                })
                .data({OxColor: $rightsLevelElement.data('OxColor')})
                .bindEvent({
                    change: function(event) {
                        var rightsLevel = event.value;
                        $rightsLevelElement = getRightsLevelElement(rightsLevel);
                        $rightsLevelSelect
                            .css({background: $rightsLevelElement.css('background')})
                            .data({OxColor: $rightsLevelElement.data('OxColor')})
                        //renderCapabilities(rightsLevel);
                        var edit = {
                            id: isMultiple ? ui.collectionSelection : data.id,
                            rightslevel: rightsLevel
                        };
                        pandora.api.editDocument(edit, function(result) {
                            that.triggerEvent('change', Ox.extend({}, 'rightslevel', rightsLevel));
                        });
                    }
                })
                .appendTo($rightsLevel);
        } else {
            $rightsLevelElement
                .css({
                    marginBottom: '4px'
                })
                .appendTo($rightsLevel);
        }
        $capabilities = $('<div>').appendTo($rightsLevel);
        //renderCapabilities(data.rightslevel);
    }

    function toggleIconSize() {
        iconSize = iconSize == 256 ? 512 : 256;
        iconWidth = iconRatio > 1 ? iconSize : Math.round(iconSize * iconRatio);
        iconHeight = iconRatio < 1 ? iconSize : Math.round(iconSize / iconRatio);
        iconLeft = iconSize == 256 ? Math.floor((iconSize - iconWidth) / 2) : 0,
        $icon.animate({
            left: margin + iconLeft + 'px',
            width: iconWidth + 'px',
            height: iconHeight + 'px',
        }, 250);
        $reflection.animate({
            top: margin + iconHeight + 'px',
            width: iconSize + 'px',
            height: iconSize / 2 + 'px'
        }, 250);
        $reflectionIcon.animate({
            left: iconLeft + 'px',
            width: iconWidth + 'px',
            height: iconHeight + 'px',
        }, 250);
        $reflectionGradient.animate({
            width: iconSize + 'px',
            height: iconSize / 2 + 'px'
        }, 250);
        $text.animate({
            left: margin + (iconSize == 256 ? 256 : iconWidth) + margin + 'px'
        }, 250);
        pandora.UI.set({infoIconSize: iconSize});
    }

    that.reload = function() {
        /*
        var src = '/documents/' + data.id + '/512p.jpg?' + data.modified;
        $icon.attr({src: src});
        $reflectionIcon.attr({src: src});
        iconSize = iconSize == 256 ? 512 : 256;
        iconRatio = ui.icons == 'posters'
            ? (ui.showSitePosters ? pandora.site.posters.ratio : data.posterRatio) : 1;
        toggleIconSize();
        */
    };

    that.bindEvent({
        mousedown: function() {
            setTimeout(function() {
                !Ox.Focus.focusedElementIsInput() && that.gainFocus();
            });
        }
    });

    return that;

};
