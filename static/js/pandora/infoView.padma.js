'use strict';

pandora.ui.infoView = function(data) {

    // fixme: given that currently, the info view doesn't scroll into view nicely
    // when collapsing the movies browser, the info view should become a split panel

    var ui = pandora.user.ui,
        descriptions = [],
        canEdit = pandora.site.capabilities.canEditMetadata[pandora.user.level] || data.editable,
        css = {
            marginTop: '4px',
            textAlign: 'justify',
            MozUserSelect: 'text',
            WebkitUserSelect: 'text'
        },
        iconRatio = ui.icons == 'posters'
            ? (ui.showSitePoster ? 5/8 : data.posterRatio) : 1,
        iconSize = ui.infoIconSize,
        iconWidth = iconRatio > 1 ? iconSize : Math.round(iconSize * iconRatio),
        iconHeight = iconRatio < 1 ? iconSize : Math.round(iconSize / iconRatio),
        iconLeft = iconSize == 256 ? Math.floor((iconSize - iconWidth) / 2) : 0,
        borderRadius = ui.icons == 'posters' ? 0 : iconSize / 8,
        isEditable = canEdit,
        listWidth = 144 + Ox.UI.SCROLLBAR_SIZE,
        margin = 16,
        statisticsWidth = 128,
        uid = Ox.uid(),

        that = Ox.Element(),

        $list,

        $info = $('<div>')
            .css({
                position: 'absolute',
                left: canEdit && !ui.showIconBrowser ? -listWidth + 'px' : 0,
                top: 0,
                right: 0,
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
            })
            .attr({
                src: '/' + data.id + '/' + (
                    ui.icons == 'posters'
                    ? (ui.showSitePoster ? 'siteposter' : 'poster') : 'icon'
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
                    ui.icons == 'posters' ? 'poster' : 'icon'
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

        $text = Ox.Element({
            })
            .css({
                position: 'absolute',
                left: margin + (iconSize == 256 ? 256 : iconWidth) + margin + 'px',
                top: margin + 'px',
                right: margin + statisticsWidth + margin + 'px',
                //background: 'green'
            })
            .appendTo($data.$element),

        $statistics = $('<div>')
            .css({
                position: 'absolute',
                width: statisticsWidth + 'px',
                top: margin + 'px',
                right: margin + 'px'
            })
            .appendTo($data.$element),

        $capabilities,

        $browserImages = [];

    //pandora.createLinks($text);

    // Title -------------------------------------------------------------------

    $('<div>')
        .css({
            marginTop: '-2px'
        })
        .append(
            Ox.Editable({
                    editable: isEditable,
                    tooltip: isEditable ? 'Doubleclick to edit' : '',
                    value: data.title
                })
                .css({
                    display: 'inline-block',
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
        )
        .appendTo($text);

    if(data.description || isEditable) {
        $('<div>')
            .append(
                Ox.Editable({
                    clickLink: pandora.clickLink,
                    editable: isEditable,
                    maxHeight: Infinity,
                    placeholder: formatLight('No description'),
                    tooltip: isEditable ? 'Doubleclick to edit' : '',
                    type: 'textarea',
                    value: data.description || '',
                    //width: 300
                })
                .bindEvent({
                    submit: function(event) {
                        editMetadata('description', event.value);
                    }
                })
                .css(css)
            )
            .appendTo($text);
    }

    var listKeys = ['language', 'topic', 'director', 'cinematographer', 'features', 'groups',
                    'license'];
    $('<div>').html('<br>').appendTo($text);
    [
        'source',
        'project',
        'year',
        'date',
        'location',
        'director',
        'cinematographer',
        'features',
        'language',
        'topic',
        'license',
        'user',
    ].forEach(function(key) {

        var $div = $('<div>').appendTo($text),
            value = listKeys.indexOf(key) >= 0
                          ? (data[key] || []).join(', ')
                          : data[key] || '';
        if (isEditable || value) {
            $('<div>')
                .html(
                    formatKey({
                        categorty: 'categories',
                    }[key] || key).replace('</span>', '&nbsp;</span>')
                )
                .appendTo($div);
            Ox.Editable({
                clickLink: pandora.clickLink,
                format: function(value) {
                    return listKeys.indexOf(key) >= 0
                        ? formatValue(value.split(', '), {
                            'director': 'name',
                            'cinematographer': 'name',
                            'features': 'name',
                        }[key] || key)
                        : value;
                },
                placeholder: formatLight('unknown'),
                editable: isEditable,
                tooltip: isEditable ? 'Doubleclick to edit' : '',
                value: listKeys.indexOf(key) >= 0
                      ? (data[key] || []).join(', ')
                      : data[key] || ''
            })
            .bindEvent({
                submit: function(event) {
                    editMetadata(key, event.value);
                }
            })
            .css(css)
            .appendTo($div);
            if(pandora.site.itemKeys.filter(function(item) {
                if (item.id == key)
                    return item.description
                }).length > 0
                && (isEditable || data[key + 'description'])) {
                $('<div>')
                    .append(
                        descriptions[key] = Ox.Editable({
                            clickLink: pandora.clickLink,
                            placeholder: formatLight('No ' + Ox.toTitleCase(key) + ' Description'),
                            editable: isEditable,
                            tooltip: isEditable ? 'Doubleclick to edit' : '',
                            type: 'textarea',
                            value: data[key + 'description']|| ''
                        })
                        .bindEvent({
                            submit: function(event) {
                                editMetadata(key + 'description', event.value);
                            }
                        })
                        .css(css)
                    ).css({
                        'padding-top': '4px',
                        'padding-bottom': '4px'
                    })
                    .appendTo($div);
            }
        }
    });

    $('<div>').css({height: '16px'}).appendTo($text);
    [
        'created',
        'accessed',
        'modified',
    ].forEach(function(key) {
        $('<span>')
        .css({padding: '4px'})
        .html(
            formatKey(key) + data[key]
        )
        .appendTo($text);
    });

    $('<div>').css({height: '16px'}).appendTo($text);

    // Hue, Saturation, Lightness, Volume --------------------------------------

    ['hue', 'saturation', 'lightness', 'volume'].forEach(function(key) {
        $('<div>')
            .css({marginBottom: '4px'})
            .append(formatKey(key, true))
            .append(
                Ox.Theme.formatColor(
                    data[key] || 0, key == 'volume' ? 'lightness' : key
                ).css({textAlign: 'right'})
            )
            .appendTo($statistics);
    });

    // Rights Level ------------------------------------------------------------

    var $rightsLevel = $('<div>');
    $('<div>')
        .css({marginBottom: '4px'})
        .append(formatKey('Rights Level', true))
        .append($rightsLevel)
        .appendTo($statistics);
    renderRightsLevel();

    // Groups, Notes ---------------------------------------------------------

    if (canEdit) {

        $('<div>')
            .css({marginBottom: '4px'})
            .append(formatKey('Groups', true))
            .append(
                Ox.Editable({
                        placeholder: formatLight('No Groups'),
                        tooltip: 'Doubleclick to edit',
                        value: data.groups.join(', '),
                    })
                    .bindEvent({
                        submit: function(event) {
                            editMetadata('groups', event.value);
                        }
                    })
            )
            .appendTo($statistics);

        $('<div>')
            .css({marginBottom: '4px'})
            .append(formatKey('Notes', true))
            .append(
                Ox.Editable({
                        height: 128,
                        placeholder: formatLight('No notes'),
                        tooltip: 'Doubleclick to edit',
                        type: 'textarea',
                        value: data.notes,
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

    $('<div>').css({height: '16px'}).appendTo($statistics);

    function editMetadata(key, value) {
        if (value != data[key]) {
            var edit = {id: data.id};
            if (key == 'title') {
                edit[key] = value;
            } else if(listKeys.indexOf(key) > -1) {
                edit[key] = value ? value.split(', ') : [];
            } else {
                edit[key] = value;
            }
            pandora.api.edit(edit, function(result) {
                data[key] = value;
                descriptions[key] && descriptions[key].options({
                    value: result.data[key+'description']
                });

                Ox.Request.clearCache(); // fixme: too much? can change filter/list etc
                if (result.data.id != data.id) {
                    pandora.UI.set({item: result.data.id});
                    pandora.$ui.browser.value(data.id, 'id', result.data.id);
                }
                // FIXME: value function should accept {k: v, ...}
                pandora.$ui.browser.value(result.data.id, 'title', result.data.title);
                pandora.$ui.browser.value(result.data.id, 'director', result.data.director);
                pandora.$ui.browser.value(result.data.id, 'country', result.data.country);
                pandora.$ui.browser.value(result.data.id, 'year', result.data.year);
                pandora.$ui.itemTitle
                    .options({
                        title: '<b>' + result.data.title
                            + (Ox.len(result.data.director)
                                ? ' (' + result.data.director.join(', ') + ')'
                                : '')
                            + (result.data.year ? ' ' + result.data.year : '') + '</b>'
                    });
                //pandora.$ui.contentPanel.replaceElement(0, pandora.$ui.browser = pandora.ui.browser());
            });
        }
    }

    function formatKey(key, isStatistics) {
        return isStatistics
            ? $('<div>').css({marginBottom: '4px', fontWeight: 'bold'}).html(Ox.toTitleCase(key))
            : '<span style="font-weight: bold">' + Ox.toTitleCase(key) + ':</span> ';
    }

    function formatLight(str) {
        return '<span style="color: rgb(128, 128, 128)">' + str + '</span>';
    }

    function formatValue(value, key) {
        return (Ox.isArray(value) ? value : [value]).map(function(value) {
            return key ?
                '<a href="/' + key + '==' + value + '">' + value + '</a>'
                : value;
        }).join(', ');
    }

    function getRightsLevelElement(rightsLevel) {
        return Ox.Theme.formatColorLevel(
            rightsLevel,
            pandora.site.rightsLevels.map(function(rightsLevel) {
                return rightsLevel.name;
            })
        );
    }

    function renderCapabilities(rightsLevel) {
        var capabilities = Ox.merge(
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
                            + Ox.map(Ox.toSlashes(capability.name).split('/'), function(word, i) {
                                return i == 0 ? null : word.toLowerCase();
                            }).join(' '),
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

    function renderRightsLevel() {
        var $rightsLevelElement = getRightsLevelElement(data.rightslevel),
            $rightsLevelSelect;
        $rightsLevel.empty();
        if (canEdit) {
            $rightsLevelSelect = Ox.Select({
                    items: pandora.site.rightsLevels.map(function(rightsLevel, i) {
                        return {id: i, title: rightsLevel.name, checked: i == data.rightslevel};
                    }),
                    width: 128
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
            left: margin + (iconSize == 256 ? 256 : iconWidth) + margin + 'px',
        }, 250);
        pandora.UI.set({infoIconSize: iconSize});
    }

    that.reload = function() {
        var src = src = '/' + data.id + '/' + (
            ui.icons == 'posters'
            ? (ui.showSitePoster ? 'siteposter' : 'poster') : 'icon'
        ) + '512.jpg?' + Ox.uid()
        $icon.attr({src: src});
        $reflectionIcon.attr({src: src});
        iconSize = iconSize == 256 ? 512 : 256;
        iconRatio = ui.icons == 'posters'
            ? (ui.showSitePoster ? 5/8 : data.posterRatio) : 1;
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
        pandora_showsiteposter: function() {
            ui.icons == 'posters' && that.reload();
        }
    });

    return that;

}
