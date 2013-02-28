'use strict';

pandora.ui.infoView = function(data) {

    var ui = pandora.user.ui,
        canEdit = pandora.site.capabilities.canEditMetadata[pandora.user.level],
        canRemove = pandora.site.capabilities.canRemoveItems[pandora.user.level],
        css = {
            marginTop: '4px',
            textAlign: 'justify',
            MozUserSelect: 'text',
            WebkitUserSelect: 'text'
        },
        iconRatio = ui.icons == 'posters'
            ? (ui.showSitePosters ? 5/8 : data.posterRatio) : 1,
        iconSize = ui.infoIconSize,
        iconWidth = iconRatio > 1 ? iconSize : Math.round(iconSize * iconRatio),
        iconHeight = iconRatio < 1 ? iconSize : Math.round(iconSize / iconRatio),
        iconLeft = iconSize == 256 ? Math.floor((iconSize - iconWidth) / 2) : 0,
        borderRadius = ui.icons == 'posters' ? 0 : iconSize / 8,
        isCopyrighted = !data.year || parseInt(data.year) + 60 >= new Date().getFullYear(),
        listWidth = 144 + Ox.UI.SCROLLBAR_SIZE,
        margin = 16,
        nameKeys = [
            'director', 'codirector', 'producer', 'writer', 'cinematographer',
            'editor', 'composer', 'lyricist', 'actor'
        ],
        listKeys = nameKeys.concat([
            'country', 'language', 'productionCompany', 'genre', 'keyword'
        ]),
        names = getNames(),
        statisticsWidth = 128,
        uid = Ox.uid(),

        that = Ox.Element(),

        $list,

        $info = $('<div>')
            .css({
                position: 'absolute',
                left: canEdit && !ui.showIconBrowser ? -listWidth + 'px' : 0,
                top: 0,
                right: 0
            })
            .appendTo(that.$element),

        $data = Ox.Container()
            .css({
                position: 'absolute',
                left: (canEdit ? listWidth : 0) + 'px',
                top: 0,
                right: 0,
                height: pandora.$ui.contentPanel.size(1) + 'px'
            })
            .appendTo($info),

        $icon = Ox.Element({
                element: '<img>',
                tooltip: canEdit ? (
                    !ui.showIconBrowser
                        ? 'Doubleclick to edit icon'
                        : 'Doubleclick to hide icons'
                ) : ''
            })
            .attr({
                src: '/' + data.id + '/' + (
                    ui.icons == 'posters'
                    ? (ui.showSitePosters ? 'siteposter' : 'poster') : 'icon'
                ) + '512.jpg?' + uid
            })
            .css({
                position: 'absolute',
                left: margin + iconLeft + 'px',
                top: margin + 'px',
                width: iconWidth + 'px',
                height: iconHeight + 'px',
                borderRadius: borderRadius + 'px',
                cursor: 'pointer'
            })
            .bindEvent({
                singleclick: toggleIconSize
            })
            .appendTo($data.$element),

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
            .appendTo($data.$element),

        $reflectionIcon = $('<img>')
            .attr({
                src: '/' + data.id + '/' + (
                    ui.icons == 'posters'
                    ? (ui.showSitePosters ? 'siteposter' : 'poster') : 'icon'
                ) + '512.jpg?' + uid
            })
            .css({
                position: 'absolute',
                left: iconLeft + 'px',
                width: iconWidth + 'px',
                height: iconHeight + 'px',
                borderRadius: borderRadius + 'px'
            })
            .appendTo($reflection),

        $reflectionGradient = $('<div>')
            .css({
                position: 'absolute',
                width: iconSize + 'px',
                height: iconSize / 2 + 'px'
            })
            .appendTo($reflection),

        $text = Ox.Element()
            .css({
                position: 'absolute',
                left: margin + (iconSize == 256 ? 256 : iconWidth) + margin + 'px',
                top: margin + 'px',
                right: margin + statisticsWidth + margin + 'px'
            })
            .appendTo($data.$element),

        $alternativeTitles,

        $minutes,

        $imdb,

        $descriptions,

        $statistics = $('<div>')
            .css({
                position: 'absolute',
                width: statisticsWidth + 'px',
                top: margin + 'px',
                right: margin + 'px'
            })
            .appendTo($data.$element),

        $editMenu,

        $capabilities,

        $browserImages = [];

    //pandora.createLinks($text); // FIXME: this is wrong for editables that already have clickLink

    // Title -------------------------------------------------------------------

    $('<div>')
        .css({
            marginTop: '-2px'
        })
        .append(
            Ox.EditableContent({
                    clickLink: pandora.clickLink,
                    editable: canEdit,
                    format: function(value) {
                        return formatTitle(value);
                    },
                    tooltip: canEdit ? getTooltip : '',
                    value: data.title
                })
                .css({
                    marginBottom: '-3px',
                    fontWeight: 'bold',
                    fontSize: '13px',
                    MozUserSelect: 'text',
                    WebkitUserSelect: 'text'
                })
                .bindEvent({
                    submit: function(event) {
                        editMetadata('title', event.value);
                    }
                })
                .appendTo($text)
        )
        .appendTo($text);

    // Director ----------------------------------------------------------------

    if (data.director || canEdit) {
        $('<div>')
            .css({
                marginTop: '2px'
            })
            .append(
                Ox.EditableContent({
                        clickLink: pandora.clickLink,
                        editable: canEdit,
                        format: function(value) {
                            return formatLink(value.split(', '), 'name');
                        },
                        placeholder: formatLight('Unknown Director'),
                        tooltip: canEdit ? getTooltip : '',
                        value: data.director ? data.director.join(', ') : ''
                    })
                    .css({
                        marginBottom: '-3px',
                        fontWeight: 'bold',
                        fontSize: '13px',
                        MozUserSelect: 'text',
                        WebkitUserSelect: 'text'
                    })
                    .bindEvent({
                        submit: function(event) {
                            editMetadata('director', event.value);
                        }
                    })
            )
            .appendTo($text);
    }

    // Groups ------------------------------------------------------------------

    renderGroup(['alternativeTitles']);

    renderGroup(['country', 'year', 'language', 'runtime', 'color', 'sound']);

    renderGroup(['productionCompany']);

    renderGroup([
        'producer', 'codirector', 'writer', 'cinematographer', 'editor',
        'composer', 'lyricist'
    ]);

    renderGroup(['actor']);

    renderGroup(['genre', 'keyword']);

    renderGroup(['imdbId']);

    if (canEdit) {
        updateIMDb();
    }

    // Summary -----------------------------------------------------------------

    if (data.summary || canEdit) {
        Ox.EditableContent({
                clickLink: pandora.clickLink,
                editable: canEdit,
                placeholder: formatLight('No Summary'),
                tooltip: canEdit ? getTooltip : '',
                type: 'textarea',
                value: data.summary || ''
            })
            .css(css)
            .css({marginTop: '12px'})
            .bindEvent({
                submit: function(data) {
                    editMetadata('summary', data.value);
                }
            })
            .appendTo($text);
    }

    // Descriptions ------------------------------------------------------------

    $descriptions = $('<div>').attr({id: 'descriptions'}).appendTo($text);

    renderDescriptions();

    $('<div>').css({height: '16px'}).appendTo($text);

    // Menu --------------------------------------------------------------------

    if (canEdit) {
        $editMenu = Ox.MenuButton({
                items: [
                    {
                        id: 'imdb',
                        title: 'Update IMDb ID...',
                        disabled: true
                    },
                    {
                        id: 'metadata',
                        title: 'Update Metadata...'
                    },
                    {},
                    {
                        id: 'delete',
                        title: 'Delete ' + pandora.site.itemName.singular + '...',
                        disabled: !canRemove
                    }
                ],
                title: 'Edit...'
                width: 128
            })
            .css({marginBottom: '4px'})
            .bindEvent({
                click: function(data) {
                    if (data.id == 'imdb') {
                        pandora.$ui.idDialog = pandora.ui.idDialog(data).open();
                    } else if (data.id == 'metadata') {
                        pandora.$ui.metadataDialog = pandora.ui.metadataDialog(data).open();
                    } else if (data.id == 'delete') {
                        pandora.$ui.deleteItemDialog = pandora.ui.deleteItemDialog(data).open();
                    }
                }
            })
            .appendTo($statistics);
    }

    // Duration, Aspect Ratio --------------------------------------------------

    ['duration', 'aspectratio'].forEach(function(key) {
        var itemKey = Ox.getObjectById(pandora.site.itemKeys, key),
            value = data[key] || 0;
        $('<div>')
            .css({marginBottom: '4px'})
            .append(formatKey(itemKey.title, 'statistics'))
            .append(
                Ox.Theme.formatColor(null, 'gradient')
                    .css({textAlign: 'right'})
                    .html(
                        Ox['format' + Ox.toTitleCase(itemKey.format.type)]
                            .apply(null, [value].concat(itemKey.format.args))
                    )
            )
            .appendTo($statistics);
    });

    // Hue, Saturation, Lightness, Volume --------------------------------------

    ['hue', 'saturation', 'lightness', 'volume'].forEach(function(key) {
        var value = data[key] || 0;
        $('<div>')
            .css({marginBottom: '4px'})
            .append(formatKey(key, 'statistics'))
            .append(
                Ox.Theme.formatColor(value, key == 'volume' ? 'lightness' : key)
                    .css({textAlign: 'right'})
            )
            .appendTo($statistics);
    });

    // Cuts per Minute, Words per Minute ---------------------------------------

    ['cutsperminute', 'wordsperminute'].forEach(function(key) {
        var value = data[key] || 0;
        $('<div>')
            .css({marginBottom: '4px'})
            .append(
                formatKey(key.slice(0, -9) + ' per minute', 'statistics')
            )
            .append(
                Ox.Theme.formatColor(null, 'gradient')
                    .css({textAlign: 'right'})
                    .html(Ox.formatNumber(value, 3))
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

    // Notes -------------------------------------------------------------------

    if (canEdit) {

        $('<div>')
            .css({marginBottom: '4px'})
            .append(formatKey('Notes', 'statistics'))
            .append(
                Ox.EditableContent({
                        placeholder: formatLight('No notes'),
                        tooltip: getTooltip,
                        type: 'textarea',
                        value: data.notes,
                        width: 128
                    })
                    .bindEvent({
                        submit: function(event) {
                            pandora.api.edit({
                                id: data.id,
                                notes: event.value
                            }, function(result) {
                                // ...
                            });
                        }
                    })
            )
            .appendTo($statistics);

    }

    $('<div>').css({height: '16px'}).appendTo($statistics);

    function editMetadata(key, value) {
        if (value != data[key]) {
            var edit = {id: data.id};
            if (key == 'alternativeTitles') {
                edit[key] = value ? value.split('; ').map(function(value) {
                    return [value, []];
                }) : [];
                data[key] = edit[key];
                $alternativeTitles.html(formatKey(key));
            } else if (key == 'year') {
                edit[key] = value ? parseInt(value) : '';
            } else if (key == 'runtime') {
                edit[key] = value ? parseInt(value) * 60 : '';
                $minutes[value ? 'show' : 'hide']();
            } else if (listKeys.indexOf(key) > -1) {
                edit[key] = value ? value.split(', ') : [];
            } else {
                edit[key] = value;
            }
            pandora.api.edit(edit, function(result) {
                var src;
                data[key] = result.data[key];
                if (result.data.id != data.id) {
                    Ox.Request.clearCache(); // fixme: too much
                    pandora.UI.set({item: result.data.id});
                    pandora.$ui.browser.value(data.id, 'id', result.data.id);
                }
                pandora.updateItemContext();
                pandora.$ui.browser.value(result.data.id, key, result.data[key]);
                if (Ox.contains(['title', 'director', 'year'], key)) {
                    pandora.clearIconCache(data.id);
                    if (ui.icons == 'posters') {
                        if ($browserImages.length == 0) {
                            $browserImages = pandora.$ui.browser.find('img[src*="/' + data.id + '/"]');
                        }
                        $browserImages.each(function() {
                            $(this).attr({
                                src: '/' + data.id + '/poster128.jpg?' + Ox.uid()
                            });
                        });
                        $list.find('img[src*="siteposter.jpg"]').each(function() {
                            $(this).attr({
                                src: '/' + data.id + '/siteposter.jpg?' + Ox.uid()
                            });
                        });
                        src = '/' + data.id + '/poster512.jpg?' + Ox.uid()
                        $icon.attr({src: src});
                        $reflectionIcon.attr({src: src});
                    }
                }
                if (Ox.contains(nameKeys, key)) {
                    names = getNames();
                    renderDescriptions();
                } else if (key == 'imdbId') {
                    updateIMDb();
                }
            });
        }
    }

    function formatKey(key, mode) {
        var item = Ox.getObjectById(pandora.site.itemKeys, key);
        key = item ? item.title : key;
        mode = mode || 'text'
        if (key == 'alternativeTitles') {
            key = 'Alternative Title' + (
                data.alternativeTitles && data.alternativeTitles.length == 1 ? '' : 's'
            );
        }
        return mode == 'text'
            ? '<span style="font-weight: bold">' + Ox.toTitleCase(key) + ':</span> '
            : mode == 'description'
            ? Ox.toTitleCase(key)
            : $('<div>')
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
                ? '<a href="/' + key + '=' + value + '">' + value + '</a>'
                : value;
        }).join(', ');
    }

    function formatTitle(title) {
        var match = /(.+) (\(S\d{2}E\d{2}\))/.exec(title);
        if (match) {
            title = formatLink(match[1], 'title') + ' '
                + formatLight(match[2])
                + title.substr(match[0].length);
        }
        return title + (
            data.originalTitle && data.originalTitle != title
            ? ' ' + formatLight('(' + data.originalTitle + ')') : ''
        );
    }

    function formatValue(key, value) {
        var ret;
        if (nameKeys.indexOf(key) > -1) {
            ret = formatLink(value.split(', '), 'name');
        } else if (listKeys.indexOf(key) > -1 || key == 'year') {
            ret = formatLink(value.split(', '), key);
        } else if (key == 'imdbId') {
            ret = '<a href="http://www.imdb.com/title/tt'
                + value + '">' + value + '</a>';
        } else {
            ret = value;
        }
        return ret;
    }

    function getNames() {
        var names = [];
        nameKeys.forEach(function(key) {
            data[key] && data[key].forEach(function(name) {
                var index = Ox.indexOf(names, function(value) {
                    return value.name == name;
                });
                if (index == -1) {
                    names.push({
                        name: name,
                        keys: [key],
                        description: data.namedescription
                            ? data.namedescription[name]
                            : void 0
                    });
                } else {
                    names[index].keys.push(key);
                }
            });
        });
        return names;
    }

    function getRightsLevelElement(rightsLevel) {
        return Ox.Theme.formatColorLevel(
            rightsLevel,
            pandora.site.rightsLevels.map(function(rightsLevel) {
                return rightsLevel.name;
            })
        );
    }

    function getTooltip(e) {
        var $target = $(e.target);
        return $target.is('a') || $target.parents('a').length
            ? 'Shift+doubleclick to edit' : 'Doubleclick to edit';
    }

    function getValue(key, value) {
        return !value ? ''
            : key == 'alternativeTitles' ? value.map(function(value) {
                return value[0];
            }).join('; ')
            : key == 'runtime' ? Math.round(value / 60)
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
                var hasCapability = pandora.site.capabilities[capability.name][userLevel] >= rightsLevel,
                    $element = Ox.Theme.formatColorLevel(hasCapability, ['', '']);
                Ox.Button({
                        tooltip: (canEdit ? Ox.toTitleCase(userLevel) : 'You') + ' '
                            + (hasCapability ? 'can' : 'can\'t') + ' '
                            + Ox.toSlashes(capability.name)
                                .split('/').slice(1).join(' ')
                                .toLowerCase()
                                .replace('see item', 'see the item')
                                .replace('play video', 'play the full video')
                                .replace('download video', 'download the video'),
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
                    title: 'Help',
                    tooltip: 'About Rights',
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

    function renderDescriptions() {
        $descriptions.empty();
        names.forEach(function(value) {
            if (canEdit || value.description) {
                $('<div>')
                    .css(css)
                    .css({marginTop: '12px', fontWeight: 'bold'})
                    .html(
                        formatLink(value.name, 'name')
                        + ' (' + value.keys.map(function(key) {
                            return formatKey(key, 'description');
                        }).join(', ') + ')'
                    )
                    .appendTo($descriptions);
                Ox.EditableContent({
                        clickLink: pandora.clickLink,
                        editable: canEdit,
                        placeholder: formatLight('No Description'),
                        tooltip: canEdit ? getTooltip : '',
                        type: 'textarea',
                        value: value.description || ''
                    })
                    .css(css)
                    .bindEvent({
                        submit: function(data) {
                            editMetadata(
                                'namedescription',
                                Ox.extend({}, value.name, data.value)
                            );
                        }
                    })
                    .appendTo($descriptions);
            }
        });
    }

    function renderGroup(keys) {
        var $element;
        if (canEdit || keys.filter(function(key) {
            return data[key];
        }).length) {
            $element = $('<div>').css(css);
            keys.forEach(function(key, i) {
                if (canEdit || data[key]) {
                    if ($element.children().length) {
                        $('<span>').html('; ').appendTo($element);
                    }
                    if (key == 'alternativeTitles') {
                        $alternativeTitles = $('<span>')
                            .html(formatKey(key))
                            .appendTo($element);
                    } else {
                        $('<span>')
                            .html(formatKey(key))
                            .appendTo($element);
                    }
                    Ox.EditableContent({
                            clickLink: pandora.clickLink,
                            format: function(value) {
                                return formatValue(key, value);
                            },
                            placeholder: formatLight('unknown'),
                            tooltip: canEdit ? getTooltip : '',
                            value: getValue(key, data[key])
                        })
                        .bindEvent({
                            edit: function() {
                                key == 'runtime' && $minutes.show();
                            },
                            submit: function(data) {
                                editMetadata(key, data.value);
                            }
                        })
                        .appendTo($element);
                    if (key == 'runtime') {
                        $minutes = $('<span>')
                            .html('&nbsp;min')
                            [data.runtime ? 'show' : 'hide']()
                            .appendTo($element);
                    } else if (key == 'imdbId') {
                        $imdb = $('<span>')
                            .appendTo($element);
                    }
                }
            });
            $element.appendTo($text);
        }
    }

    function renderRightsLevel() {
        var $rightsLevelElement = getRightsLevelElement(data.rightslevel),
            $rightsLevelSelect;
        $rightsLevel.empty();
        if (canEdit) {
            $rightsLevelSelect = Ox.Select({
                    items: pandora.site.rightsLevels.map(function(rightsLevel, i) {
                        return {
                            id: i,
                            title: rightsLevel.name,
                            disabled: !isCopyrighted && rightsLevel.name == 'Under Copyright'
                                || isCopyrighted && rightsLevel.name == 'Out of Copyright'
                        };
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
                        renderCapabilities(rightsLevel);
                        pandora.api.edit({id: data.id, rightslevel: rightsLevel}, function(result) {
                            // ...
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
        renderCapabilities(data.rightslevel);
    }

    function toggleIconSize() {
        iconSize = iconSize == 256 ? 512 : 256;
        iconWidth = iconRatio > 1 ? iconSize : Math.round(iconSize * iconRatio);
        iconHeight = iconRatio < 1 ? iconSize : Math.round(iconSize / iconRatio);
        iconLeft = iconSize == 256 ? Math.floor((iconSize - iconWidth) / 2) : 0,
        borderRadius = ui.icons == 'posters' ? 0 : iconSize / 8;
        $icon.animate({
            left: margin + iconLeft + 'px',
            width: iconWidth + 'px',
            height: iconHeight + 'px',
            borderRadius: borderRadius + 'px'
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
            borderRadius: borderRadius + 'px'
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

    function updateIMDb() {
        if (data.imdbId) {
            pandora.api.find({
                query: {
                    conditions: [{key: 'imdbId', operator: '=', value: data.imdbId}]
                }
            }, function(result) {
                if (result.data.items == 1) {
                    $imdb.empty();
                } else {
                    $imdb.html(
                        '&nbsp;(<a href="/imdbId=' + data.imdbId + '">'
                        + result.data.items + ' '
                        + pandora.site.itemName.plural.toLowerCase()
                        + ' with the same id</a>)'
                    );
                }
            });
        } else {
            $imdb.empty();
        }
    }

    that.reload = function() {
        var src = src = '/' + data.id + '/' + (
            ui.icons == 'posters'
            ? (ui.showSitePosters ? 'siteposter' : 'poster') : 'icon'
        ) + '512.jpg?' + Ox.uid()
        $icon.attr({src: src});
        $reflectionIcon.attr({src: src});
        iconSize = iconSize == 256 ? 512 : 256;
        iconRatio = ui.icons == 'posters'
            ? (ui.showSitePosters ? 5/8 : data.posterRatio) : 1;
        toggleIconSize();
        pandora.user.level == 'admin' && $list.replaceWith($list = renderList());
    };

    that.resize = function() {
        var height = pandora.$ui.contentPanel.size(1);
        $list && $list.css({height: height + 'px'});
        $data.css({height: height + 'px'});
    };

    that.bindEvent({
        pandora_icons: that.reload,
        pandora_showsiteposters: function() {
            ui.icons == 'posters' && that.reload();
        }
    });

    return that;

};
