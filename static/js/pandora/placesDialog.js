// vim: et:ts=4:sw=4:sts=4:ft=javascript

'use strict';

pandora.ui.placesDialog = function() {
    var height = Math.round((window.innerHeight - 48) * 0.9),
        width = Math.round(window.innerWidth * 0.9),
        $content = Ox.ListMap({
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
            getMatches: function(names, callback) {
                // fixme: the results of this are of course
                // not identical to actual place matches
                var key = pandora.site.layers.filter(function(layer) {
                        return layer.type == 'place' || layer.hasPlaces;
                    }).map(function(layer) {
                        return layer.id;
                    })[0],
                    operator = Ox.getObjectById(pandora.site.layers, key).type == 'place' ?
                        '==' : '=';
                pandora.api.findClips({
                    query: {
                        conditions: names.map(function(name) {
                            return {key: key, value: name, operator: operator};
                        }),
                        operator: names.length == 1 ? '&' : '|'
                    }
                }, function(result) {
                    callback(result.data.items);
                });
            },
            removePlace: function(place, callback) {
                pandora.api.removePlace(place, function(result) {
                    Ox.Request.clearCache(); // fixme: remove
                    callback(result);
                });
            },
            showControls: pandora.user.ui.showMapControls,
            showLabels: pandora.user.ui.showMapLabels,
            showTypes: true,
            width: width
        }),
        that = Ox.Dialog({
            buttons: [
                Ox.Button({
                    id: 'manageEvents',
                    title: 'Manage Events...'
                }).bindEvent({
                    click: function() {
                        // ...
                    }
                }),
                {},
                Ox.Button({
                    id: 'done',
                    title: 'Done',
                    width: 48
                }).bindEvent({
                    click: function() {
                        that.close();
                    }
                })
            ],
            closeButton: true,
            content: $content,
            height: height,
            maximizeButton: true,
            minHeight: 256,
            minWidth: 512,
            //keys: {enter: 'done', escape: 'done'},
            padding: 0,
            title: 'Manage Places',
            width: width
        })
        .bindEvent({
            resize: function(data) {
                // data is {width: ..., height: ...}
                $content.options(data);
            }
        });
    return that;
};

