'use strict';

pandora.ui.embedInfo = function() {

    var item = pandora.user.ui.item,

        data,

        that = Ox.Element();

    pandora.api.get({
        id: item,
        keys: ['director', 'posterRatio', 'title', 'year']
    }, function(result) {

        data = result.data;

        var posterSize = 256,
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
            posterLeft = Math.floor(
                (window.innerWidth - posterWidth) / 2
            ),
            textCSS = {
                marginTop: '8px',
                fontWeight: 'bold',
                fontSize: '13px',
                textAlign: 'center'
            },

            $icon = Ox.$('<img>')
                .attr({src: '/' + item + '/poster256.jpg'})
                .css({
                    position: 'absolute',
                    left: posterLeft + 'px',
                    top: '8px',
                    width: posterWidth + 'px',
                    height: posterHeight + 'px',
                    cursor: 'pointer'
                })
                .appendTo(that),

            $reflection = Ox.$('<div>')
                .addClass('OxReflection')
                .css({
                    position: 'absolute',
                    left: posterLeft + 'px',
                    top: posterHeight + 8 + 'px',
                    width: '256px',
                    height: '128px',
                    overflow: 'hidden'
                })
                .appendTo(that),

            $reflectionIcon = Ox.$('<img>')
                .attr({src: '/' + item + '/poster256.jpg'})
                .css({
                    position: 'absolute',
                    width: posterWidth + 'px',
                    height: posterHeight + 'px'
                })
                .appendTo($reflection),

            $reflectionGradient = Ox.$('<div>')
                .css({
                    position: 'absolute',
                    width: '256px',
                    height: '128px'
                })
                .appendTo($reflection),

            $text = Ox.$('<div>')
                .css({
                    position: 'absolute',
                    left: '8px',
                    top: 8 + 8 + posterHeight + 'px',
                    right: '8px'
                })
                .appendTo(that);

        Ox.$('<div>')
            .css(textCSS)
            .html(data.title + (data.year ? ' (' + data.year + ')' : ''))
            .appendTo($text);

        if (data.director) {
            Ox.$('<div>')
                .css(textCSS)
                .html(data.director.join(', '))
                .appendTo($text);
        }

    });

    return that;

};