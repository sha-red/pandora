'use strict';

pandora.ui.infoView = function(data, isMixed) {
    isMixed = isMixed || {};

    var ui = pandora.user.ui,
        isMultiple = arguments.length == 2,
        canEdit = pandora.hasCapability('canEditMetadata') || isMultiple || data.editable,
        canRemove = pandora.hasCapability('canRemoveItems'),
        canSeeAllMetadata = pandora.user.level != 'guest',
        css = {
            marginTop: '4px',
            textAlign: 'justify'
        },
        iconRatio = ui.icons == 'posters' ? (
            ui.showSitePosters ? pandora.site.posters.ratio : data.posterRatio
        ) : 1,
        iconSize = isMultiple ? 0 : ui.infoIconSize,
        iconWidth = isMultiple ? 0 : iconRatio > 1 ? iconSize : Math.round(iconSize * iconRatio),
        iconHeight = iconRatio < 1 ? iconSize : Math.round(iconSize / iconRatio),
        iconLeft = iconSize == 256 ? Math.floor((iconSize - iconWidth) / 2) : 0,
        borderRadius = ui.icons == 'posters' ? 0 : iconSize / 8,
        isCopyrighted = !data.year || parseInt(data.year) + 60 >= new Date().getFullYear(),
        listWidth = 0,
        margin = 16,
        // these may contain commas, and are thus separated by semicolons
        specialListKeys = ['alternativeTitles', 'productionCompany'],
        nameKeys = pandora.site.itemKeys.filter(function(key) {
            return key.sortType == 'person';
        }).map(function(key) {
            return key.id;
        }),
        listKeys = pandora.site.itemKeys.filter(function(key) {
            return Ox.isArray(key.type) && !Ox.contains(specialListKeys, key.id);
        }).map(function(key){
            return key.id;
        }),
        posterKeys = ['title', 'director', 'year'],
        descriptions = {
            names: getNames(),
            studios: getStudios()
        },
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
                        id: 'imdb',
                        title: Ox._('Update IMDb ID...'),
                        disabled: !canEdit
                    },
                    {
                        id: 'metadata',
                        title: Ox._('Update Metadata...'),
                        disabled: !canEdit
                    },
                    {},
                    {
                        id: 'upload',
                        title: Ox._('Upload Video...'),
                        disabled: !pandora.hasCapability('canAddItems')
                    },
                    {},
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
                    if (data_.id == 'imdb') {
                        pandora.$ui.idDialog = pandora.ui.idDialog(data).open();
                    } else if (data_.id == 'metadata') {
                        pandora.$ui.metadataDialog = pandora.ui.metadataDialog(data).open();
                    } else if (data_.id == 'upload') {
                        pandora.$ui.addItemDialog = pandora.ui.addItemDialog({
                            item: pandora.user.ui.item,
                            selected: 'upload'
                        }).open();
                    } else if (data_.id == 'delete') {
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
                    element: '<img>'
                })
                .attr({
                    src: pandora.getMediaURL('/' + data.id + '/' + (
                        ui.icons == 'posters' ? 'poster' : 'icon'
                    ) + '512.jpg?' + data.modified)
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
                    height: Math.round(iconSize / 2) + 'px',
                    overflow: 'hidden'
                })
                .appendTo($info),

            $reflectionIcon = $('<img>')
                .attr({
                    src: pandora.getMediaURL('/' + data.id + '/' + (
                        ui.icons == 'posters'
                        ? (ui.showSitePosters ? 'siteposter' : 'poster') : 'icon'
                    ) + '512.jpg?' + data.modified)
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
                    height: Math.round(iconSize / 2) + 'px'
                })
                .appendTo($reflection);
        }

        var $text = Ox.Element()
            .addClass('OxTextPage')
            .css({
                position: 'absolute',
                left: margin + (iconSize == 256 ? 256 : iconWidth) + margin + 'px',
                top: margin + 'px',
                right: margin + statisticsWidth + margin + 'px'
            })
            .appendTo($info),

        $alternativeTitles,

        $minutes,

        $imdb,

        $links,

        $descriptions,

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

    // Title -------------------------------------------------------------------
    if (!isMultiple) {

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
                    tooltip: canEdit ? pandora.getEditTooltip() : '',
                    value: data.title
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
    }

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
                        placeholder: formatLight(Ox._(isMixed.director ? 'Mixed Director' : 'Unknown Director')),
                        tooltip: canEdit ? pandora.getEditTooltip() : '',
                        value: data.director ? data.director.join(', ') : ''
                    })
                    .css({
                        marginBottom: '-3px',
                        fontWeight: 'bold',
                        fontSize: '13px'
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

    renderGroup(canSeeAllMetadata ? ['genre', 'topic'] : ['genre']);

    renderGroup([
        'censorshipcertificatenumber',
        'dateofcensorcertificate',
        'censorshipcertificatecentre',
        'ratingcertificate',
        'length',
        'numberofreels',
        'format',
        'releasedate'
    ]);

    renderGroup(['imdbId', 'links']);

    if (canEdit) {
        updateIMDb();
    }

    // Encyclopedia and Wiki ---------------------------------------------------

    if (['staff', 'admin'].indexOf(pandora.user.level) > -1 && canEdit) {
        renderGroup(['encyclopedia', 'wiki']);
    }

    // Summary -----------------------------------------------------------------

    if (data.summary || canEdit) {
        Ox.EditableContent({
                clickLink: pandora.clickLink,
                collapseToEnd: false,
                editable: canEdit,
                format: function(value) {
                    return value.replace(
                        /<img src=/g,
                        '<img style="float: left; max-width: 256px; max-height: 256px; margin: 0 16px 16px 0" src='
                    );
                },
                placeholder: formatLight(Ox._(isMixed.summary ? 'Mixed Summary' : 'No Summary')),
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
                submit: function(data) {
                    editMetadata('summary', data.value);
                }
            })
            .appendTo($text);
    }

    // Extra Metadata
    var extra = renderGroup([
        'presentedby',
        'coproducer',
        'associateproducer',
        'executiveproducer',
        'associatedirector',
        'chiefassistantdirector',
        'assistantdirector',
        'story',
        'screenplay',
        'dialogue',
        'adaptation'
    ])
    extra && extra.css({marginTop: '12px'});
    renderGroup([
        'musicdirector',
        'backgroundmusic',
        'orchestration',
        'arranger',
        'singer',
        'sounddesign',
        'soundrecording',
        'rerecording',
        'musiclabel'
    ]);
    renderGroup([
        'assistantcinematographer',
        'artdirector',
        'costumedesign',
        'productiondesign',
        'specialeffects',
        'animation',
        'coeditor',
        'stills',
        'publicitydesign',
        'makeup',
        'hairstyles',
        'dancedirector',
        'productioncontroller',
        'stuntdirector',
        'continuity',
        'publicity',
        'laboratory'
    ]);
    renderGroup([
        'courtesy',
        'subtitledby',
        'annotatedby',
    ]);

    // Songs
    if (data.songs || canEdit) {
        Ox.EditableContent({
                clickLink: pandora.clickLink,
                collapseToEnd: false,
                editable: canEdit,
                format: function(value) {
                    return value.replace(
                        /<img src=/g,
                        '<img style="float: left; max-width: 256px; max-height: 256px; margin: 0 16px 16px 0" src='
                    );
                },
                placeholder: formatLight(Ox._(isMixed.songs ? 'Mixed Songs' : 'No Songs')),
                tooltip: canEdit ? pandora.getEditTooltip() : '',
                type: 'textarea',
                value: data.songs || ''

            })
            .css(css)
            .css({
                marginTop: '12px',
                overflow: 'hidden'
            })
            .bindEvent({
                submit: function(data) {
                    editMetadata('songs', data.value);
                }
            })
            .appendTo($text);
    }

    // Descriptions ------------------------------------------------------------
    if (!isMultiple) {

    $descriptions = $('<div>').attr({id: 'descriptions'}).appendTo($text);

    renderDescriptions();

    $('<div>').css({height: '16px'}).appendTo($text);

    // Documents ---------------------------------------------------------------

    var $div = $('<div>')
         .css({marginBottom: '4px'})
         .append(formatKey(
             'Documents', 'link', '/' + data['id'] + '/documents'
         ))
         .append(
             Ox.Theme.formatColor(null, 'gradient')
                 .css({textAlign: 'right'})
                 .html(Ox.formatNumber(data.numberofdocuments || 0))
         )
         .appendTo($statistics);

    pandora.createLinks($div);

    if (data.parts && data.rendered) {

        // Annotations ---------------------------------------------------------

        $div = $('<div>')
            .css({marginBottom: '4px'})
            .append(formatKey(
                 'Annotations', 'link', '/' + data['id'] + '/' + ui.videoView
            ))
            .append(
                Ox.Theme.formatColor(null, 'gradient')
                    .css({textAlign: 'right'})
                    .html(Ox.formatNumber(data.numberofannotations || 0))
            )
            .appendTo($statistics);

        pandora.createLinks($div);

        // Duration, Aspect Ratio ----------------------------------------------

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

        // Hue, Saturation, Lightness, Volume ----------------------------------

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

        // Cuts per Minute, Words per Minute -----------------------------------

        ['cutsperminute', 'wordsperminute'].forEach(function(key) {
            var value = data[key] || 0;
            $('<div>')
                .css({marginBottom: '4px'})
                .append(
                    formatKey(Ox.toTitleCase(key.slice(0, -9)) + ' per Minute', 'statistics')
                )
                .append(
                    Ox.Theme.formatColor(null, 'gradient')
                        .css({textAlign: 'right'})
                        .html(Ox.formatNumber(value, 3))
                )
                .appendTo($statistics);
        });

    } else {
        // no video placeholder
    }

    }

    // Rights Level ------------------------------------------------------------

    var $rightsLevel = $('<div>');
    var $div = $('<div>')
        .css({marginBottom: '4px'})
        .append(formatKey('Rights Level', 'link', '/copyrights'))
        .append($rightsLevel)
        .appendTo($statistics);
    pandora.createLinks($div);
    renderRightsLevel();

    // Comments ----------------------------------------------------------------

    if (canEdit) {
        $('<div>')
            .css({marginBottom: '4px'})
            .append(
                formatKey('Comments', 'statistics').options({
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
                        clickLink: pandora.clickLink,
                        placeholder: formatLight(Ox._(isMixed.comments ? 'Mixed comments' : 'No comments')),
                        tooltip: pandora.getEditTooltip(),
                        type: 'textarea',
                        value: data.comments || '',
                        width: 128
                    })
                    .bindEvent({
                        submit: function(event) {
                            editMetadata('comments', event.value);
                        }
                    })
            )
            .appendTo($statistics);
    }

    $('<div>').css({height: '16px'}).appendTo($statistics);

    function editMetadata(key, value) {
        if (value != data[key]) {
            var edit = {id: isMultiple ? ui.listSelection : data.id};
            if (key == 'alternativeTitles') {
                edit[key] = value ? Ox.decodeHTMLEntities(value).split('; ').map(function(value) {
                    return [Ox.encodeHTMLEntities(value), []];
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
            } else if (specialListKeys.indexOf(key) > -1) {
                edit[key] = value
                    ? Ox.decodeHTMLEntities(value).split('; ').map(Ox.encodeHTMLEntities)
                    : [];
            } else if (key == 'imdbId') {
                edit[key] = value.match(/\d{7}/)[0];
            } else if (key == 'dateofcensorcertificate') {
                if (/\d{2}-\d{2}-\d{4}/.test(value)) {
                    value = Ox.reverse(value.split('-')).join('-')
                }
                edit[key] = value;
            } else {
                edit[key] = value;
            }
            pandora.api.edit(edit, function(result) {
                if (!isMultiple) {
                    var src;
                    data[key] = result.data[key];
                    if (result.data.id != data.id) {
                        Ox.Request.clearCache(); // fixme: too much
                        pandora.UI.set({item: result.data.id});
                        pandora.$ui.browser.value(data.id, 'id', result.data.id);
                    } else {
                        Ox.Request.clearCache('autocomplete');
                    }
                    pandora.updateItemContext();
                    pandora.$ui.browser.value(result.data.id, key, result.data[key]);
                    if (Ox.contains(posterKeys, key) && ui.icons == 'posters') {
                        src = pandora.getMediaURL('/' + data.id + '/poster512.jpg?' + Ox.uid());
                        $icon.attr({src: src});
                        $reflectionIcon.attr({src: src});
                    }
                    if (Ox.contains(nameKeys, key)) {
                        data['namedescription'] = result.data['namedescription'];
                        descriptions.names = getNames();
                        renderDescriptions();
                    } else if (key == 'productionCompany') {
                        data['productionCompanydescription'] = result.data['productionCompanydescription'];
                        descriptions.studios = getStudios();
                        renderDescriptions();
                    } else if (key == 'imdbId') {
                        updateIMDb();
                    }
                }
                that.triggerEvent('change', Ox.extend({}, key, value));
            });
        }
    }

    function formatKey(key, mode, link) {
        var item = Ox.getObjectById(pandora.site.itemKeys, key);
        key = Ox._(item ? item.title : key);
        mode = mode || 'text';
        if (key == 'alternativeTitles') {
            key = Ox._('Alternative Title' + (
                data.alternativeTitles && data.alternativeTitles.length == 1 ? '' : 's'
            ));
        } else if (key == 'keyword') {
            key = 'keywords'
        }
        var value = Ox.toTitleCase(key)
            .replace(' Of ', ' of ')
            .replace(' Per ', ' per ')
        return mode == 'text'
            ? '<span style="font-weight: bold">' + value + ':</span> '
            : mode == 'description'
            ? value
            : mode == 'link'
            ? Ox.Element()
                .css({marginBottom: '4px', fontWeight: 'bold'})
                .html('<a href="' + link + '">' + value + '</a>')
            : Ox.Element()
                .css({marginBottom: '4px', fontWeight: 'bold'})
                .html(value);
    }

    function formatLight(str) {
        return '<span class="OxLight">' + str + '</span>';
    }

    function formatLink(value, key) {
        return (Ox.isArray(value) ? value : [value]).map(function(value) {
            return key
                ? '<a href="/' + (
                    key == 'alternativeTitles' ? 'title' : key
                ) + '=' + pandora.escapeQueryValue(value) + '">' + value + '</a>'
                : value;
        }).join(Ox.contains(specialListKeys, key) ? '; ' : ', ');
    }

    function formatTitle(title) {
        var match = /(.+) (\(S\d{2}(E\d{2})?\))/.exec(title);
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
        if (key == 'year') {
            ret = formatLink(value, 'year');
        } else if (['releasedate', 'dateofcensorcertificate'].indexOf(key) > -1) {
            ret = value ? Ox.formatDate(value,
                ['', '%Y', '%B %Y', '%B %e, %Y'][value.split('-').length],
                true
            ) : '';
        } else if (key == 'links') {
            ret = value.split(', ').map(function(link) {
                return '<a href="' + link + '">' + Ox.parseURL(link).host + '</a>';
            }).join(', ');

        } else if (nameKeys.indexOf(key) > -1) {
            ret = formatLink(value.split(', '), 'name');
        } else if (listKeys.indexOf(key) > -1) {
            ret = formatLink(value.split(', '), key);
        } else if (specialListKeys.indexOf(key) > -1) {
            ret = formatLink(
                Ox.decodeHTMLEntities(value).split('; ').map(Ox.encodeHTMLEntities),
                key
            );
        } else if (key == 'imdbId') {
            ret = '<a href="http://www.imdb.com/title/tt'
                + value + '">' + value + '</a>';
        } else if (key == 'encyclopedia') {
            ret = '<a href="/texts/indiancine.ma:Encyclopedia%20of%20Indian%20Cinema/'
                + (value == 'Summary' ? '240' : '570') + '">'
                + value + '</a>';
        } else if (key == 'wiki') {
            ret = '<a href="' + value + '">'
                + Ox.decodeURIComponent(value.split('wiki/').pop()) + '</a>';
        } else {
            ret = value;
        }
        return ret;
    }

    function getFilmography(key, value, roles, callback) {
        var keys = ['id', 'title', 'year'].concat(
                key == 'name' ? nameKeys : []
            );
        pandora.api.find({
            keys: keys,
            query: {
                conditions: [{key: key, operator: '==', value: value}],
                operator: '&'
            },
            sort: [
                {key: 'year', operator: '+'},
                {key: 'title', operator: '+'},
                {key: 'director', operator: '+'}
            ],
            range: [0, 1000000]
        }, function(result) {
            var $element = Ox.Element('<span>'),
                items = {};
            if (result.data.items) {
                result.data.items.forEach(function(item) {
                    var year = item.year || Ox._('Unknown Year');
                    if (key == 'name' && result.data.items.length > 1) {
                        item.roles = nameKeys.filter(function(nameKey) {
                            return item[nameKey] && Ox.contains(item[nameKey], value);
                        });
                        if (roles.length == 1 && Ox.isEqual(item.roles, roles)) {
                            delete item.roles;
                        } else {
                            item.roles = item.roles.map(function(nameKey) {
                                return Ox.getObjectById(pandora.site.itemKeys, nameKey).title;
                            });
                        }
                    }
                    if (!items[year]) {
                        items[year] = [];
                    }
                    items[year].push(item);
                });
            }
            $element.html(
                Object.keys(items).sort().map(function(year) {
                    return '<b>' + year + ':</b> ' + items[year].map(function(item) {
                        return '<a href="/' + item.id + '">' + item.title + '</a>'
                            + (item.roles ? ' (' + item.roles.join(', ') + ')' : '');
                    }).join(', ');
                }).join(', ')
            );
            pandora.createLinks($element);
            callback($element);
        });
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
                return Ox._(rightsLevel.name);
            })
        );
    }

    function getStudios() {
        var studios = [];
        if (data.productionCompany) {
            data.productionCompany.forEach(function(studio) {
                studios.push({
                    name: studio,
                    keys: ['productionCompany'],
                    description: data.productionCompanydescription
                        ? data.productionCompanydescription[studio]
                        : void 0
                });
            });
        }
        return studios;
    }

    function getValue(key, value) {
        return !value ? ''
            : key == 'alternativeTitles' ? value.map(function(value) {
                return value[0];
            }).join('; ')
            : key == 'runtime' ? Math.round(value / 60)
            : Ox.contains(listKeys, key) ? value.join(', ')
            : Ox.contains(specialListKeys, key) ? value.join('; ')
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
                    return Ox._(Ox.toTitleCase(userLevel));
                }), [0, 240]);
                Ox.Label({
                        textAlign: 'center',
                        title: Ox._(Ox.toTitleCase(userLevel)),
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
                        tooltip: Ox._('{0} '
                            + (hasCapability ? 'can' : 'can\'t') + ' '
                            + Ox.toSlashes(capability.name)
                                .split('/').slice(1).join(' ')
                                .toLowerCase()
                                .replace('see item', 'see the item')
                                .replace('play video', 'play the full video')
                                .replace('download video', 'download the video'),
                            [canEdit ? Ox._(Ox.toTitleCase(userLevel)) : Ox._('You')]),
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
                        pandora.UI.set({page: 'copyrights'});
                    }
                })
                .appendTo($line);
            }
        });
    }

    function renderDescriptions() {
        $descriptions.empty();
        ['studios', 'names'].forEach(function(key) {
            descriptions[key].forEach(function(value) {
                if (canEdit || value.description) {
                    var filmography = key == 'studios' ? Ox._('Films') : Ox._('Filmography'),
                        $name = Ox.Element()
                            .addClass('OxSelectable')
                            .css(css)
                            .css({marginTop: '12px', fontWeight: 'bold'})
                            .html(
                                formatLink(
                                    value.name,
                                    key == 'studios' ? 'productionCompany' : 'name'
                                ) + ' (' + value.keys.map(function(key) {
                                    return formatKey(key, 'description');
                                }).join(', ') + ') -&nbsp;'
                            )
                            .appendTo($descriptions),
                        $link = $('<span>')
                            .addClass('OxLink')
                            .css({fontWeight: 'bold'})
                            .html(Ox._('Show {0}', [filmography]))
                            .one({
                                click: function() {
                                    $link.removeClass('OxLink')
                                        .html(Ox._('Loading {0}...', [filmography]));
                                    getFilmography(
                                        key == 'studios' ? 'productionCompany' : 'name',
                                        Ox.decodeHTMLEntities(value.name),
                                        value.keys,
                                        function($element) {
                                            $link.addClass('OxLink')
                                                .html(Ox._('Hide {0}', [filmography]))
                                                .on({
                                                    click: function() {
                                                        if (Ox.startsWith($link.html(), Ox._('Show'))) {
                                                            $link.html(Ox._('Hide {0}', [filmography]));
                                                            $text.show();
                                                        } else {
                                                            $link.html(Ox._('Show {0}', [filmography]));
                                                            $text.hide();
                                                        }
                                                    }
                                                });
                                            $text.append($element).show();
                                        }
                                    );
                                }
                            })
                            .appendTo($name),
                        $text = $('<div>')
                            .addClass('OxSelectable')
                            .css(css)
                            .hide()
                            .appendTo($descriptions);
                    pandora.createLinks($name);
                    Ox.EditableContent({
                            clickLink: pandora.clickLink,
                            editable: canEdit,
                            format: function(value) {
                                return value.replace(
                                    /<img /g,
                                    '<img style="max-width: 256px; max-height: 256px; margin: 0 16px 16px 0; float: left;" '
                                );
                            },
                            placeholder: formatLight(Ox._('No Description')),
                            tooltip: canEdit ? pandora.getEditTooltip() : '',
                            type: 'textarea',
                            value: value.description || ''
                        })
                        .css(css)
                        .css({
                            overflow: 'hidden'
                        })
                        .bindEvent({
                            submit: function(data) {
                                editMetadata(
                                    key == 'studios'
                                    ? 'productionCompanydescription'
                                    : 'namedescription',
                                    Ox.extend({}, value.name, data.value)
                                );
                            }
                        })
                        .appendTo($descriptions);
                }
            });
        });
    }

    function renderGroup(keys) {
        var $element;
        if (canEdit || keys.filter(function(key) {
            return data[key];
        }).length) {
            $element = $('<div>').addClass('OxSelectable').css(css);
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
                            placeholder: formatLight(Ox._(isMixed[key] ? 'mixed': 'unknown')),
                            tooltip: canEdit ? pandora.getEditTooltip() : '',
                            value: getValue(key, data[key])
                        })
                        .bindEvent({
                            edit: function() {
                                key == 'runtime' && $minutes.show();
                            },
                            submit: function(data) {
                                if (key == 'encyclopedia') {
                                    data.value = ['Index', 'Summary'].indexOf(data.value) > -1
                                        ? data.value
                                        : '';
                                    this.options({
                                        value: data.value
                                    });
                                }

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
                        $imdb = Ox.Element('<span>')
                            .appendTo($element);
                        pandora.createLinks($imdb);
                    }
                }
            });
            $element.appendTo($text);
        }
        return $element;
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
                            title: Ox._(rightsLevel.name),
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
                        // renderCapabilities(rightsLevel);
                        var edit = {
                            id: isMultiple ? ui.listSelection : data.id,
                            rightslevel: rightsLevel
                        };
                        pandora.api.edit(edit, function(result) {
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
        /*
        if (data.parts) {
            $capabilities = $('<div>').appendTo($rightsLevel);
            renderCapabilities(data.rightslevel);
        }
        */
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
                    conditions: [{key: 'imdbId', operator: '==', value: data.imdbId}]
                }
            }, function(result) {
                if (result.data.items == 1) {
                    $imdb.empty();
                } else {
                    $imdb.html(
                        '&nbsp;(<a href="/imdbId=' + data.imdbId + '">'
                        + result.data.items + ' '
                        + pandora.site.itemName.plural.toLowerCase()
                        + '</a> ' + Ox._('with the same IMDb ID') + '</a>)'
                    );
                }
            });
        } else {
            $imdb.empty();
        }
    }

    that.reload = function() {
        var src = pandora.getMediaURL('/' + data.id + '/' + (
            ui.icons == 'posters' ? 'poster' : 'icon'
        ) + '512.jpg?' + Ox.uid());
        $icon.attr({src: src});
        $reflectionIcon.attr({src: src});
        iconSize = iconSize == 256 ? 512 : 256;
        iconRatio = ui.icons == 'posters'
            ? (ui.showSitePosters ? pandora.site.posters.ratio : data.posterRatio) : 1;
        toggleIconSize();
    };

    that.resizeElement = function() {
        // overwrite splitpanel resize
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
