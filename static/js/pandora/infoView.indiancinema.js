'use strict';

pandora.ui.infoView = function(data) {

    // fixme: given that currently, the info view doesn't scroll into view nicely
    // when collapsing the movies browser, the info view should become a split panel

    var ui = pandora.user.ui,
        canEdit = pandora.site.capabilities.canEditMetadata[pandora.user.level],
        css = {
            marginTop: '4px',
            textAlign: 'justify',
            MozUserSelect: 'text',
            WebkitUserSelect: 'text'
        },
        copyright = !data.year || data.year + 60 >= new Date().getFullYear(),
        iconRatio = ui.icons == 'posters'
            ? (ui.showSitePosters ? 5/8 : data.posterRatio) : 1,
        iconSize = ui.infoIconSize,
        iconWidth = iconRatio > 1 ? iconSize : Math.round(iconSize * iconRatio),
        iconHeight = iconRatio < 1 ? iconSize : Math.round(iconSize / iconRatio),
        iconLeft = iconSize == 256 ? Math.floor((iconSize - iconWidth) / 2) : 0,
        borderRadius = ui.icons == 'posters' ? 0 : iconSize / 8,
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

        $div,

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

        $statistics = $('<div>')
            .css({
                position: 'absolute',
                width: statisticsWidth + 'px',
                top: margin + 'px',
                right: margin + 'px'
            })
            .appendTo($data.$element),

        $updateButton,

        $capabilities,

        $deleteButton,

        $browserImages = [],

        nameKeys = ['actor', 'director', 'writer', 'producer', 'cinematographer', 'editor'],
        listKeys = ['country', 'language', 'genre', 'keyword'] + nameKeys;

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
                    tooltip: canEdit ? 'Doubleclick to edit' : '',
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
                            return formatValue(value.split(', '), 'name');
                        },
                        placeholder: formatLight('Unknown Director'),
                        tooltip: canEdit ? 'Doubleclick to edit' : '',
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

    // Country, Year, Language, Runtime ----------------------------------------
    $div = getBlock(['country', 'year', 'language', 'runtime'])
    $div && $div
        .css({marginTop: '16px'})
        .appendTo($text);


    // Alternative Titles ------------------------------------------------------
    $div = getBlock(['alternativeTitles'])
    $div && $div
        .appendTo($text);

    $div = getBlock(['writer', 'producer', 'cinematographer', 'editor'])
    $div && $div.appendTo($text);
    
    $div = getBlock(['actor'])
    $div && $div.appendTo($text);

    $div = getBlock(['genre', 'keyword'])
    $div && $div.appendTo($text);

    if (data.summary || canEdit) {
        Ox.Editable({
                clickLink: pandora.clickLink,
                editable: canEdit,
                maxHeight: Infinity,
                placeholder: formatLight('No Summary'),
                tooltip: canEdit ? 'Doubleclick to edit' : '',
                type: 'textarea',
                value: data.summary || ''
            })
            .css(css)
            .css({marginTop: '8px'})
            .bindEvent({
                submit: function(event) {
                    editMetadata('summary', event.value);
                }
            })
            .appendTo($text);
    }

    $div = getBlock(['imdbId'])
    $div && $div.appendTo($text);

    $('<div>').css({height: '16px'}).appendTo($text);

    if (canEdit) {
        $updateButton = Ox.Button({
                title: 'Update Metadata...',
                width: 128
            })
            .css({marginBottom: '4px'})
            .bindEvent({
                click: function() {
                    pandora.$ui.metadataDialog = pandora.ui.metadataDialog(data).open();
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
            .append(formatKey(itemKey.title, true))
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
            .append(formatKey(key, true))
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
                formatKey(key.slice(0, -9) + ' per minute', true)
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
        .append(formatKey('Rights Level', true))
        .append($rightsLevel)
        .appendTo($statistics);
    renderRightsLevel();

    // Notes -------------------------------------------------------------------

    if (canEdit) {

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

    if (pandora.site.capabilities.canRemoveItems[pandora.user.level]) {
        $deleteButton = Ox.Button({
                title: 'Delete ' + pandora.site.itemName.singular + '...',
                width: 128
            })
            .css({marginTop: '4px'})
            .bindEvent({
                click: deleteItem
            })
            .appendTo($statistics);
    }

    $('<div>').css({height: '16px'}).appendTo($statistics);

    if (canEdit) {
        $icon.bindEvent({
            doubleclick: function() {
                pandora.UI.set('showIconBrowser', !ui.showIconBrowser);
                $info.animate({
                    left: ui.showIconBrowser ? 0 : -listWidth + 'px'
                }, 250);
                $icon.options({
                    tooltip: !pandora.user.ui.showIconBrowser
                        ? 'Doubleclick to edit icon'
                        : 'Doubleclick to hide icons'
                });
            }
        });
        renderList();
    }


    function formatEditableValue(value, key) {
        var ret;
        if (key == 'runtime') {
            ret = Math.round(data[key] / 60) + ' min';

        } else if(key == 'alternativeTitles') {
            ret = value.map(function(value) {
                return value[0] + (Ox.isArray(value[1]) ? ' '
                    + formatLight('(' + value[1].join(', ') + ')') : '');
            }).join(', ');
        } else if (key == 'imdbId') {
            ret = '<a href="http://www.imdb.com/title/tt'
                + value + '">' + value + '</a>';
        } else if (nameKeys.indexOf(key) > -1) {
            ret = formatValue(value.split(', '), 'name');
        } else if (listKeys.indexOf(key) > -1) {
            ret = formatValue(value.split(', '), key);
        } else {
            ret = value;
        }
        return ret;
    }

    function prepareValue(value, key) {
        var ret;
        if(key == 'alternativeTitles') {
            ret = value || '';
        } else if (listKeys.indexOf(key) > -1) {
            ret = value ? value.join(', ') : [''];
        } else {
            ret = value || '';
        }
        return ret;
    }

    function getBlock(keys) {
        var $div;
        if (canEdit || keys.filter(function(key) { return data[key]; })) {
            $div = $('<div>').css(css);
            keys.forEach(function(key, i) {
                if (canEdit || data[key]) {
                    $div.children().length && $('<span>').html(';&nbsp;').appendTo($div);
                    $('<span>')
                        .html(formatKey(key))
                        .appendTo($div);
                    Ox.EditableContent({
                            clickLink: pandora.clickLink,
                            format: function(value) {
                                return formatEditableValue(value, key);
                            },
                            placeholder: formatLight('unknown'),
                            tooltip: canEdit ? 'Doubleclick to edit' : '',
                            value: prepareValue(data[key], key)
                        })
                        .bindEvent({
                            submit: function(event) {
                                editMetadata(key, event.value);
                            }
                        })
                        .appendTo($div);
                }
            });
        }
        return $div;
    }

    function deleteItem() {
        pandora.ui.deleteItemDialog(data).open();
    }

    function editMetadata(key, value) {
        if (value != data[key]) {
            var edit = {id: data.id};
            if (key == 'title') {
                Ox.extend(edit, parseTitle(value));
            } else if (listKeys.indexOf(key) > -1) {
                edit[key] = value ? value.split(', ') : [];
            } else {
                edit[key] = value;
            }
            pandora.api.edit(edit, function(result) {
                var src;
                data[key] == result.data[key];
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
            });
        }
    }

    function formatKey(key, isStatistics) {
        if (key == 'alternativeTitles') {
            key = 'Alternative Title' + (data.alternativeTitles && data.alternativeTitles.length == 1 ? '' : 's');
        } else if (key == 'actor') {
            key = 'Actors';
        } else if (key == 'imdbId') {
            key = 'IMDb ID';
        }
        return isStatistics
            ? $('<div>').css({marginBottom: '4px', fontWeight: 'bold'})
                .html(Ox.toTitleCase(key).replace(' Per ', ' per '))
            : '<span style="font-weight: bold">' + Ox.toTitleCase(key) + ':</span> ';
    }

    function formatLight(str) {
        return '<span class="OxLight">' + str + '</span>';
    }

    function formatTitle(title) {
        var match = /(.+) (\(S\d{2}E\d{2}\))/.exec(title);
        if (match) {
            title = formatValue(match[1], 'title') + ' '
                + formatLight(match[2])
                + title.substr(match[0].length);
        }
        return title + (
            data.originalTitle && data.originalTitle != title
            ? ' ' + formatLight('(' + data.originalTitle + ')') : ''
        );
    }

    function formatValue(value, key) {
        return (Ox.isArray(value) ? value : [value]).map(function(value) {
            return key ?
                '<a href="/' + key + '=' + value + '">' + value + '</a>'
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

    function parseTitle(title) {
        var data = {title: title},
            match = /(\(S(\d{2})E(\d{2})\))/.exec(title),
            split;
        if (match) {
            data.season = parseInt(match[2], 10);
            data.episode = parseInt(match[3], 10);
            split = title.split(match[1]);
            data.seriesTitle = split[0].trim();
            data.episodeTitle = split[1].trim();
        }
        return data;
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

    function renderList() {
        pandora.api.get({
            id: data.id,
            keys: [ui.icons == 'posters' ? 'posters' : 'frames']
        }, 0, function(result) {
            var images = result.data[ui.icons == 'posters' ? 'posters' : 'frames'].map(function(image) {
                    return Ox.extend(image, {index: image.index.toString()});
                }),
                selectedImage = images.filter(function(image) {
                    return image.selected;
                })[0];
            $list = Ox.IconList({
                    defaultRatio: ui.icons == 'posters' || !data.stream ? 5/8 : data.stream.aspectratio,
                    fixedRatio: ui.icons == 'posters' || !data.stream ? false : data.stream.aspectratio,
                    item: function(data, sort, size) {
                        var ratio = data.width / data.height;
                        size = size || 128;
                        return {
                            height: ratio <= 1 ? size : size / ratio,
                            id: data['id'],
                            info: data.width + ' x ' + data.height + ' px',
                            title: ui.icons == 'posters' ? data.source : Ox.formatDuration(data.position),
                            url: data.url.replace('http://', '//'),
                            width: ratio >= 1 ? size : size * ratio
                        }
                    },
                    items: images,
                    keys: ui.icons == 'posters'
                        ? ['index', 'source', 'width', 'height', 'url']
                        : ['index', 'position', 'width', 'height', 'url'],
                    max: 1,
                    min: 1,
                    orientation: 'both',
                    // fixme: should never be undefined
                    selected: selectedImage ? [selectedImage['index']] : [],
                    size: 128,
                    sort: [{key: 'index', operator: '+'}],
                    unique: 'index'
                })
                .addClass('OxMedia')
                .css({
                    display: 'block',
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    width: listWidth + 'px',
                    height: pandora.$ui.contentPanel.size(1) + 'px'
                })
                .bindEvent({
                    select: function(event) {
                        var index = event.ids[0];
                        selectedImage = images.filter(function(image) {
                            return image.index == index;
                        })[0];
                        var imageRatio = selectedImage.width / selectedImage.height,
                            src = selectedImage.url.replace('http://', '//');
                        if ($browserImages.length == 0) {
                            $browserImages = pandora.$ui.browser.find('img[src*="/' + data.id + '/"]');
                        }
                        if (ui.icons == 'posters' && !ui.showSitePosters) {
                            $browserImages.each(function() {
                                var $this = $(this),
                                    size = Math.max($this.width(), $this.height());
                                $this.attr({src: src});
                                ui.icons == 'posters' && $this.css(imageRatio < 1 ? {
                                    width: Math.round(size * imageRatio) + 'px',
                                    height: size + 'px'
                                } : {
                                    width: size + 'px',
                                    height: Math.round(size / imageRatio) + 'px'
                                });
                            });
                            $icon.attr({src: src});
                            $reflectionIcon.attr({src: src});
                            iconRatio = imageRatio;
                            iconSize = iconSize == 256 ? 512 : 256;
                            toggleIconSize();
                        }
                        pandora.api[ui.icons == 'posters' ? 'setPoster' : 'setPosterFrame'](Ox.extend({
                            id: data.id
                        }, ui.icons == 'posters' ? {
                            source: selectedImage.source
                        } : {
                             // fixme: api slightly inconsistent, this shouldn't be "position"
                            position: selectedImage.index
                        }), function() {
                            // fixme: update the info (video preview) frame as well
                            var src;
                            pandora.clearIconCache(data.id);
                            Ox.Request.clearCache();
                            if (ui.icons == 'frames') {
                                src = '/' + data.id + '/icon512.jpg?' + Ox.uid()
                                $icon.attr({src: src});
                                $reflectionIcon.attr({src: src});
                            }
                            $browserImages.each(function() {
                                $(this).attr({src: '/' + data.id + '/' + (
                                    ui.icons == 'posters' ? 'poster' : 'icon'
                                ) + '128.jpg?' + Ox.uid()});
                            });
                        });
                    }
                })
                .appendTo($info);
            $list.size();
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
                    }).filter(function(rightsLevel) {
                        return (!copyright && rightsLevel.title != 'Under Copyright')
                            || (copyright && rightsLevel.title != 'Out of Copyright');
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
