'use strict';

pandora.ui.loadingIcon = function() {

    var that = Ox.LoadingIcon({size: 'medium'});

    that.update = function(requests) {
        that[requests ? 'start' : 'stop']().options({
            tooltip: (requests || 'No') + ' request' + (requests == 1 ? '' : 's')
        });
    };

    return that;

};
