// vim: et:ts=4:sw=4:sts=4:ft=javascript
'use strict';

pandora.ui.apiDialog = function() {

    var selected = pandora.user.ui.part.api,

        actions,

        $panel, $list, $text,

        that = Ox.Dialog({
            buttons: [
                Ox.Button({
                    id: 'switch',
                    title: Ox._('Help...')
                }).bindEvent({
                    click: function() {
                        pandora.UI.set({page: 'help'});
                    }
                }),
                {},
                Ox.Button({
                    id: 'close',
                    title: Ox._('Close')
                }).bindEvent({
                    click: function() {
                        that.close();
                    }
                })
            ],
            closeButton: true,
            content: Ox.LoadingScreen().start(),
            height: 384,
            keys: {escape: 'close'},
            maximizeButton: true,
            minHeight: 256,
            minWidth: 544 + Ox.UI.SCROLLBAR_SIZE,
            removeOnClose: true,
            title: Ox._('API Documentation'),
            width: 672 + Ox.UI.SCROLLBAR_SIZE
        })
        .bindEvent({
            close: function() {
                pandora.user.ui.page == 'api' && pandora.UI.set({page: ''});
            },
            resize: function() {
                $list.size();
            },
            'pandora_part.api': function(data) {
                pandora.user.ui.page == 'api' && that.select(data.value);
            }
        });

    pandora.api.api({docs: true, code: true}, function(results) {
        var items = [{
            id: '',
            title: Ox._('API Documentation'),
            sort: 'aaa' // FIXME: what's this?
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
                    pandora.UI.set({'part.api': id});
                }
            });

        $text = Ox.Element()
            .css({
                padding: '16px',
                lineHeight: '16px',
                overflowY: 'auto'
            });

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

    function getDoc(string) {
        /*
        API Documentation format:
        Description
        takes {
            key: value, // comment
            key: value, // comment
            ...
        }
        returns {
            key: value, // comment
            key: value, // comment
            ...
        }
        notes: Notes
        see: action, action, ...
        */
        var $doc = Ox.SyntaxHighlighter({
                    source: '\n' + string.replace(
                        /\n(?=(takes \{|returns \{|notes: |see: ))/g, '\n\n'
                    ).replace(
                        /(takes|returns|notes|see)(?=( \{|: ))/g, 'BOLD$1BOLD'
                    ).replace(
                        /`/g, 'BOLD'
                    )
                })
                .css({backgroundColor: 'rgba(0, 0, 0, 0)'}),
            parts, parts_,
            colon = '</span><span class="OxOperator">:</span>',
            comma = '<span class="OxOperator">,</span>',
            linebreak = '<span class="OxLinebreak"><br></span>',
            whitespace = '<span class="OxWhitespace">&nbsp;</span>';
        ['Keyword', 'Method', 'Property'].forEach(function(type) {
            $doc.find('.Ox' + type)
                .removeClass('Ox' + type)
                .addClass('OxIdentifier');
        });
        $doc.html(
            $doc.html().replace(/BOLD(\w+)BOLD/g, '<b>$1</b>')
        );
        parts = $doc.html().split('<b>see</b>' + colon + whitespace);
        if (parts.length == 2) {
            parts[1] = parts[1]
                .split(comma + linebreak)
                .map(function(part) {
                    return part
                        .split(comma + whitespace)
                        .map(function(action) {
                            action = Ox.stripTags(action);
                            return '<span class="OxMethod"><a href="/api/'
                                + action + '">' + action + '</a></span>';
                        })
                        .join(comma + whitespace);
                    
                })
                .join(comma + linebreak);
            $doc.html(parts.join('<b>see</b>' + colon + whitespace));
        }
        pandora.createLinks($doc);
        return $doc;
    }

    function getIndex() {
        var $index = Ox.Element()
            .html(Ox._(
                '<h1><b>API Documentation</b></h1>\n'
                + '<p><b>{0}</b> uses a JSON API'
                + ' to communicate between the browser and the server.'
                + ' This API is 100% public, which means that there is'
                + ' virtually no limit to what you can do with the site,'
                + ' or build on top of it &mdash; from writing simple scripts'
                + ' to read or write specific information to including'
                + ' data from <b>{0}</b>'
                + ' (not just videos, but also metadata, annotations, lists,'
                + ' or a custom search interface) in your own website.</p>\n'
                + '<p>If you are using the API in JavaScript, you may want to'
                + ' take a look at <a href="https://oxjs.org/#doc/Ox.API">'
                + ' OxJS</a>, and if you are using Python, there is'
                + ' <a href="https://wiki.0x2620.org/wiki/python-ox">'
                + ' python-ox</a>, which is used by'
                + ' <a href="https://wiki.0x2620.org/wiki/pandora_client">'
                + ' pandora_client</a> to automate certain tasks.</p>\n'
                + '<p>To get started, just open the console and paste the'
                + ' following snippet. For the first ten items that are'
                + ' both shorter than one hour and whose title starts with'
                + ' either "a" or "the" (sorted by duration, then title, both'
                + ' in ascending order), it will return their duration,'
                + ' id and title properties.</p>',
            [pandora.site.site.name]))
            .append(
                Ox.SyntaxHighlighter({
                    source: "pandora.api.find({\n"
                        + "    keys: ['duration', 'id', 'title'],\n"
                        + "    query: {\n"
                        + "        conditions: [\n"
                        + "            {key: 'duration', operator: '<', value: '01:00:00'},\n"
                        + "            {\n"
                        + "                conditions: [\n"
                        + "                    {key: 'title', operator: '=', value: 'a*'}\n"
                        + "                    {key: 'title', operator: '=', value: 'the*'}\n"
                        + "                ],\n"
                        + "                operator: '|'\n"
                        + "            }\n"
                        + "        ],\n"
                        + "        operator: '&'\n"
                        + "    },\n"
                        + "    range: [0, 10],\n"
                        + "    sort: [\n"
                        + "        {key: 'duration', operator: '+'},\n"
                        + "        {key: 'title', operator: '+'}\n"
                        + "    ]\n"
                        + "}, function(result) {\n"
                        + "    console.log(\n"
                        + "        result.status.code == 200 ? result.data : result.status\n"
                        + "    );\n"
                        + "});"
                })
            );
        pandora.createLinks($index);
        return $index;
    }

    that.select = function(id) {
        if (id && actions[id]) {
            $text.empty();
            var code = actions[id].code[1],
                source = actions[id].code[0],
                line = Math.round(Ox.last(source.split(':')) || 0),
                $code;
            $('<h1>')
                .css({paddingLeft: '4px'})
                .html('<tt><b>' + id + '</b></tt>')
                .appendTo($text);
            getDoc(actions[id].doc).appendTo($text),
            $('<div>')
                .css({paddingLeft: '4px'})
                .html('<br><tt><b>source</b>: ' + source + '</tt>')
                .appendTo($text);
            $code = Ox.SyntaxHighlighter({
                    source: code.replace(/\s*?'''[\s\S]+?'''/g, ''),
                })
                .css({
                    backgroundColor: 'rgba(0, 0, 0, 0)',
                    borderWidth: '1px',
                })
                .appendTo($text);
            // fix decorators
            $code.find('.OxError')
                .removeClass('OxError')
                .addClass('OxOperator');
        } else {
            $text.empty().append(getIndex());
        }
        $text.scrollTop(0);
        return that;
    }

    return that;

};
