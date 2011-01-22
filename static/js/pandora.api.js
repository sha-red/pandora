/***
    Pandora API
***/

var app = new Ox.App({
    apiURL: '/api/',
    init: 'init',
}).launch(function(data) {
    Ox.print('data', data)
    app.config = data.config;
    app.user = data.user;
    if (app.user.group == 'guest') {
        app.user = data.config.user;
        $.browser.safari && Ox.theme('modern');
    }

    app.$body = $('body');
    app.$document = $(document);
    app.$window = $(window);
    //app.$body.html('');

    app.$ui = {};
    app.$ui.actionList = constructList();
    app.$ui.actionInfo = Ox.Container().css({padding: '8px'});

    app.api.api({docs: true}, function(results) {
        app.actions = results.data.actions;

        if(document.location.hash) {
            app.$ui.actionList.triggerEvent('select', {ids: document.location.hash.substring(1).split(',')});
        }
    });

    app.$ui.actionList.$body.css({overflowX: 'hidden', overflowY: 'auto'});
    var $main = new Ox.SplitPanel({
        elements: [
            {
                element: app.$ui.actionList,
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
        request: function(data, callback) {
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
           $.each(data.ids, function(v, k) {
                console.log(k)
                info.append($("<h2>").html(k));
                info.append($('<pre>').html(app.actions[k]['doc'].replace('/\n/<br>\n/g')));
                hash += k + ','
            });
            document.location.hash = hash.substring(0, hash.length-1);
            app.$ui.actionInfo.html(info);
       }
    });
}
