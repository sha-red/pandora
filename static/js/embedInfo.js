'use strict';

pandora.ui.embedInfo = function() {

    var data,
        item = pandora.user.ui.item,
        poster = {
            size: 256
        },
        textCSS = {
            marginTop: '8px',
            fontWeight: 'bold',
            fontSize: '13px',
            textAlign: 'center'
        },
        that = Ox.Element(),
        $icon, $reflection, $text;

    pandora.api.get({
        id: item,
        keys: ['director', 'posterRatio', 'title', 'year']
    }, function(result) {

        data = result.data;

        poster.width = Math.round(
            data.posterRatio > 1
            ? poster.size
            : poster.size * data.posterRatio
        );
        poster.height = Math.round(
            data.posterRatio > 1
            ? poster.size / data.posterRatio
            : poster.size
        );
        poster.left = Math.floor((window.innerWidth - poster.width) / 2);

        $icon = Ox.$('<img>')
            .attr({src: '/' + item + '/poster256.jpg'})
            .css({
                position: 'absolute',
                left: poster.left + 'px',
                top: '8px',
                width: poster.width + 'px',
                height: poster.height + 'px',
                cursor: 'pointer'
            })
            .appendTo(that);

        $reflection = Ox.$('<div>')
            .addClass('OxReflection')
            .css({
                position: 'absolute',
                left: poster.left + 'px',
                top: poster.height + 8 + 'px',
                width: '256px',
                height: '128px',
                overflow: 'hidden'
            })
            .appendTo(that);

        Ox.$('<img>')
            .attr({src: '/' + item + '/poster256.jpg'})
            .css({
                position: 'absolute',
                width: poster.width + 'px',
                height: poster.height + 'px'
            })
            .appendTo($reflection);

        Ox.$('<div>')
            .css({
                position: 'absolute',
                width: '256px',
                height: '128px'
            })
            .appendTo($reflection);

        $text = Ox.$('<div>')
            .css({
                position: 'absolute',
                left: '8px',
                top: 8 + 8 + poster.height + 'px',
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

    that.resizePanel = function() {
        poster.left = Math.floor((window.innerWidth - poster.width) / 2);
        $icon.css({left: poster.left + 'px'});
        $reflection.css({left: poster.left + 'px'});
    };

    return that;

};