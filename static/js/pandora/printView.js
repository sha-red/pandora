// vim: et:ts=4:sw=4:sts=4:ft=javascript

'use strict';

pandora.ui.printView = function(data) {

    var that = Ox.Element()
            .css({
                padding: '64px 128px',
                backgroundColor: 'rgb(255, 255, 255)',
                color: 'rgb(0, 0, 0)'
            }),
        keys = ['director', 'year', 'title'];

    Ox.$body.css({
        background: 'rgb(255, 255, 255)',
        overflow: 'auto'
    });

    Ox.LoadingScreen().appendTo(that);

    pandora.api.find({
        keys: keys.concat(['id', 'summary']),
        query: pandora.user.ui.find,
        range: [0, 1000000],
        sort: keys.map(function(key) {
            return {
                key: key,
                operator: Ox.getObjectById(pandora.site.itemKeys, key).operator
            };
        })
    }, function(result) {
        var padding;
        that.empty();
        $('<div>')
            .css({
                height: '16px'
            })
            .html(
                '<b>' + pandora.site.site.name + ' - '
                + (pandora.user.ui._list || 'All ' + pandora.site.itemName.plural)
                + '</b>'
            )
            .appendTo(that);
        $('<div>').css({height: '16px'}).appendTo(that);
        result.data.items && result.data.items.forEach(function(item) {
            var url = (pandora.site.https ? 'https://' : 'http://')
                + pandora.site.site.url + '/' + item.id;
            $('<div>')
                .attr({title: url})
                .css({
                    height: '16px',
                    textAlign: 'justify',
                    textOverflow: 'ellipsis',
                    overflow: 'hidden'
                })
                .html(
                    (item.director ? item.director.join(', ') + ': ' : '')
                    + '<b>' + item.title + '</b>'
                    + (item.year ? ' (' + item.year + ')' : '')
                    + (
                        item.summary
                        ? ' <span style="color: rgb(128, 128, 128)">'
                        + item.summary + '</span>'
                        : ''
                    )
                )
                .on({
                    click: function() {
                        document.location.href = url;
                    }
                })
                .appendTo(that);
        });
        if (result.data.items.length) {
            $('<div>').css({height: '16px'}).appendTo(that);
        }
        $('<div>')
            .css({
                height: '16px'
            })
            .html(
                Ox.formatCount(
                    result.data.items.length,
                    pandora.site.itemName.singular,
                    pandora.site.itemName.plural
                ).toLowerCase()
            )
            .appendTo(that);
    });

    that.display = function() {
        // fixme: move animation into Ox.App
        var animate = $('.OxScreen').length == 0;
        Ox.Log('', 'ANIMATE?', animate)
        animate && pandora.$ui.body.css({opacity: 0});
        that.appendTo(pandora.$ui.body);
        animate && pandora.$ui.body.animate({opacity: 1}, 1000);
        return that;
    };

    return that;

};