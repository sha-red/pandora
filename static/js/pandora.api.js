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
}).bindEvent('load', function(event, data) {
    app.config = data.config;
    app.user = data.user;
    app.config.default_info = '<div class="OxSelectable"><h2>Overview</h2>use this api in the browser with Ox.app or use <a href="http://code.0x2620.org/pandora_client">pandora_client</a> to use it in python</div>';
    app.$body = $('body');
    app.$document = $(document);
    app.$window = $(window);
    //app.$body.html('');
    Ox.UI.hideLoadingScreen();

    app.$ui = {};
    app.$ui.actionList = constructList();
    app.$ui.actionInfo = Ox.Container().css({padding: '16px'}).html(app.config.default_info);

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
                .html(app.config.site.name + ' API').css({
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
            if(!data.keys) {
                app.api.api(function(results) {
                    var items = [];
                    $.each(results.data.actions, function(i, k) {items.push({'name':  i})});
                    items.sort(_sort);
                    var result = {'data': {'items': items.length}};
                    callback(result);
                });
            } else {
                app.api.api(function(results) {
                    var items = [];
                    $.each(results.data.actions, function(i, k) {items.push({'name':  i})});
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
       select: function(event, data) {
           var info = $('<div>').addClass('OxSelectable'),
               hash = '#';
           if(data.ids.length)
              $.each(data.ids, function(v, k) {
                info.append($("<h2>").html(k));
                var $doc =$('<pre>')
                           .html(app.actions[k].doc.replace('/\n/<br>\n/g'))
                           .appendTo(info);
                var $code = $('<code class=" python">')
                             .html(app.actions[k].code[1].replace('/\n/<br>\n/g'))
                             .hide();
                var $button = new Ox.Button({
                  title: [
                    {id: "one", title: "expand"},
                    {id: "two", title: "collapse"},
                  ],
                  type: "image"
                })
                .addClass("margin")
                .click(function() { $code.toggle()})
                .appendTo(info)
                var f = app.actions[k].code[0];
                $('<span>').html(' View Source ('+f+')').appendTo(info)
                $('<pre>').append($code).appendTo(info) 
                hljs.highlightBlock($code[0], '    ');

                hash += k + ','
              });
            else
              info.html(app.config.default_info);

            document.location.hash = hash.substring(0, hash.length-1);
            app.$ui.actionInfo.html(info);
       }
    });
}
});

