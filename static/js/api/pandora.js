/***
    Pandora API
***/
Ox.load('UI', {
    hideScreen: false,
    showScreen: true,
    theme: 'classic'
}, function() {

var app = new Ox.App({
    url: '/api/',
    init: 'init',
}).bindEvent('load', function(data) {
    app.site = data.site;
    app.user = data.user;
    app.site.default_info = '<div class="OxSelectable"><h2>Pan.do/ra API Overview</h2>use this api in the browser with <a href="/static/oxjs/demos/doc2/index.html#Ox.App">Ox.app</a> or use <a href="http://code.0x2620.org/pandora_client">pandora_client</a> it in python. Further description of the api can be found <a href="https://wiki.0x2620.org/wiki/pandora/API">on the wiki</a></div>';
    app.$body = $('body');
    app.$document = $(document);
    app.$window = $(window);
    //app.$body.html('');
    Ox.UI.hideLoadingScreen();

    app.$ui = {};
    app.$ui.actionList = constructList();
    app.$ui.actionInfo = Ox.Container().css({padding: '16px'}).html(app.site.default_info);

    app.api.api({docs: true, code: true}, function(results) {
        app.actions = results.data.actions;
        if (document.location.hash) {
            app.$ui.actionList.triggerEvent('select', {
                ids: document.location.hash.substring(1).split(',')
            });
        }
    });

    var $left = new Ox.SplitPanel({
        elements: [
            {
                element: new Ox.Element().append(new Ox.Element()
                .html(app.site.site.name + ' API').css({
                    'padding': '4px',
                })).css({
                    'background-color': '#ddd',
                    'font-weight': 'bold',
                }),
                size: 24
            },
            {
                element: app.$ui.actionList
            }
        ],
        orientation: 'vertical'
    });
    var $main = new Ox.SplitPanel({
        elements: [
            {
                element: $left,
                size: 160
            },
            {
                element: app.$ui.actionInfo,
            }
        ],
        orientation: 'horizontal'
    });

    $main.appendTo(app.$body);
});

function constructList() {
    return new Ox.TableList({
        columns: [
            {
                align: "left",
                id: "name",
                operator: "+",
                title: "Name",
                visible: true,
                width: 140
            },
        ],
        columnsMovable: false,
        columnsRemovable: false,
        id: 'actionList',
        items: function(data, callback) {
            function _sort(a, b) {
                return a.name > b.name ? 1 : a.name == b.name ? 0 : -1;
            }
            if (!data.keys) {
                app.api.api(function(results) {
                    var items = [];
                    Ox.forEach(results.data.actions, function(v, k) {
                        items.push({'name':  k})
                    });
                    items.sort(_sort);
                    var result = {'data': {'items': items.length}};
                    callback(result);
                });
            } else {
                app.api.api(function(results) {
                    var items = [];
                    Ox.forEach(results.data.actions, function(v, k) {
                        items.push({'name':  k})
                    });
                    items.sort(_sort);
                    var result = {'data': {'items': items}};
                    callback(result);
                });
            }
        },
        scrollbarVisible: true,
        sort: [{key: "name", operator: "+"}],
        unique: 'name'
    }).bindEvent({
       select: function(data) {
           var info = $('<div>').addClass('OxSelectable'),
               hash = '#';
           if (data.ids.length)
              data.ids.forEach(function(id) {
                info.append(
                    $('<h2>')
                        .html(id)
                        .css({
                            marginBottom: '8px'
                        })
                );
                var code = app.actions[id].code[1],
                    f = app.actions[id].code[0],
                    line = Math.round(Ox.last(f.split(':')) || 0),
                    doc = app.actions[id].doc.replace('/\n/<br>\n/g'),
                    $code, $doc;

                $doc = Ox.SyntaxHighlighter({
                        source: doc,
                    })
                    .appendTo(info);

                Ox.Button({
                        title: 'View Source (' + f + ')',
                    }).bindEvent({
                        click: function() {
                            $code.toggle();
                        }
                    })
                    .css({
                        margin: '4px'
                    })
                    .appendTo(info);
                $code = Ox.SyntaxHighlighter({
                    showLineNumbers: true,
                    source: code,
                    offset: line
                })
                .css({
                    borderWidth: '1px',
                }).appendTo(info).hide();
                Ox.print(code);
                hash += id + ','
              });
            else
              info.html(app.site.default_info);

            document.location.hash = hash.slice(0, -1);
            app.$ui.actionInfo.html(info);
       }
    });
}
});

