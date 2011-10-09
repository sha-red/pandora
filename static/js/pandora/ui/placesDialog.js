// vim: et:ts=4:sw=4:sts=4:ft=javascript

pandora.ui.placesDialog = function() {
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
            content: Ox.ListMap({
                    height: height - 48,
                    places: function(data, callback) {
                        return pandora.api.findPlaces(Ox.extend({
                            query: {conditions: [], operator: ''}
                        }, data), callback);
                    },
                    addPlace: function(place, callback) {
                        pandora.api.addPlace(place, function(result) {
                            Ox.Request.clearCache(); // fixme: remove
                            callback(result);
                        });
                    },
                    editPlace: function(place, callback) {
                        pandora.api.editPlace(place, function(result) {
                            Ox.Request.clearCache(); // fixme: remove
                            callback(result);
                        });
                    },
                    removePlace: function(place, callback) {
                        pandora.api.removePlace(place, function(result) {
                            Ox.Request.clearCache(); // fixme: remove
                            callback(result);
                        });
                    },
                    showTypes: true,
                    width: width
                }),
            height: height,
            maximizeButton: true,
            minHeight: 256,
            minWidth: 512,
            //keys: {enter: 'done', escape: 'done'},
            padding: 0,
            title: 'Manage Places',
            width: width
        });
    return that;
};

