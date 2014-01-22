'use strict';

pandora.ui.embedInfo = function() {

    var ui = pandora.user.ui,

        that = Ox.Element(),

        $poster = Ox.Element('<img>')
            .attr({
                src: '/' + pandora.user.ui.item + '/poster.jpg'
            })
            .appendTo(that);

    return that;

};