'use strict';

pandora.ui.embedNavigation = function(type) {

    var that = pandora.ui.navigationView(type, 16/9);

    that.resizePanel = function() {
        pandora.$ui.map.resizeMap();
        return that;
    };

    return that;

};