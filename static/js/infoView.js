'use strict';

pandora.ui.infoView = function(data, isMixed) {
    isMixed = isMixed || {};

    var ui = pandora.user.ui,
        descriptions = [],
        isMultiple = arguments.length == 2,
        canEdit = pandora.hasCapability('canEditMetadata') || isMultiple || data.editable,
        canRemove = pandora.hasCapability('canRemoveItems'),
        css = {
            marginTop: '4px',
            textAlign: 'justify'
        },
        html,
        iconRatio = ui.icons == 'posters' ? data.posterRatio : 1,
        iconSize = isMultiple ? 0 : ui.infoIconSize,
        iconWidth = isMultiple ? 0 : iconRatio > 1 ? iconSize : Math.round(iconSize * iconRatio),
        iconHeight = iconRatio < 1 ? iconSize : Math.round(iconSize / iconRatio),
        iconLeft = isMultiple ? 0 : iconSize == 256 ? Math.floor((iconSize - iconWidth) / 2) : 0,
        borderRadius = ui.icons == 'posters' ? 0 : iconSize / 8,
        margin = 16,
        nameKeys = pandora.site.itemKeys.filter(function(key) {
            return key.sortType == 'person';
        }).map(function(key) {
            return key.id;
        }),
        listKeys = pandora.site.itemKeys.filter(function(key) {
            return Ox.isArray(key.type);
        }).map(function(key){
            return key.id;
        }),
        specialListKeys = [].concat(
            pandora.site.itemKeys.filter(function(key) {
                return key.type[0] == 'date'
            }).map(function(key) {
                return key.id;
            })
        ),
        posterKeys = nameKeys.concat(['title', 'year']),
        displayedKeys = [ // FIXME: can tis be a flag in the config?
            'title', 'notes', 'name', 'summary', 'id',
            'hue', 'saturation', 'lightness', 'cutsperminute', 'volume',
            'user', 'rightslevel', 'bitrate', 'timesaccessed',
            'numberoffiles', 'numberofannotations', 'numberofcuts', 'words', 'wordsperminute',
            'duration', 'aspectratio', 'pixels', 'size', 'resolution',
            'created', 'modified', 'accessed',
            'random'
        ],
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
                        title: Ox._('Delete {0}...', [pandora.site.itemName.singular]),
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
                        pandora.$ui.deleteItemsDialog = pandora.ui.deleteItemsDialog({
                            items: [data]
                        }).open();
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
        });

        if (!isMultiple) {
            var $icon = Ox.Element({
                    element: '<img>',
                })
                .attr({
                    src: '/' + data.id + '/' + (
                        ui.icons == 'posters' ? 'poster' : 'icon'
                    ) + '512.jpg?' + data.modified
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
                .appendTo($info),

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
                .appendTo($info),

            $reflectionIcon = $('<img>')
                .attr({
                    src: '/' + data.id + '/' + (
                        ui.icons == 'posters' ? 'poster' : 'icon'
                    ) + '512.jpg?' + data.modified
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
                .appendTo($reflection);
        }

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
            .appendTo($info);

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

    // Title -------------------------------------------------------------------

    $('<div>')
        .css({
            marginTop: '-2px',
        })
        .append(
            Ox.EditableContent({
                    editable: canEdit,
                    tooltip: canEdit ? pandora.getEditTooltip() : '',
                    placeholder: formatLight(Ox._( isMixed.title ? 'Mixed title' : 'Untitled')),
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

    // Director, Year and Country, Language --------------------------------

    renderGroup(['director', 'year', 'country', 'language']);

    // Featuring ----------------------------------------------

    Ox.getObjectById(pandora.site.itemKeys, 'featuring') && renderGroup(['featuring']);

    // Render any remaing keys defined in config

    renderRemainingKeys();

    // Summary -----------------------------------------------------------------

    if (canEdit || data.summary) {
        $('<div>')
            .append(
                Ox.EditableContent({
                    clickLink: pandora.clickLink,
                    editable: canEdit,
                    format: function(value) {
                        return value.replace(
                            /<img src=/g,
                            '<img style="float: left; max-width: 256px; max-height: 256px; margin: 0 16px 16px 0" src='
                        );
                    },
                    maxHeight: Infinity,
                    placeholder: formatLight(Ox._( isMixed.summary ? 'Mixed Summary' : 'No Summary')),
                    tooltip: canEdit ? pandora.getEditTooltip() : '',
                    type: 'textarea',
                    value: data.summary || ''
                })
                .css(css)
                .css({
                    marginTop: '12px',
                    overflow: 'hidden'
                })
                .bindEvent({
                    submit: function(event) {
                        editMetadata('summary', event.value);
                    }
                })
            )
            .appendTo($text);
    }


    // Duration, Aspect Ratio --------------------------------------------------
    if (!isMultiple) {
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
            $('<div>')
                .css({marginBottom: '4px'})
                .append(formatKey(key, 'statistics'))
                .append(
                    Ox.Theme.formatColor(
                        data[key] || 0, key == 'volume' ? 'lightness' : key
                    ).css({textAlign: 'right'})
                )
                .appendTo($statistics);
        });

        // Cuts per Minute ---------------------------------------------------------

        $('<div>')
            .css({marginBottom: '4px'})
            .append(formatKey('cuts per minute', 'statistics'))
            .append(
                Ox.Theme.formatColor(null, 'gradient')
                    .css({textAlign: 'right'})
                    .html(Ox.formatNumber(data['cutsperminute'] || 0, 3))
            )
            .appendTo($statistics);
    }

    // Rights Level ------------------------------------------------------------

    var $rightsLevel = $('<div>');
    $('<div>')
        .css({marginBottom: '4px'})
        .append(formatKey('Rights Level', 'statistics'))
        .append($rightsLevel)
        .appendTo($statistics);
    pandora.renderRightsLevel(that, $rightsLevel, data, isMixed, isMultiple, canEdit);

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

    $('<div>').css({height: '16px'}).appendTo($statistics);

    function editMetadata(key, value) {
        if (value != data[key]) {
            var itemKey = Ox.getObjectById(pandora.site.itemKeys, key);
            var edit = {id: isMultiple ? ui.listSelection : data.id};
            if (key == 'title') {
                edit[key] = value;
            } else if (listKeys.indexOf(key) >= 0) {
                edit[key] = value ? value.split(', ') : [];
            } else if (specialListKeys.indexOf(key) > -1) {
                edit[key] = value
                    ? Ox.decodeHTMLEntities(value).split('; ').map(Ox.encodeHTMLEntities)
                    : [];
            } else {
                edit[key] = value ? value : null;
            }
            if (itemKey && itemKey.type && itemKey.type[0] == 'date') {
                edit[key] = edit[key].map(pandora.cleanupDate);
            }
            pandora.api.edit(edit, function(result) {
                if (!isMultiple) {
                    var src;
                    data[key] = result.data[key];
                    descriptions[key] && descriptions[key].options({
                        value: result.data[key + 'description']
                    });
                    Ox.Request.clearCache(); // fixme: too much? can change filter/list etc
                    if (result.data.id != data.id) {
                        pandora.UI.set({item: result.data.id});
                        pandora.$ui.browser.value(data.id, 'id', result.data.id);
                    }
                    pandora.updateItemContext();
                    pandora.$ui.browser.value(result.data.id, key, result.data[key]);
                    if (Ox.contains(posterKeys, key) && ui.icons == 'posters') {
                        src = pandora.getMediaURL('/' + data.id + '/poster512.jpg?' + Ox.uid());
                        $icon.attr({src: src});
                        $reflectionIcon.attr({src: src});
                    }
                    pandora.$ui.itemTitle
                        .options({
                            title: '<b>' + result.data.title
                                + (Ox.len(result.data.director)
                                    ? ' (' + result.data.director.join(', ') + ')'
                                    : '')
                                + (result.data.year ? ' ' + result.data.year : '') + '</b>'
                        });
                }
                that.triggerEvent('change', Ox.extend({}, key, value));
            });
        }
    }

    function formatKey(key, mode) {
        var item = Ox.getObjectById(pandora.site.itemKeys, key);
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


    function formatLink(value, key, linkValue) {
        linkValue = linkValue || value
        linkValue = Ox.isArray(linkValue) ? linkValue: [linkValue]
        return (Ox.isArray(value) ? value : [value]).map(function(value, idx) {
            return key
                ? '<a href="/' + (
                    key == 'alternativeTitles' ? 'title' : key
                ) + '=' + pandora.escapeQueryValue(linkValue[idx]) + '">' + value + '</a>'
                : value;
        }).join(Ox.contains(specialListKeys, key) ? '; ' : ', ');
    }

    function formatValue(key, value) {
        var ret;
        if (nameKeys.indexOf(key) > -1) {
            ret = formatLink(value.split(', '), 'name');
        } else if (
            listKeys.indexOf(key) > -1 && Ox.getObjectById(pandora.site.itemKeys, key).type[0] == 'date'
        ) {
            ret = value.split('; ').map(function(date) {
                date = pandora.cleanupDate(date)
                return date ? formatLink(Ox.formatDate(date,
                    ['', '%Y', '%B %Y', '%B %e, %Y'][date.split('-').length],
                    true
                ), key, date) : '';
            }).join('; ');
        } else if (listKeys.indexOf(key) > -1) {
            ret = formatLink(value.split(', '), key);
        } else if (specialListKeys.indexOf(key) > -1) {
            ret = formatLink(
                Ox.decodeHTMLEntities(value).split('; ').map(Ox.encodeHTMLEntities),
                key
            );
        } else if (['year', 'country'].indexOf(key) > -1) {
            ret = formatLink(value, key);
        } else {
            ret = value;
        }
        return ret;
    }

    function getValue(key, value) {
        return !value ? ''
            : Ox.contains(specialListKeys, key) ? value.join('; ')
            : Ox.contains(listKeys, key) ? value.join(', ')
            : value;
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
                            format: function(value) {
                                return formatValue(key, value);
                            },
                            placeholder: formatLight(Ox._( isMixed[key] ? 'mixed' : 'unknown')),
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
                            ids: ui.listSelection,
                            key: key,
                            section: ui.section
                        }).appendTo($element)
                    }
                }
            });
            $element.appendTo($text);
        }
    }

    function renderRemainingKeys() {
        var keys = pandora.site.itemKeys.filter(function(item) {
            return item.id != '*' && item.type != 'layer' && !Ox.contains(displayedKeys, item.id);
        }).map(function(item) {
            return item.id;
        });
        if (keys.length) {
            renderGroup(keys)
        }
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
                ui.icons == 'posters' ? 'poster' : 'icon'
            ) + '512.jpg?' + Ox.uid();
        $icon.attr({src: src});
        $reflectionIcon.attr({src: src});
        iconSize = iconSize == 256 ? 512 : 256;
        iconRatio = ui.icons == 'posters'
            ? (ui.showSitePosters ? pandora.site.posters.ratio : data.posterRatio) : 1;
        toggleIconSize();
    };

    that.bindEvent({
        mousedown: function() {
            setTimeout(function() {
                !Ox.Focus.focusedElementIsInput() && that.gainFocus();
            });
        },
        pandora_icons: that.reload,
        pandora_showsiteposters: function() {
            ui.icons == 'posters' && that.reload();
        }
    });

    return that;

};
