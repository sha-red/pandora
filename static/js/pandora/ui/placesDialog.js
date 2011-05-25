// vim: et:ts=4:sw=4:sts=4:ft=js
pandora.ui.placesDialog = function() {
    var height = Math.round(document.height * 0.8),
        width = Math.round(document.width * 0.8),
        that = new Ox.Dialog({
            buttons: [
                new Ox.Button({
                    id: 'done',
                    title: 'Done'
                }).bindEvent({
                    click: function() {
                        that.close();
                    }
                })
            ],
            content: app.$ui.placesElement = new Ox.ListMap({
                    height: height - 48,
                    places: function(data, callback) {
                        return pandora.api.findPlaces($.extend(data, {
                            query: {conditions: [], operator: ''}
                        }), callback);
                    },
                    width: width
                })
                .bindEvent({
                    addplace: function(event, data) {
                        Ox.print('ADDPLACE', data)
                        pandora.api.addPlace(data.place, function(result) {
                            var id = result.data.id;
                            Ox.print("ID", result.data.id, result)
                            Ox.Request.clearCache(); // fixme: remove
                            Ox.print('AAAAA')
                            app.$ui.placesElement
                                .reloadList()
                                .bindEventOnce({
                                    loadlist: function() {
                                        app.$ui.placesElement
                                            .focusList()
                                            .options({selected: [id]});
                                    }
                                });
                        });
                    },
                    removeplace: function(event, data) {
                        pandora.api.removePlace(data.id, function(result) {
                            // fixme: duplicated
                            Ox.Request.clearCache(); // fixme: remove
                            app.$ui.placesElement
                                .reloadList()
                                .bindEventOnce({
                                    loadlist: function(event, data) {
                                        app.$ui.placesElement
                                            .focusList();
                                    }
                                });
                        });
                    }
                }),
            height: height,
            keys: {enter: 'done', escape: 'done'},
            padding: 0,
            title: 'Manage Places',
            width: width
        });
    return that;
};

