/***
    Pandora API
***/

var app = new Ox.App({
    apiURL: '/api/',
    config: '/site.json',
    init: 'hello',
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

    app.api.apidoc(function(results) { app.docs = results.data.actions; });

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
            if(!data.keys) {
                app.api.apidoc(function(results) {
                    var items = [];
                    $.each(results.data.actions, function(k) {items.push({'name':  k})});
                    var result = {'data': {'items': items.length}};
                    callback(result);
                });
            } else {
                app.api.apidoc(function(results) {
                    var items = [];
                    $.each(results.data.actions, function(k) {items.push({'name':  k})});
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
           var info = $('<div>');
           $.each(data.ids, function(v, k) {
                console.log(k)
                info.append($("<h2>").html(k));
                info.append($('<pre>').html(app.docs[k].replace('/\n/<br>\n/g')));
            });
            app.$ui.actionInfo.html(info);
       }
    });
}

/*
    .bindEvent({
        load: function(event, data) {
            app.$ui.total.html(app.constructStatus('total', data));
            data = [];
            $.each(app.config.totals, function(i, v) {
                data[v.id] = 0;
            });
            app.$ui.selected.html(app.constructStatus('selected', data));
        },
        open: function(event, data) {
            //alert(data.toSource());
			var $iframe = $('<iframe frameborder="0">')
			               .css({
			                    width:'100%',
			                    height: '99%',
			                    border: 0,
			                    margin: 0,
			                    padding: 0
			                });

            var $dialog = new Ox.Dialog({
                    title: 'Downloading',
                    buttons: [
                        {
                            title: 'Close',
                            click: function() {
                                $dialog.close();
                            }
                        }
                    ],
                    width: 800,
                    height: 400
                })
                .append($iframe)
                .open();

            app.api.find({
                query: {
                    conditions: [{
                            key: 'id',
                            value: data.ids[0],
                            operator: '='
                    }],
                    operator: ''
                },
                keys: ['links'],
                range: [0, 100]
            }, function(result) {
                var url = result.data.items[0].links[0];
                $iframe.attr('src', 'http://anonym.to/?' + url);

                //var url = result.data.items[0].links[0];
                //document.location.href = url;
                //window.open(url, "download");
                
            });
        },
        select: function(event, data) {
            app.api.find({
                query: {
                    conditions: $.map(data.ids, function(id, i) {
                        return {
                            key: 'id',
                            value: id,
                            operator: '='
                        }
                    }),
                    operator: '|'
                }
            }, function(result) {
                app.$ui.selected.html(app.constructStatus('selected', result.data));
            });
       }
    });
}
*/
