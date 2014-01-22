'use strict';

pandora.ui.embedInfo = function() {

    var data,
        item = pandora.user.ui.item,
        margin = 16,
        that = Ox.Element(),
        $icon, $reflection, $reflectionIcon, $reflectionGradient,
        $text;

    pandora.api.get({
        id: item,
        keys: ['director', 'posterRatio', 'title', 'year']
    }, function(result) {

        data = result.data;

        $icon = Ox.$('<img>')
            .attr({src: '/' + item + '/poster512.jpg'})
            .css({
                position: 'absolute',
                top: margin + 'px',
                cursor: 'pointer'
            })
            .appendTo(that);

        $reflection = Ox.$('<div>')
            .addClass('OxReflection')
            .css({
                position: 'absolute',
                overflow: 'hidden'
            })
            .appendTo(that);

        $reflectionIcon = Ox.$('<img>')
            .attr({src: '/' + item + '/poster512.jpg'})
            .css({
                position: 'absolute'
            })
            .appendTo($reflection);

        $reflectionGradient = Ox.$('<div>')
            .css({
                position: 'absolute'
            })
            .appendTo($reflection);

        $text = Ox.$('<div>')
            .css({
                position: 'absolute',
                left: margin + 'px',
                right: margin + 'px'
            })
            .appendTo(that);

        Ox.$('<div>')
            .css({
                fontWeight: 'bold',
                fontSize: '13px',
                textAlign: 'center'
            })
            .html(data.title + (data.year ? ' (' + data.year + ')' : ''))
            .appendTo($text);

        if (data.director) {
            Ox.$('<div>')
                .css({
                    marginTop: '8px',
                    fontWeight: 'bold',
                    fontSize: '13px',
                    textAlign: 'center'
                })
                .html(data.director.map(function(director) {
                    // fixme: there should be a utils method for this
                    return '<a href="/name='
                        + director.replace('_', '\t').replace(' ', '_') 
                        + '" target="_blank">' + director + '</a>'
                }).join(', '))
                .appendTo($text);
        }

        that.resizePanel();

    });

    that.resizePanel = function() {
        var posterSize = Math.floor((Math.min(
                window.innerWidth, window.innerHeight
            ) - 2 * margin) * 2/3),
            posterWidth = Math.round(
                data.posterRatio > 1
                ? posterSize
                : posterSize * data.posterRatio
            ),
            posterHeight = Math.round(
                data.posterRatio > 1
                ? posterSize / data.posterRatio
                : posterSize
            ),
            posterLeft = Math.floor((window.innerWidth - posterWidth) / 2);
        $icon.css({
            left: posterLeft + 'px',
            width: posterWidth + 'px',
            height: posterHeight + 'px'
        });
        $reflection.css({
            left: posterLeft + 'px',
            top: posterHeight + margin + 'px',
            width: posterWidth + 'px',
            height: Math.round(posterHeight / 2) + 'px'
        });
        $reflectionIcon.css({
            width: posterWidth + 'px',
            height: posterHeight + 'px'
        });
        $reflectionGradient.css({
            width: posterSize + 'px',
            height: Math.round(posterHeight / 2) + 'px'
        });
        $text.css({
            top: 2 * margin + posterHeight + 'px'
        });
        return that;
    };

    return that;

};