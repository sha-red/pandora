// vim: et:ts=4:sw=4:sts=4:ft=javascript
'use strict';

pandora.ui.helpDialog = function() {

    var text = {},

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

        $panel, $list, $text, $image,

        that = Ox.Dialog({
            buttons: [
                Ox.Button({
                    id: 'switch',
                    title: 'API Documentation...'
                }).bindEvent({
                    click: function() {
                        pandora.UI.set({page: 'api', 'hash.anchor': ''});
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
            height: 384,
            keys: {escape: 'close'},
            maximizeButton: true,
            minHeight: 256,
            minWidth: 544 + 2 * Ox.UI.SCROLLBAR_SIZE,
            removeOnClose: true,
            title: 'Help',
            width: 672 + 2 * Ox.UI.SCROLLBAR_SIZE
        })
        .bindEvent({
            close: function() {
                pandora.user.ui.page == 'help' && pandora.UI.set({page: '', 'hash.anchor': ''});
            },
            resize: resize,
            'pandora_help': function(data) {
                if (pandora.user.ui.page == 'help') {
                    that.select(data.value == '' ? 'help' : data.value);
                }
            }
        });

    Ox.get('/static/html/help.html', function(html) {

        var $html = $('<div>'),
            strings = Ox.clone(pandora.site, true);

        strings.addAnnotationShortcuts = strings.layers.map(function(layer, index) {
            return '<tr><td>' + index + '</td><td>Add ' + layer.item.toLowerCase() + '</td></tr>';
        }).join('\n');
        strings.itemName = Ox.map(strings.itemName, function(v) {
            return v.toLowerCase();
        });
        strings.signup = pandora.user.level == 'guest'
            ? '<a href="/signup">sign up</a>' : 'sign up';

        $html.html(Ox.formatString(html, strings));

        pandora.site.help.forEach(function(section) {
            var html = $html.find('#' + section.id).html();
            text[section.id] = '<h1><b>' + section.title + '</b></h1>\n' + html;
        });

        $list = Ox.TableList({
                // fixme: silly
                _tree: true,
                columns: [
                    {
                        id: 'title',
                        visible: true,
                        width: 128 - Ox.UI.SCROLLBAR_SIZE
                    }
                ],
                items: pandora.site.help.map(function(value, index) {
                    return Ox.extend({index: index}, value);
                }),
                max: 1,
                min: 1,
                scrollbarVisible: true,
                selected: [pandora.user.ui.help || 'help'],
                sort: [{key: 'index', operator: '+'}],
                unique: 'id'
            })
            .bindEvent({
                select: function(data) {
                    var id = data.ids[0] == 'help' ? '' : data.ids[0];
                    pandora.UI.set({help: id, 'hash.anchor': id});
                }
            });

        $text = Ox.Element()
            .css({
                padding: '16px',
                lineHeight: '16px',
                overflowY: 'scroll',
                MozUserSelect: 'text',
                WebkitUserSelect: 'text'
            });

        $panel = Ox.SplitPanel({
            elements: [
                {element: $list, size: 128 + Ox.UI.SCROLLBAR_SIZE},
                {element: $text}
            ],
            orientation: 'horizontal'
        });

        that.select(pandora.user.ui.help).options({content: $panel});
        $list.gainFocus();
        
    });

    function getImageSize() {
        var width = that.options('width') - 160 - 2 * Ox.UI.SCROLLBAR_SIZE,
            height = Math.round(width * 5/8);
        return {width: width, height: height};
    }

    function resize(data) {
        $list.size();
        $image && $image.options(getImageSize());
    }

    that.select = function(id) {
        var img, $img;
        $text.html(text[id || 'help']).scrollTop(0);
        img = $text.find('img');
        if (img) {
            $img = $(img);
            $img.replaceWith(
                $image = Ox.ImageElement(
                    Ox.extend(getImageSize(), {src: $img.attr('src')})
                )
                .css({borderRadius: '8px'})
            );
        }
        $text.find('td:first-child')
            .css({
                height: '16px',
                paddingRight: '8px',
                textAlign: 'right',
                whiteSpace: 'nowrap'
            });
        pandora.createLinks($text);
        return that;
    }

    return that;

};
