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
                    addPlace: function(data, callback) {
                        Ox.print('ADDPLACE', data);
                        pandora.api.addPlace(data.place, callback);
                    },
                    editPlace: function(data, callback) {
                        Ox.print('EDITPLACE', data);
                        pandora.api.editPlace(data.place, callback);
                    },
                    removePlace: function(data, callback) {
                        Ox.print('REMOVEPLACE', data);
                        pandora.api.removePlace(data.id, callback);
                    },
                    width: width
                }),
            height: height,
            keys: {enter: 'done', escape: 'done'},
            padding: 0,
            title: 'Manage Places',
            width: width
        });
    return that;
};

