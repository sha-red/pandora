// vim: et:ts=4:sw=4:sts=4:ft=javascript

pandora.ui.eventsDialog = function() {
    var height = Math.round((window.innerHeight - 48) * 0.9),
        width = Math.round(window.innerWidth * 0.9),
        that = Ox.Dialog({
            buttons: [
                Ox.Button({
                    id: 'done',
                    title: 'Done'
                }).bindEvent({
                    click: function() {
                        that.close();
                    }
                })
            ],
            closeButton: true,
            content: Ox.Element(),
            height: height,
            maximizeButton: true,
            minHeight: 256,
            minWidth: 512,
            padding: 0,
            title: 'Manage Events',
            width: width
        });

    pandora.api.findEvents({
        query: {conditions: [], operator: '&'}        
    }, function(result) {
        pandora.api.findEvents({
            query: {conditions: [], operator: '&'},
            keys: [],
            range: [0, result.data.items],
            sort: [{key: 'name', operator: '+'}]
        }, function(result) {
            that.options({
                content: Ox.ListCalendar({
                    height: height - 48,
                    events: result.data.items,
                    width: width
                })
            });
        })
    })

    return that;
};

