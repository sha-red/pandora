pandora.ui.infoView = function(data) {

    // fixme: given that currently, the info view doesn't scroll into view nicely
    // when collapsing the movies browser, the info view should become a split panel

    var ui = pandora.user.ui,
        canEdit = pandora.site.capabilities.canEditMetadata[pandora.user.level],
        borderRadius = ui.icons == 'posters' ? 0 : iconSize / 8,
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

        $icon = Ox.Element('<img>')
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

        $text = $('<div>')
            .css({
                position: 'absolute',
                left: margin + (iconSize == 256 ? 256 : iconWidth) + margin + 'px',
                top: margin + 'px',
                right: margin + statisticsWidth + margin + 'px'
            })
            .bind({
                click: function(e) {
                    var $target = $(e.target);
                    if ($target.is('a')) {
                        pandora.URL.set($target.attr('href'));
                        return false;
                    }
                }
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

        $browserImages = [];

    var match = /(\(S\d{2}(E\d{2})?\))/.exec(data.title);
    if (match) {
        data.title = data.title.replace(match[0], formatLight(match[0]));
    }

    $('<div>')
        .css({
            marginTop: '-2px',
            fontWeight: 'bold',
            fontSize: '13px',
            MozUserSelect: 'text',
            WebkitUserSelect: 'text'
        })
        .html(
            data.title + (
                data.originalTitle && data.originalTitle != data.title
                ? ' ' + formatLight('(' + data.originalTitle + ')') : ''
            )
        )
        .appendTo($text);

    data.director && $('<div>')
        .css({
            marginTop: '2px',
            fontWeight: 'bold',
            fontSize: '13px',
            MozUserSelect: 'text',
            WebkitUserSelect: 'text'
        })
        .html(formatValue(data.director, 'name'))
        .appendTo($text);

    if (data.country || data.year || data.language || data.runtime || pandora.user.level == 'admin') {
        var $div = $('<div>')
            .css(css)
            .appendTo($text);
        var html = [];
        ['country', 'year', 'language', 'runtime'].forEach(function(key) {
            if (data[key] || (['country', 'year'].indexOf(key) > -1 && pandora.user.level == 'admin')) {
                var value = data[key] || formatLight('unknown');
                html.push(
                    formatKey(key)
                    + (key == 'runtime'
                    ? Math.round(value / 60) + ' min'
                    : formatValue(value, key == 'runtime' || !data[key] ? null : key))
                );
            }
        });
        $div.html(html.join('; '));
    }

    data.alternativeTitles && $('<div>')
        .css(css)
        .html(
            formatKey('Alternative Titles') + data.alternativeTitles.map(function(value) {
                return value[0] + (value[1] ? ' '
                    + formatLight('(' + value[1] + ')') : '');
            }).join(', ')
        )
        .appendTo($text);

    // fixme: episodeDirector seems to be always missing
    if (data.episodeDirector || data.writer || data.producer || data.cinematographer || data.editor) {
        $div = $('<div>')
            .css(css)
            .appendTo($text);
        html = [];
        ['episodeDirector', 'writer', 'producer', 'cinematographer', 'editor'].forEach(function(key) {
            data[key] && html.push(
                formatKey(key == 'episodeDirector' ? 'director' : key) + formatValue(data[key], 'name')
            );
        });
        $div.html(html.join('; '));
    }

    data.cast && $('<div>')
        .css(css)
        .html(
            formatKey('cast') + data.cast.map(function(value) {
                value.character = value.character.replace('(uncredited)', '').trim();
                return formatValue(value.actor, 'name')
                    + (value.character ? ' '
                    + formatLight('(' + formatValue(value.character) + ')')
                    : '');
            }).join(', ')
        )
        .appendTo($text);

    if (data.genre || data.keyword) {
        $div = $('<div>')
            .css(css)
            .appendTo($text);
        html = [];
        ['genre', 'keywords'].forEach(function(key) {
            data[key] && html.push(
                formatKey(key)
                + formatValue(data[key], key)
            );
        });
        $div.html(html.join('; '));
    }

    data.summary && $('<div>')
        .css(css)
        .html(
            formatKey('summary') + data.summary
        )
        .appendTo($text);

    data.trivia && data.trivia.forEach(function(value) {
        $('<div>')
            .css({
                display: 'table-row'
            })
            .append(
                $('<div>')
                    .css({
                        display: 'table-cell',
                        width: '12px',
                        paddingTop: '4px'
                    })
                    .html('<span style="font-weight: bold">&bull;</span>')
            )
            .append(
                $('<div>')
                    .css({
                        display: 'table-cell',
                        paddingTop: '4px',
                        textAlign: 'justify',
                        MozUserSelect: 'text',
                        WebkitUserSelect: 'text'
                    })
                    .html(value)
            )
            .append(
                $('<div>').css({clear: 'both'})
            )
            .appendTo($text);
    });

    data.filmingLocations && $('<div>')
        .css(css)
        .html(
            formatKey('Filming Locations') + data.filmingLocations.map(function(location) {
                return  '<a href="/map/@' + location + '">' + location + '</a>'
            }).join(', ')
        )
        .appendTo($text);

    data.releaseDate && $('<div>')
        .css(css)
        .html(
            formatKey('Release Date') + Ox.formatDate(data.releaseDate, '%A, %B %e, %Y')
        )
        .appendTo($text);

    if (data.budget || data.gross || data.profit) {
        $div = $('<div>')
            .css(css)
            .appendTo($text);
        html = [];
        ['budget', 'gross', 'profit'].forEach(function(key) {
            data[key] && html.push(
                formatKey(key) + Ox.formatCurrency(data[key], '$')
            );
        });
        $div.html(html.join('; '));
    }

    if (data.rating || data.votes) {
        $div = $('<div>')
            .css(css)
            .appendTo($text);
        html = [];
        ['rating', 'votes'].forEach(function(key) {
            data[key] && html.push(
                formatKey(key) + Ox.formatNumber(data[key])
            );
        });
        $div.html(html.join('; '));
    }

    if (data.connections) {
        $div = $('<div>')
            .css(css)
            .appendTo($text);
        html = [];
        [
            'Edited from', 'Edited into',
            'Features', 'Featured in',
            'Follows', 'Followed by',
            'References', 'Referenced in',
            'Remake of', 'Remade as',
            'Spin off from', 'Spin off',
            'Spoofs', 'Spoofed in'
        ].forEach(function(key) {
            data.connections[key] && html.push(
                formatKey(key) + data.connections[key].map(function(connection) {
                    return connection.item
                        ? '<a href="/' + connection.item + '">' + connection.title + '</a>'
                        : connection.title;
                }).join(', ')
            );
        });
        $div.html(html.join('; '));
    }

    ['reviews', 'links'].forEach(function(key) {
        data[key] && $('<div>')
            .css(css)
            .html(
                formatKey(key) + data[key].map(function(value) {
                    return '<a href="' + value.url + '">' + value.source + '</a>'
                }).join(', ')
            )
            .appendTo($text);
    });
    
    $('<div>').css({height: '8px'}).appendTo($text);

    pandora.createLinks($text);

    ['hue', 'saturation', 'lightness', 'volume'].forEach(function(key) {
        $('<div>')
            .css({marginBottom: '4px'})
            .append(formatKey(key, true))
            .append(Ox.formatColor(data[key] || 0, key == 'volume' ? 'lightness' : key))
            .appendTo($statistics);
    });

    var $rightsLevel = $('<div>');
    $('<div>')
        .css({marginBottom: '4px'})
        .append(formatKey('Rights Level', true))
        .append($rightsLevel)
        .appendTo($statistics);
    renderRightsLevel();

    if (canEdit) {
        $icon.bindEvent({
            doubleclick: function() {
                pandora.UI.set('showIconBrowser', !ui.showIconBrowser);
                $info.animate({
                    left: ui.showIconBrowser ? 0 : -listWidth + 'px'
                }, 250);
            }
        });
        renderList();
    }

    function formatKey(key, isStatistics) {
        return isStatistics
            ? $('<div>').css({marginBottom: '2px', fontWeight: 'bold'}).html(Ox.toTitleCase(key))
            : '<span style="font-weight: bold">' + Ox.toTitleCase(key) + ':</span> ';
    }

    function formatLight(str) {
        return '<span style="color: rgb(128, 128, 128)">' + str + '</span>';
    }

    function formatValue(value, key) {
        return (Ox.isArray(value) ? value : [value]).map(function(value) {
            return key ?
                '<a href="/' + key + '=' + value + '">' + value + '</a>'
                : value;
        }).join(', ');
    }

    function getCapabilityCSS(hasCapability) {
        var colors = [[255, 128, 128], [128, 255, 128]];
        return {
            background: 'rgb(' + colors[+hasCapability].map(function(value) {
                return pandora.user.ui.theme == 'classic'
                    ? value : value - 128;
            }).join(', ') + ')',
            color: pandora.user.ui.theme == 'classic'
                ? 'rgb(64, 64, 64)' : 'rgb(192, 192, 192)'
        };
    }

    function getRightsLevelCSS(rightsLevel) {
        rightsLevel = pandora.site.rightsLevels[rightsLevel];
        return {
            background: 'rgb(' + rightsLevel.color.map(function(value) {
                return pandora.user.ui.theme == 'classic'
                    ? value : value - 128;
            }).join(', ') + ')',
            color: pandora.user.ui.theme == 'classic'
                ? 'rgb(64, 64, 64)' : 'rgb(192, 192, 192)'
        };
    }

    function getUserLevelCSS(userLevel) {
        // FIXME: colors should be part of config
        var colors = {
            'guest': [255, 128, 128],
            'member': [255, 255, 128],
            'friend': [128, 255, 128],
            'staff': [128, 255, 255],
            'admin': [128, 128, 255]
        };
        return {
            background: 'rgb(' + colors[userLevel].map(function(value) {
                return pandora.user.ui.theme == 'classic'
                    ? value : value - 128;
            }).join(', ') + ')',
            color: pandora.user.ui.theme == 'classic'
                ? 'rgb(64, 64, 64)' : 'rgb(192, 192, 192)'
        }
    }

    function renderCapabilities(rightsLevel) {
        var capabilities = Ox.merge(
                canEdit ? [{name: 'canSeeItem', symbol: 'View'}] : [],
                [
                    {name: 'canPlayClips', symbol: 'PlayInToOut'},
                    {name: 'canPlayVideo', symbol: 'Play'},
                    {name: 'canDownloadVideo', symbol: 'Download'}
                ]
            ),
            userLevels = canEdit ? pandora.site.userLevels : [pandora.user.level];
        $capabilities.empty();
        userLevels.forEach(function(userLevel) {
            var $line = $('<div>')
                .css({
                    height: '16px',
                    marginBottom: '4px'
                })
                .appendTo($capabilities);
            Ox.Label({
                    textAlign: 'center',
                    title: canEdit ? Ox.toTitleCase(userLevel) : pandora.site.rightsLevels[data.rightsLevel].name,
                    width: canEdit ? 48 : 68
                })
                .css(Ox.extend(
                    {
                        float: 'left',
                        paddingTop: '2px',
                        height: '12px',
                        fontSize: '8px'
                    },
                    canEdit ? getUserLevelCSS(userLevel) : getRightsLevelCSS(data.rightsLevel)
                ))
                .appendTo($line);
            capabilities.forEach(function(capability) {
                var hasCapability = pandora.site.capabilities[capability.name][userLevel] >= rightsLevel;
                Ox.Button({
                        tooltip: (canEdit ? Ox.toTitleCase(userLevel) : 'You') + ' '
                            + (hasCapability ? 'can' : 'can\'t') + ' '
                            + Ox.map(Ox.toSlashes(capability.name).split('/'), function(word, i) {
                                return i == 0 ? null : word.toLowerCase();
                            }).join(' '),
                        title: capability.symbol,
                        type: 'image'
                    })
                    .css(Ox.extend({
                        marginLeft: '4px'
                    }, getCapabilityCSS(hasCapability)))
                    .appendTo($line);
            });
        });
    }

    function renderList() {
        pandora.api.get({
            id: data.id,
            keys: [ui.icons == 'posters' ? 'posters' : 'frames']
        }, 0, function(result) {
            var images = result.data[ui.icons == 'posters' ? 'posters' : 'frames'],
                selectedImage = images.filter(function(image) {
                    return image.selected;
                })[0];
            $list = Ox.IconList({
                    defaultRatio: ui.icons == 'posters' ? 5/8 : data.stream.aspectRatio,
                    fixedRatio: ui.icons == 'posters' ? false : data.stream.aspectRatio,
                    item: function(data, sort, size) {
                        var ratio = data.width / data.height;
                        size = size || 128;
                        return {
                            height: ratio <= 1 ? size : size / ratio,
                            id: data['id'],
                            info: data.width + ' x ' + data.height + ' px',
                            title: ui.icons == 'posters' ? data.source : Ox.formatDuration(data.position),
                            url: data.url,
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
                    selected: [selectedImage['index']],
                    size: 128,
                    sort: [{key: 'index', operator: '+'}],
                    unique: 'index'
                })
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
                            src = selectedImage.url;
                        if ($browserImages.length == 0) {
                            $browserImages = pandora.$ui.browser.find('img[src*="/' + data.id + '/"]');
                        }
                        if (ui.icons == 'posters' && !ui.showSitePoster) {
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
                            if (ui.icons == 'frames') {
                                src = '/' + data.id + '/icon512.jpg?' + Ox.uid()
                                $icon.attr({src: src});
                                $reflectionIcon.attr({src: src});
                            }
                            $browserImages.each(function() {
                                $(this).attr({src: '/' + data.id + '/' + (
                                    ui.icons == 'posters' ? 'poster' : 'icon'
                                ) + '64.jpg?' + Ox.uid()});
                            });
                        });
                    }
                })
                .appendTo($info);
        });
        
    }

    function renderRightsLevel() {
        var $capabilites, $rightsLevelSelect,
            rightsLevelCSS = getRightsLevelCSS(data.rightsLevel);        
        $rightsLevel.empty();
        if (canEdit) {
            $rightsLevelSelect = Ox.Select({
                    items: pandora.site.rightsLevels.map(function(rightsLevel, i) {
                        return {id: i, title: rightsLevel.name, checked: i == data.rightsLevel};
                    }),
                    width: 128
                })
                .css(Ox.extend({
                    marginBottom: '4px'
                }, rightsLevelCSS))
                .bindEvent({
                    change: function(event) {
                        var rightsLevel = event.selected[0].id;
                        $rightsLevelSelect.css(getRightsLevelCSS(rightsLevel));
                        renderCapabilities(rightsLevel);
                        pandora.api.edit({id: data.id, rightsLevel: rightsLevel}, function(result) {
                            // ...
                        });
                    }
                })
                .appendTo($rightsLevel);
        }
        $capabilities = $('<div>').appendTo($rightsLevel);
        renderCapabilities(data.rightsLevel);
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

    that.renderRightsLevel = function() {
        renderRightsLevel();
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
