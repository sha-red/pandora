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

    pandora.api.find({
        keys: keys.concat(['id']),
        query: pandora.user.ui.find,
        range: [0, 1000000],
        sort: keys.map(function(key) {
            return {
                key: key,
                operator: Ox.getObjectById(pandora.site.itemKeys, 'year').operator
            };
        })
    }, function(result) {
        result.data.items && result.data.items.forEach(function(item) {
            var url = (pandora.site.https ? 'https://' : 'http://')
                + pandora.site.url + '/' + item.id;
            $('<div>')
                .attr({title: url})
                .css({
                    height: '16px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                })
                .html(
                    (item.director ? item.director.join(', ') + ': ' : '')
                    + '<b>' + item.title + '</b>'
                    + (item.year ? ' (' + item.year + ')' : '')
                )
                .on({
                    click: function() {
                        document.location.href = url;
                    }
                })
                .appendTo(that);
        });
    });

    return that;

};