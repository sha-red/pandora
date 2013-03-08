'use strict';

pandora.ui.infoView = function(data) {

    var ui = pandora.user.ui,
        descriptions = [],
        canEdit = pandora.site.capabilities.canEditMetadata[pandora.user.level] || data.editable,
        css = {
            marginTop: '4px',
            textAlign: 'justify',
            MozUserSelect: 'text',
            WebkitUserSelect: 'text'
        },
        html,
        iconRatio = ui.icons == 'posters' ? data.posterRatio : 1,
        iconSize = ui.infoIconSize,
        iconWidth = iconRatio > 1 ? iconSize : Math.round(iconSize * iconRatio),
        iconHeight = iconRatio < 1 ? iconSize : Math.round(iconSize / iconRatio),
        iconLeft = iconSize == 256 ? Math.floor((iconSize - iconWidth) / 2) : 0,
        borderRadius = ui.icons == 'posters' ? 0 : iconSize / 8,
        margin = 16,
        statisticsWidth = 128,
        uid = Ox.uid(),

        that = Ox.Element(),

        $div,
        $list,

        $info = Ox.Element()
            .css({
                position: 'absolute',
                left: 0,
                top: 0,
                right: 0,
                bottom: 0,
                overflowY: 'auto'
            })
            .appendTo(that),

        $left = Ox.Element()
            .appendTo($info),

        $icon = Ox.Element({
                element: '<img>',
            })
            .attr({
                src: '/' + data.id + '/' + (
                    ui.icons == 'posters' ? 'poster' : 'icon'
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

        $data = $('<div>')
            .css({
                position: 'absolute',
                left: margin + 'px',
                top: margin + iconHeight + margin + 'px',
                width: iconSize + 'px',
            })
            .appendTo($left),

        $center = Ox.Element()
            .addClass('OxTextPage')
            .css({
                position: 'absolute',
                left: margin + (iconSize == 256 ? 256 : iconWidth) + margin + 'px',
                top: margin + 'px',
                right: margin + statisticsWidth + margin + 'px',
            })
            .appendTo($info),

        $right = $('<div>')
            .css({
                position: 'absolute',
                width: statisticsWidth + 'px',
                top: margin + 'px',
                right: margin + 'px'
            })
            .appendTo($info),

        $capabilities;

    if (!canEdit) {
        pandora.createLinks($info);        
    }

    var listKeys = [
        'country', 'language', 'director', 'featuring',
        'groups'
    ];

    // Title -------------------------------------------------------------------

    $('<div>')
        .css({
            marginTop: '-2px',
        })
        .append(
            Ox.Editable({
                    editable: canEdit,
                    tooltip: canEdit ? pandora.getEditTooltip() : '',
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
        .appendTo($center);

    // Year, Country, Language and Duration -----------------------------------

    if (canEdit) {
        $div = $('<div>').css(css).css({marginTop: '12px'}).appendTo($center);
        ['year', 'country', 'language', 'duration'].forEach(function(key, i) {
            i && $('<div>').css({float: 'left'}).html(';&nbsp;').appendTo($div);
            $('<div>')
                .css({float: 'left'})
                .html(formatKey(key).replace('</span>', '&nbsp;</span>'))
                .appendTo($div);
            Ox.Editable({
                    clickLink: pandora.clickLink,
                    editable: key != 'duration',
                    format: function(value) {
                        return formatValue(listKeys.indexOf(key) >= 0
                                           ? value.split(', ') : value, key);
                    },
                    placeholder: formatLight('unknown'),
                    tooltip: pandora.getEditTooltip(),
                    value: listKeys.indexOf(key) >= 0
                          ? (data[key] || []).join(', ')
                          : data[key] || ''
                })
                .css({float: 'left'})
                .bindEvent({
                    submit: function(event) {
                        editMetadata(key, event.value);
                    }
                })
                .appendTo($div);
        });
        $('<br>').appendTo($center);
    } else {
        html = [];
        ['year', 'country', 'language', 'duration'].forEach(function(key) {
            if (data[key]) {
                html.push(formatKey(key) + formatValue(data[key], key));
            }
        });
        $('<div>').css(css).html(html.join('; ')).appendTo($center);
    }

    // Director, Cinematographer and Featuring ---------------------------------

    if (canEdit) {
        $div = $('<div>').css(css).css('clear', 'both').appendTo($center);
        ['director', 'featuring'].forEach(function(key, i) {
            i && $('<div>').css({float: 'left'}).html(';&nbsp;').appendTo($div);
            $('<div>')
                .css({float: 'left'})
                .html(formatKey(key).replace('</span>', '&nbsp;</span>'))
                .appendTo($div);
            Ox.Editable({
                    clickLink: pandora.clickLink,
                    format: function(value) {
                        return formatValue(value.split(', '), 'name');
                    },
                    placeholder: formatLight('unknown'),
                    tooltip: pandora.getEditTooltip(),
                    value: listKeys.indexOf(key) >= 0
                          ? (data[key] || []).join(', ')
                          : data[key] || ''
                })
                .css({float: 'left'})
                .bindEvent({
                    submit: function(event) {
                        editMetadata(key, event.value);
                    }
                })
                .appendTo($div);
        });
        $('<br>').appendTo($center);
    } else if (data.director || data.cinematographer || data.featuring) {
        html = [];
        ['director', 'featuring'].forEach(function(key) {
            if (data[key] && data[key].length) {
                html.push(
                    formatKey(key)
                    + formatValue(data[key], key)
                );
            }
        });
        $('<div>').css(css).html(html.join('; ')).appendTo($center);
    }

    // Summary -------------------------------------------------------------
    $div = $('<div>').css(css).css('clear', 'both').appendTo($center);

    if (canEdit) {
        $('<div>')
            .css({marginTop: '16px'})
            .append(
                Ox.Editable({
                    clickLink: pandora.clickLink,
                    editable: canEdit,
                    maxHeight: Infinity,
                    placeholder: formatLight('No Summary'),
                    tooltip: canEdit ? pandora.getEditTooltip() : '',
                    type: 'textarea',
                    value: data.summary || '',
                    //width: 300
                })
                .bindEvent({
                    submit: function(event) {
                        editMetadata('summary', event.value);
                    }
                })
                .css(css)
            )
            .appendTo($center);
    } else if (data.summary) {
        $('<div>').css(css).html(data.summary).appendTo($center);
    }

    // Duration, Aspect Ratio --------------------------------------------------

    ['duration', 'aspectratio'].forEach(function(key) {
        var itemKey = Ox.getObjectById(pandora.site.itemKeys, key),
            value = data[key] || 0;
        $('<div>')
            .css({marginBottom: '4px'})
            .append(formatKey(itemKey.title, true))
            .append(
                Ox.Theme.formatColor(null, 'gradient')
                    .css({textAlign: 'right'})
                    .html(
                        Ox['format' + Ox.toTitleCase(itemKey.format.type)]
                            .apply(null, [value].concat(itemKey.format.args))
                    )
            )
            .appendTo($right);
    });

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
            .appendTo($right);
    });

    // Cuts per Minute ---------------------------------------------------------

    $('<div>')
        .css({marginBottom: '4px'})
        .append(formatKey('cuts per minute', true))
        .append(
            Ox.Theme.formatColor(null, 'gradient')
                .css({textAlign: 'right'})
                .html(Ox.formatNumber(data['cutsperminute'] || 0, 3))
        )
        .appendTo($right);

    // User and Groups ---------------------------------------------------------

    ['user', 'groups'].forEach(function(key) {
        (canEdit || data[key] && data[key].length) && $('<div>')
            .css({marginBottom: '4px'})
            .append(formatKey(key, true))
            .append(
                $('<div>')
                    .css({margin: '2px 0 0 -1px'}) // fixme: weird
                    .append(
                        Ox.Editable({
                            placeholder: key == 'groups' ? formatLight('No Groups') : '',
                            editable: canEdit,
                            tooltip: canEdit ? pandora.getEditTooltip() : '',
                            value: key == 'user' ? data[key] : data[key].join(', ')
                        })
                        .bindEvent({
                            submit: function(event) {
                                editMetadata(key, event.value);
                            }
                        })
                    )
            )
            .appendTo($right);
    });
    
    // Created and Modified ----------------------------------------------------

    ['created', 'modified'].forEach(function(key) {
        $('<div>')
            .css({marginBottom: '4px'})
            .append(formatKey(key, true))
            .append(
                $('<div>').html(Ox.formatDate(data[key], '%B %e, %Y'))
            )
            .appendTo($right);
    });

    // Rights Level ------------------------------------------------------------

    if (canEdit) {
        var $rightsLevel = $('<div>');
        $('<div>')
            .css({marginBottom: '4px'})
            .append(formatKey('Rights Level', true))
            .append($rightsLevel)
            .appendTo($right);
        renderRightsLevel();
    }

    // Notes --------------------------------------------------------------------

    if (canEdit) {

        $('<div>')
            .css({marginBottom: '4px'})
            .append(formatKey('Notes', true))
            .append(
                Ox.Editable({
                        height: 128,
                        placeholder: formatLight('No notes'),
                        tooltip: pandora.getEditTooltip(),
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
            .appendTo($right);

    }

    $('<div>').css({height: '16px'}).appendTo($right);

    function editMetadata(key, value) {
        if (value != data[key]) {
            var edit = {id: data.id};
            if (key == 'title') {
                edit[key] = value;
            } else if (listKeys.indexOf(key) >= 0) {
                edit[key] = value ? value.split(', ') : [];
            } else {
                edit[key] = value ? value : null;
            }
            pandora.api.edit(edit, function(result) {
                data[key] = value;
                descriptions[key] && descriptions[key].options({
                    value: result.data[key + 'description']
                });

                Ox.Request.clearCache(); // fixme: too much? can change filter/list etc
                if (result.data.id != data.id) {
                    pandora.UI.set({item: result.data.id});
                    pandora.$ui.browser.value(data.id, 'id', result.data.id);
                }
                pandora.updateItemContext();
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
            ? $('<div>').css({marginBottom: '4px', fontWeight: 'bold'})
                .html(Ox.toTitleCase(key).replace(' Per ', ' per '))
            : '<span style="font-weight: bold">' + Ox.toTitleCase(key) + ':</span> ';
    }

    function formatLight(str) {
        return '<span style="color: rgb(128, 128, 128)">' + str + '</span>';
    }

    function formatValue(value, key) {
        if (key == 'date') {
            return value ? Ox.formatDate(value,
                ['', '%Y', '%B %Y', '%B %e, %Y'][value.split('-').length]
            ) : '';
        } else if (key == 'duration') {
            return value < 60 ? Math.round(value) + ' sec'
                : Math.round(value / 60) + ' min';
        }
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
        $data.animate({
            top: margin + iconHeight + margin + 'px',
            width: iconSize + 'px',
        }, 250);
        $center.animate({
            left: margin + (iconSize == 256 ? 256 : iconWidth) + margin + 'px',
        }, 250);
        pandora.UI.set({infoIconSize: iconSize});
    }

    that.reload = function() {
        var src = src = '/' + data.id + '/' + (
                ui.icons == 'posters' ? 'poster' : 'icon'
            ) + '512.jpg?' + Ox.uid();
        $icon.attr({src: src});
        $reflectionIcon.attr({src: src});
        iconSize = iconSize == 256 ? 512 : 256;
        iconRatio = ui.icons == 'posters'
            ? (ui.showSitePosters ? 5/8 : data.posterRatio) : 1;
        toggleIconSize();
    };

    that.resize = function() {

    };

    that.bindEvent({
        pandora_icons: that.reload,
        pandora_showsiteposters: function() {
            ui.icons == 'posters' && that.reload();
        }
    });

    return that;

}
