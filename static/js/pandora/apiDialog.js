// vim: et:ts=4:sw=4:sts=4:ft=javascript
'use strict';

pandora.ui.apiDialog = function() {

    var selected = pandora.user.ui.hash && pandora.user.ui.hash.anchor
            ? pandora.user.ui.hash.anchor : '',
        actions,
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
                    title: 'Help...'
                }).bindEvent({
                    click: function() {
                        pandora.UI.set({page: 'help', 'hash.anchor': ''});
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
            minWidth: 544 + Ox.UI.SCROLLBAR_SIZE,
            removeOnClose: true,
            title: 'API Documentation',
            width: 672 + Ox.UI.SCROLLBAR_SIZE
        })
        .bindEvent({
            close: function() {
                pandora.user.ui.page == 'api' && pandora.UI.set({page: '', 'hash.anchor': ''});
            },
            resize: function() {
                $list.size();
            },
            'pandora_hash.anchor': function(data) {
                pandora.user.ui.page == 'api' && that.select(data.value);
            }
        }),
        overview = '<h1><b>API Documentation</b></h1><br>use this api in the browser with <a href="/static/oxjs/demos/doc2/index.html#Ox.App">Ox.app</a> or use <a href="http://code.0x2620.org/pandora_client">pandora_client</a> it in python. Further description of the api can be found <a href="https://wiki.0x2620.org/wiki/pandora/API">on the wiki</a></div>';

    pandora.api.api({docs: true, code: true}, function(results) {
        var items = [{
            id: '',
            title: 'API Documentation',
            sort: 'aaa'
        }];
        actions = results.data.actions;
        Ox.forEach(results.data.actions, function(v, k) {
            items.push({
                'id':  k,
                'title':  k,
                'sort': k
            });
        });

        $list = Ox.TableList({
                _tree: true,
                columns: [
                    {
                        id: 'title',
                        visible: true,
                        width: 128 - Ox.UI.SCROLLBAR_SIZE
                    }
                ],
                items: items,
                max: 1,
                min: 1,
                scrollbarVisible: true,
                selected: [selected],
                sort: [{key: 'sort', operator: '+'}],
                unique: 'id'
            })
            .bindEvent({
                select: function(data) {
                    var id = data.ids[0];
                    pandora.UI.set({'hash.anchor': id});
                }
            });

        $text = Ox.Element()
            .css({
                padding: '16px',
                overflowY: 'auto'
            })
            .html(overview);

        $panel = Ox.SplitPanel({
            elements: [
                {element: $list, size: 128},
                {element: $text}
            ],
            orientation: 'horizontal'
        });

        that.select(selected).options({content: $panel});
        $list.gainFocus();
        
    });

    that.select = function(id) {
        if (id && actions[id]) {
            $text.html('<h1><b>' + id + '</b><h1><br>');
            var code = actions[id].code[1],
                f = actions[id].code[0],
                line = Math.round(Ox.last(f.split(':')) || 0),
                doc = actions[id].doc.replace('/\n/<br>\n/g'),
                $code, $doc;

            $doc = Ox.SyntaxHighlighter({
                    source: doc,
                })
                .appendTo($text);

            Ox.Button({
                    title: 'Source (' + f + ')',
                }).bindEvent({
                    click: function() {
                        $code.toggle();
                    }
                })
                .css({
                    margin: '4px'
                })
                .appendTo($text);
            $code = Ox.SyntaxHighlighter({
                showLineNumbers: true,
                source: code,
                offset: line
            })
            .css({
                borderWidth: '1px',
            }).appendTo($text);
        } else {
            $text.html(overview);
        }
        return that;
    }

    return that;

};
