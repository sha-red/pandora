// vim: et:ts=4:sw=4:sts=4:ft=javascript

'use strict';

pandora.ui.statusbar = function() {

    var $text = {
            titleTotal: Ox.Element('<span>').html('Total: '),
            total: Ox.Element('<span>'),
            titleSelected: Ox.Element('<span>').html(' &mdash; Selected: '),
            selected: Ox.Element('<span>'),
            loading: Ox.Element('<span>').html('Loading...')
        },

        that = Ox.Bar({size: 16})
            .css({
                textAlign: 'center'
            })
            .append(
                Ox.Element()
                    .css({
                        marginTop: '2px',
                        fontSize: '9px'
                    })
                    .append($text.loading)
                    .append($text.titleTotal)
                    .append($text.total)
                    .append($text.titleSelected)
                    .append($text.selected)
            );

    function getText(data) {
        var ui = pandora.user.ui,
            itemName = ui.listView == 'clip'
                ? (data.items == 1 ? 'Clip' : 'Clips')
                : (pandora.site.itemName[data.items == 1 ? 'singular' : 'plural']),
            parts = [];
        parts.push(Ox.formatNumber(data.items) + ' '+ itemName);
        if (data.runtime) {
            parts.push(Ox.formatDuration(data.runtime, 'short'));
        } else if (data.duration) {
            parts.push(Ox.formatDuration(data.duration, 'short'));
        }
        if (pandora.site.capabilities.canSeeFiles[pandora.user.level]) {
            data.files && parts.push(data.files + ' file' + (data.files == 1 ? '' : 's'));
            data.duration && parts.push(Ox.formatDuration(data.duration));
            data.size && parts.push(Ox.formatValue(data.size, 'B'));
            data.pixels && parts.push(Ox.formatValue(data.pixels, 'px'));
        }
        return parts.join(', ');
    }

    function setTotal() {
        pandora.api.find({
            query: pandora.user.ui.find,
            sort: pandora.user.ui.listSort
        }, function(result) {
            that.set('selected', {items: 0});
            that.set('total', result.data);
        });
    }

    that.set = function(key, data) {
        if (key == 'loading') {
            Ox.forEach($text, function($element, key) {
                $element[key == 'loading' ? 'show' : 'hide']();
            });
        } else {
            $text.loading.hide();
            if (key == 'selected') {
                if (data.items == 0) {
                    $text.titleTotal.hide();
                    $text.titleSelected.hide();
                    $text.selected.hide();
                } else {
                    $text.titleTotal.show();
                    $text.titleSelected.show();
                    $text.selected.html(getText(data)).show();
                }
            } else {
                $text.total.html(getText(data)).show();
            }
        }
    };

    that.bindEvent({
        pandora_find: function() {
            that.set('loading');
            if (['map', 'calendar'].indexOf(pandora.user.ui.listView) > -1) {
                setTotal();
            }
        },
        pandora_listview: function(data) {
            var isNavigationView = ['map', 'calendar'].indexOf(data.value) > -1,
                wasNavigationView = ['map', 'calendar'].indexOf(data.previousValue) > -1;
            that.set('loading');
            if (isNavigationView && !wasNavigationView) {
                setTotal();
            }
        }
    });

    that.set('loading');
    if (['map', 'calendar'].indexOf(pandora.user.ui.listView) > -1) {
        setTotal();
    }

    return that;

};

