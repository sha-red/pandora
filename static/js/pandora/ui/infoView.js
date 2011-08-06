pandora.ui.infoView = function(data) {

    var listWidth = 144 + Ox.UI.SCROLLBAR_SIZE,
        margin = 8,
        posterRatio = data.poster.width / data.poster.height,
        posterWidth = posterRatio > 1 ? 256 : Math.round(256 * posterRatio),
        posterHeight = posterRatio < 1 ? 256 : Math.round(256 / posterRatio),
        posterLeft = Math.floor((256 - posterWidth) / 2),
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
        $poster = $('<img>')
            .attr({
                src: '/' + data.id + '/poster.jpg'
            })
            .css({
                position: 'absolute',
                left: margin + posterLeft + 'px',
                top: margin + 'px',
                width: posterWidth + 'px',
                height: posterHeight + 'px',
                cursor: pandora.user.level == 'admin' ? 'pointer' : 'default'
            })
            .appendTo($data.$element),
        $reflection = $('<div>')
            .css({
                display: 'block',
                position: 'absolute',
                left: margin + 'px',
                top: margin + posterHeight + 'px',
                width: '256px',
                height: '128px',
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
                left: margin + 'px',
                width: '256px',
                height: '128px'
            })
            .css('background', '-moz-linear-gradient(top, rgba(16, 16, 16, 0.75), rgba(16, 16, 16, 1))')
            .css('background', '-webkit-linear-gradient(top, rgba(16, 16, 16, 0.75), rgba(16, 16, 16, 1))')
            .appendTo($reflection),
        $text = $('<div>')
            .css({
                position: 'absolute',
                left: margin + 256 + margin + 'px',
                top: margin + 'px',
                right: margin + 'px'
            })
            .appendTo($data.$element);
    Ox.print('DATA', data);
    ['title', 'director'].forEach(function(key) {
        $('<div>')
            .css({
                marginTop: key == 'title' ? '-2px' : '2px',
                fontWeight: 'bold',
                fontSize: '13px',
                MozUserSelect: 'text',
                WebkitUserSelect: 'text'
            })
            .html(
                key == 'title'
                ? data.title + (
                    data.original_title
                    ? ' <span style="color: rgb(128, 128, 128)">(' + data.original_title + ')</span>'
                    : ''
                )
                : formatValue(data.director, 'name')
            )
            .appendTo($text);
    });

    if (data.country || data.year || data.language || data.runtime || pandora.user.level == 'admin') {
        var $div = $('<div>')
            .css({
                marginTop: '4px',
                textAlign: 'justify'
            })
            .appendTo($text);
        var html = [];
        ['country', 'year', 'language', 'runtime'].forEach(function(key) {
            if (data[key] || (['country', 'year'].indexOf(key) > -1 && pandora.user.level == 'admin')) {
                var value = data[key] || '<span style="color: rgb(128, 128, 128)">unknown</span>';
                html.push(
                    formatKey(key)
                    + (key == 'runtime'
                    ? Math.round(value / 60) + ' min'
                    : formatValue(value, key == 'runtime' ? null : key))
                );
            }
        });
        $div.html(html.join('; '));
    }

    // fixme: should be camelCase!
    data.alternative_titles && $('<div>')
        .css({
            marginTop: '4px',
            textAlign: 'justify',
            MozUserSelect: 'text',
            WebkitUserSelect: 'text'
        })
        .html(
            formatKey('Alternative Titles') + data.alternative_titles.map(function(value) {
                return value[0] + (
                    value[1]
                    ? ' <span style="color: rgb(128, 128, 128)">(' + value[1] + ')</span>'
                    : ''
                );
            }).join(', ')
        )
        .appendTo($text);

    if (data.writer || data.producer || data.cinematographer || data.editor) {
        $div = $('<div>')
            .css({
                marginTop: '4px',
                textAlign: 'justify',
                MozUserSelect: 'text',
                WebkitUserSelect: 'text'
            })
            .appendTo($text);
        html = [];
        ['writer', 'producer', 'cinematographer', 'editor'].forEach(function(key) {
            data[key] && html.push(
                formatKey(key) + formatValue(data[key], 'name')
            );
        });
        $div.html(html.join('; '));
    }

    data.cast && $('<div>')
        .css({
            marginTop: '4px',                
            textAlign: 'justify',
            MozUserSelect: 'text',
            WebkitUserSelect: 'text'
        })
        .html(
            formatKey('cast') + data.cast.map(function(value) {
                value.character = value.character.replace('(uncredited)', '').trim();
                return formatValue(value.actor, 'name') + (
                    value.character
                    ? ' <span style="color: rgb(128, 128, 128)">(' + formatValue(value.character) + ')</span>'
                    : ''
                );
            }).join(', ')
        )
        .appendTo($text);

    if (data.genre || data.keyword) {
        $div = $('<div>')
            .css({
                marginTop: '4px',
                textAlign: 'justify',
                MozUserSelect: 'text',
                WebkitUserSelect: 'text'
            })
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
        .css({
            marginTop: '4px',
            textAlign: 'justify',
            MozUserSelect: 'text',
            WebkitUserSelect: 'text'
        })
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
        .css({
            marginTop: '4px',
            textAlign: 'justify',
            MozUserSelect: 'text',
            WebkitUserSelect: 'text'
        })
        .html(
            formatKey('Filming Locations') + data.filming_locations.join('; ')
        )
        .appendTo($text);

    data.releasedate && $('<div>')
        .css({
            marginTop: '4px',
            textAlign: 'justify',
            MozUserSelect: 'text',
            WebkitUserSelect: 'text'
        })
        .html(
            formatKey('Release Date') + Ox.formatDate(data.releasedate, '%A, %B %e, %Y')
        )
        .appendTo($text);

    if (data.budget || data.gross || data.profit) {
        $div = $('<div>')
            .css({
                marginTop: '4px',
                textAlign: 'justify',
                MozUserSelect: 'text',
                WebkitUserSelect: 'text'
            })
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
            .css({
                marginTop: '4px',
                textAlign: 'justify',
                MozUserSelect: 'text',
                WebkitUserSelect: 'text'
            })
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
            .css({
                marginTop: '4px',
                textAlign: 'justify',
                MozUserSelect: 'text',
                WebkitUserSelect: 'text'
            })
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
            .css({
                marginTop: '4px',
                textAlign: 'justify',
                MozUserSelect: 'text',
                WebkitUserSelect: 'text'
            })
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
        $poster.bind({
            click: function() {
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
                        $('img[src*="/' + item + '/poster"]').each(function() {
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

    function formatValue(value, key) {
        return (Ox.isArray(value) ? value : [value]).map(function(value) {
            return key ? '<a href="/?find=' + key + ':' + value + '">' + value + '</a>' : value;
        }).join(', ');
    }

    that.resize = function() {
        var height = pandora.$ui.contentPanel.size(1);
        $list && $list.css({height: height + 'px'});
        $data.css({height: height + 'px'});
    };

    return that;

}