// vim: et:ts=4:sw=4:sts=4:ft=javascript

'use strict';

pandora.ui.entity = function(options, callback) {
    // options: {id, view}
    pandora.api.getEntity({
        id: options.id
    }, function(data) {
        Ox.get(
            '/static/html/entities.' + data.type + '.' + options.view + '.html',
            function(html) {
                html = html.replace(/\{(.+?)\}/g, function() {
                    var parts = arguments[1].split('|'),
                        value = data[parts[0]];
                    return Ox.isEmpty(value)
                        || Ox.isNull(value)
                        || Ox.isUndefined(value)
                        ? Ox._(parts[1] || 'unknown')
                        : Ox.isArray(value) ? value.join('; ')
                        : value;
                });
                callback(html);
            }
        );
    });
};