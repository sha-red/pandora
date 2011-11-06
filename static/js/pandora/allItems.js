'use strict';

pandora.ui.allItems = function() {

    var that = Ox.Element()
        .addClass('OxSelectable' + (pandora.user.ui._list ? '' : ' OxSelected'))
        .css({
            height: '16px',
            cursor: 'default',
            overflow: 'hidden'
        })
        .bind({
            click: function() {
                that.gainFocus();
                pandora.user.ui._list && pandora.UI.set('find', {conditions: [], operator: '&'});
            }
        })
        .bindEvent({
            pandora_find: function() {
                that[pandora.user.ui._list ? 'removeClass' : 'addClass']('OxSelected');
            }
        }),
    $icon = $('<img>')
        .attr({src: '/static/png/icon16.png'})
        .css({float: 'left', width: '14px', height: '14px', margin: '1px'})
        .appendTo(that),
    $name = $('<div>')
        .css({
            float: 'left',
            height: '14px',
            margin: '1px 4px 1px 3px',
            textOverflow: 'ellipsis',
            overflow: 'hidden',
            whiteSpace: 'nowrap'
        })
        .html('All ' + pandora.site.itemName.plural)
        .appendTo(that),
    $items = $('<div>')
        .css({
            float: 'left',
            width: '42px',
            margin: '1px 4px 1px 3px',
            textAlign: 'right'
        })
        .appendTo(that),
    $clickButton = Ox.Button({
            style: 'symbol',
            title: 'click',
            type: 'image'
        })
        .css({opacity: 0.25})
        .appendTo(that),
    $uploadButton = Ox.Button({
            style: 'symbol',
            title: 'upload',
            type: 'image'
        })
        .appendTo(that);

    pandora.api.find({
        query: {conditions: [], operator: '&'}
    }, function(result) {
        $items.html(Ox.formatNumber(result.data.items));
    });

    that.resizeElement = function(width) {
        $name.css({width: width + 'px'});
    };

    return that;

};
