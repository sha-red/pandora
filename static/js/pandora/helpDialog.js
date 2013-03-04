// vim: et:ts=4:sw=4:sts=4:ft=javascript
'use strict';

pandora.ui.helpDialog = function() {

    var selected = pandora.user.ui.hash && pandora.user.ui.hash.anchor
            ? pandora.user.ui.hash.anchor : 'help',

        text = {},

        $loading = Ox.Element()
            .append(
                $('<img>')
                    .attr({src: Ox.UI.getImageURL('symbolLoadingAnimated')})
                    .css({
                        position: 'absolute',
                        width: '32px',
                        height: '32px',
                        left: 0,
                        top: 0,
                        right: 0,
                        bottom: 0,
                        margin: 'auto'
                    })
            ),

        $panel, $list, $text,

        that = Ox.Dialog({
            buttons: [
                Ox.Button({
                    id: 'switch',
                    title: pandora.site.site.name + ' API...'
                }).bindEvent({
                    click: function() {
                        pandora.UI.set({page: 'api', 'hash.anchor': ''})
                    }
                }),
                {},
                Ox.Button({
                    id: 'close',
                    title: 'Close'
                }).bindEvent({
                    click: function() {
                        that.close();
                    }
                })
            ],
            closeButton: true,
            content: $loading,
            height: Math.round((window.innerHeight - 24) * 0.75),
            keys: {escape: 'close'},
            maximizeButton: true,
            minHeight: 256,
            minWidth: 576,
            removeOnClose: true,
            title: 'Help',
            width: Math.round(window.innerWidth * 0.75)
        })
        .bindEvent({
            close: function() {
                pandora.UI.set({page: '', 'hash.anchor': ''});
            },
            resize: function() {
                $list.size();
            },
            'pandora_hash.anchor': function(data) {
                pandora.user.ui.page == 'help' &&
                    that.select(data.value == '' ? 'help' : data.value);
            }
        });

    Ox.get('/static/html/help.html', function(html) {

        var $html = $('<div>').html(html);

        pandora.site.help.forEach(function(section) {
            var html = $html.find('#' + section.id).html();
            text[section.id] = '<h1><b>' + section.title + '</b><h1><br>\n' + html;
        });

        $list = Ox.TableList({
                // fixme: silly
                _tree: true,
                columns: [
                    {
                        id: 'title',
                        visible: true,
                        width: 192 - Ox.UI.SCROLLBAR_SIZE
                    }
                ],
                items: pandora.site.help.map(function(value, index) {
                    return Ox.extend({index: index}, value);
                }),
                max: 1,
                min: 1,
                scrollbarVisible: true,
                selected: [selected],
                sort: [{key: 'index', operator: '+'}],
                unique: 'id'
            })
            .bindEvent({
                select: function(data) {
                    var id = data.ids[0];
                    pandora.UI.set({'hash.anchor': id == 'help' ? '' : id});
                }
            });

        $text = Ox.Element()
            .css({
                padding: '16px',
                overflowY: 'auto'
            });

        $panel = Ox.SplitPanel({
            elements: [
                {element: $list, size: 192},
                {element: $text}
            ],
            orientation: 'horizontal'
        });

        that.select(selected).options({content: $panel});
        $list.gainFocus();
        
    });

    that.select = function(id) {
        $text.html(text[id]);
        return that;
    }

    return that;

};
