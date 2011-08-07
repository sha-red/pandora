pandora.ui.infoView = function(data) {

    var css = {
            marginTop: '4px',
            textAlign: 'justify',
            MozUserSelect: 'text',
            WebkitUserSelect: 'text'
        },
        listWidth = 144 + Ox.UI.SCROLLBAR_SIZE,
        margin = 16,
        posterSize = pandora.user.ui.infoIconSize,
        posterRatio = data.poster.width / data.poster.height,
        posterWidth = posterRatio > 1 ? posterSize : Math.round(posterSize * posterRatio),
        posterHeight = posterRatio < 1 ? posterSize : Math.round(posterSize / posterRatio),
        posterLeft = posterSize == 256 ? Math.floor((posterSize - posterWidth) / 2) : 0,
        editPoster = false,
        that = Ox.Element(),
        $list,
        $info = $('<div>')
            .css({
                position: 'absolute',
                left: pandora.user.level == 'admin' ? -listWidth + 'px' : 0,
                top: 0,
                right: 0,
            })
            .appendTo(that.$element),
        $data = Ox.Container()
            .css({
                position: 'absolute',
                left: (pandora.user.level == 'admin' ? listWidth : 0) + 'px',
                top: 0,
                right: 0,
                height: pandora.$ui.contentPanel.size(1) + 'px'
            })
            .appendTo($info),
        $poster = Ox.Element('<img>')
            .attr({
                src: '/' + data.id + '/poster.jpg'
            })
            .css({
                position: 'absolute',
                left: margin + posterLeft + 'px',
                top: margin + 'px',
                width: posterWidth + 'px',
                height: posterHeight + 'px',
                cursor: 'pointer'
            })
            .bindEvent({
                singleclick: togglePosterSize
            })
            .appendTo($data.$element),
        $reflection = $('<div>')
            .css({
                display: 'block',
                position: 'absolute',
                left: margin + 'px',
                top: margin + posterHeight + 'px',
                width: posterSize + 'px',
                height: posterSize / 2 + 'px',
                overflow: 'hidden'
            })
            .appendTo($data.$element),
        $reflectionPoster = $('<img>')
            .attr({
                src: '/' + data.id + '/poster.jpg'
            })
            .css({
                position: 'absolute',
                left: posterLeft + 'px',
                width: posterWidth + 'px',
                height: posterHeight + 'px',
                MozTransform: 'scaleY(-1)',
                WebkitTransform: 'scaleY(-1)'
            })
            .appendTo($reflection),
        $reflectionGradient = $('<div>')
            .css({
                display: 'block',
                position: 'absolute',
                width: posterSize + 'px',
                height: posterSize / 2 + 'px'
            })
            .css('background', '-moz-linear-gradient(top, rgba(16, 16, 16, 0.75), rgba(16, 16, 16, 1))')
            .css('background', '-webkit-linear-gradient(top, rgba(16, 16, 16, 0.75), rgba(16, 16, 16, 1))')
            .appendTo($reflection),
        $text = $('<div>')
            .css({
                position: 'absolute',
                left: margin + (posterSize == 256 ? 256 : posterWidth) + margin + 'px',
                top: margin + 'px',
                right: margin + 'px'
            })
            .appendTo($data.$element);

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
            data.title + (data.original_title ? ' '
            + formatLight('(' + data.original_title + ')') : '')
        )
        .appendTo($text);

    $('<div>')
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

    // fixme: should be camelCase!
    data.alternative_titles && $('<div>')
        .css(css)
        .html(
            formatKey('Alternative Titles') + data.alternative_titles.map(function(value) {
                return value[0] + (value[1] ? ' '
                    + formatLight('(' + value[1] + ')') : '');
            }).join(', ')
        )
        .appendTo($text);

    if (data.creator || data.writer || data.producer || data.cinematographer || data.editor) {
        $div = $('<div>')
            .css(css)
            .appendTo($text);
        html = [];
        ['creator', 'writer', 'producer', 'cinematographer', 'editor'].forEach(function(key) {
            data[key] && html.push(
                formatKey(key) + formatValue(data[key], 'name')
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
        ['genre', 'keyword'].forEach(function(key) {
            data[key] && html.push(
                formatKey(key == 'keyword' ? 'keywords' : key)
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

    data.filming_locations && $('<div>')
        .css(css)
        .html(
            formatKey('Filming Locations') + data.filming_locations.join('; ')
        )
        .appendTo($text);

    data.releasedate && $('<div>')
        .css(css)
        .html(
            formatKey('Release Date') + Ox.formatDate(data.releasedate, '%A, %B %e, %Y')
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
                formatKey(key) + formatValue(data.connections[key])
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

    if (pandora.user.level == 'admin') {
        var icon = 'posters',
            selectedImage = {};

        $poster.bindEvent({
            doubleclick: function() {
                if (!editPoster) {
                    $info.animate({
                        left: 0
                    }, 250);
                    editPoster = true;
                } else {
                    $info.animate({
                        left: -listWidth + 'px'
                    }, 250);
                    editPoster = false;
                }
            }
        });
        
        pandora.api.get({
            id: data.id,
            keys: [icon]
        }, function(result) {
            Ox.print('RESULT', result.data)
            var images = result.data[icon];
            selectedImage = images.filter(function(image) {
                return image.selected;
            })[0];
            $list = Ox.IconList({
                defaultRatio: 5/8,
                item: function(data, sort, size) {
                    var ratio = data.width / data.height;
                    size = size || 128;
                    return {
                        height: ratio <= 1 ? size : size / ratio,
                        id: data['id'],
                        info: data.width + ' x ' + data.height + ' px',
                        title: icon == 'posters' ? data.source : Ox.formatDuration(data.position),
                        url: data.url,
                        width: ratio >= 1 ? size : size * ratio
                    }
                },
                items: images,
                keys: icon == 'posters'
                    ? ['index', 'source', 'width', 'height', 'url']
                    : ['index', 'position', 'width', 'height', 'url'],
                max: 1,
                min: 1,
                orientation: 'vertical',
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
                    //renderPreview(selectedImage);
                    pandora.api[icon == 'posters' ? 'setPoster' : 'setPosterFrame'](Ox.extend({
                        id: data.id
                    }, icon == 'posters' ? {
                        source: selectedImage.source
                    } : {
                        position: selectedImage.index // fixme: api slightly inconsistent
                    }), function(result) {
                        var imageRatio = selectedImage.width / selectedImage.height;
                        $('img[src*="/' + data.id + '/poster"]').each(function() {
                            var $this = $(this),
                                size = Math.max($this.width(), $this.height()),
                                src = $this.attr('src').split('?')[0] + '?' + Ox.uid();
                            $('<img>')
                                .attr({src: src})
                                .load(function() {
                                    $this.attr({src: src});
                                    icon == 'posters' && $this.css(imageRatio < 1 ? {
                                        width: Math.round(size * imageRatio) + 'px',
                                        height: size + 'px'
                                    } : {
                                        width: size + 'px',
                                        height: Math.round(size / imageRatio) + 'px'
                                    });
                                });
                        });
                    });
                }
            })
            .appendTo($info);
        });
    }

    function formatKey(key) {
        return '<span style="font-weight: bold">' + Ox.toTitleCase(key) + ':</span> ';
    }

    function formatLight(str) {
        return '<span style="color: rgb(128, 128, 128)">' + str + '</span>';
    }

    function formatValue(value, key) {
        return (Ox.isArray(value) ? value : [value]).map(function(value) {
            return key ? '<a href="/?find=' + key + ':' + value + '">' + value + '</a>' : value;
        }).join(', ');
    }

    function togglePosterSize() {
        posterSize = posterSize == 256 ? 512 : 256;
        posterWidth = posterRatio > 1 ? posterSize : Math.round(posterSize * posterRatio);
        posterHeight = posterRatio < 1 ? posterSize : Math.round(posterSize / posterRatio);
        posterLeft = posterSize == 256 ? Math.floor((posterSize - posterWidth) / 2) : 0,
        $poster.animate({
            left: margin + posterLeft + 'px',
            width: posterWidth + 'px',
            height: posterHeight + 'px'     
        }, 250);
        $reflection.animate({
            top: margin + posterHeight + 'px',
            width: posterSize + 'px',
            height: posterSize / 2 + 'px'
        }, 250);
        $reflectionPoster.animate({
            left: posterLeft + 'px',
            width: posterWidth + 'px',
            height: posterHeight + 'px',
        }, 250);
        $reflectionGradient.animate({
            width: posterSize + 'px',
            height: posterSize / 2 + 'px'
        }, 250);
        $text.animate({
            left: margin + (posterSize == 256 ? 256 : posterWidth) + margin + 'px',
        }, 250);
        pandora.api.setUI({infoIconSize: pandora.user.ui.infoIconSize = posterSize});
    }

    that.resize = function() {
        var height = pandora.$ui.contentPanel.size(1);
        $list && $list.css({height: height + 'px'});
        $data.css({height: height + 'px'});
    };

    return that;

}
