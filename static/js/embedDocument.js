// vim: et:ts=4:sw=4:sts=4:ft=javascript

'use strict';

pandora.ui.embedDocument = function() {
    var that = Ox.Element();
    pandora.ui.document().appendTo(that)
    return that;
};
