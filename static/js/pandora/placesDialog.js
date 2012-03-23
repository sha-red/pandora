// vim: et:ts=4:sw=4:sts=4:ft=javascript

'use strict';

pandora.ui.placesDialog = function(options) {
    // options can be {id: '...'} or {name: '...'}
    var height = Math.round((window.innerHeight - 48) * 0.9),
        width = Math.round(window.innerWidth * 0.9),
        $content = Ox.ListMap({
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
                names.length == 0 && callback(0);
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
            hasMatches: true, // FIXME: getMatches is enough
            height: height - 48,
            mode: pandora.site.map == 'auto' ? 'add' : 'define',
            names: pandora.hasPlacesLayer ? function(callback) {
                pandora.api.getPlaceNames(function(result) {
                    callback(result.data.items);
                });
            } : null,
            places: function(data, callback) {
                data.keys && data.keys.push('matches');
                return pandora.api.findPlaces(Ox.extend({
                    query: {conditions: [], operator: ''}
                }, data), callback);
            },
            removePlace: function(place, callback) {
                pandora.api.removePlace(place, function(result) {
                    Ox.Request.clearCache(); // fixme: remove
                    callback(result);
                });
            },
            selected: options ? options.id : '',
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
                        that.close();
                        (pandora.$ui.eventsDialog || (
                            pandora.$ui.eventsDialog = pandora.ui.eventsDialog()
                        )).open();
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
                $content.options({width: width, height: height});
            }
        });
    return that;
};

