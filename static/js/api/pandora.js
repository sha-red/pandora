/***
    Pandora API
***/
Ox.load('UI', {
    hideScreen: false,
    showScreen: true,
    theme: 'classic'
}, function() {

var app = new Ox.App({
    apiURL: '/api/',
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

        if(document.location.hash) {
            app.$ui.actionList.triggerEvent('select', {ids: document.location.hash.substring(1).split(',')});
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
    return new Ox.TextList({
        columns: [
                {
                    align: "left",
                    id: "name",
                    operator: "+",
                    title: "Name",
                    unique: true,
                    visible: true,
                    width: 140
                },
        ],
        columnsMovable: false,
        columnsRemovable: false,
        id: 'actionList',
        items: function(data, callback) {
            function _sort(a, b) {
                if(a.name > b.name)
                    return 1;
                else if(a.name == b.name)
                    return 0;
                return -1;
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
        sort: [
            {
                key: "name",
                operator: "+"
            }
        ]
    }).bindEvent({
       select: function(data) {
           var info = $('<div>').addClass('OxSelectable'),
               hash = '#';
           if(data.ids.length)
              data.ids.forEach(function(id) {
                info.append($("<h2>").html(id));
                var $doc =$('<pre>')
                           .html(app.actions[id].doc.replace('/\n/<br>\n/g'))
                           .appendTo(info);
                var $code = $('<code class="python">')
                             .html(app.actions[id].code[1].replace('/\n/<br>\n/g'))
                             .hide();
                /*
                var $button = Ox.Button({
                  type: "image",
                  options: [
                    {id: "one", title: "right"},
                    {id: "two", title: "down"},
                  ],
                })
                .addClass("margin")
                .click(function() { $code.toggle()})
                .appendTo(info);
                */
                var f = app.actions[id].code[0];
                $('<span>')
                    .html(' View Source ('+f+')')
                    .click(function() { $code.toggle()})
                    .appendTo(info)
                $('<pre>').append($code).appendTo(info)
                hljs.highlightBlock($code[0], '    ');

                hash += id + ','
              });
            else
              info.html(app.site.default_info);

            document.location.hash = hash.substring(0, hash.length-1);
            app.$ui.actionInfo.html(info);
       }
    });
}
});

