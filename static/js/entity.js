// vim: et:ts=4:sw=4:sts=4:ft=javascript

'use strict';

pandora.entity = function(options, callback) {
    // options: {id, view}, view: 'annotation' or 'entity'
    pandora.api.getEntity({
        id: options.id
    }, function(response) {
        Ox.get(
            '/static/html/entities.' + response.data.type + '.' + options.view + '.html',
            function(html) {
                html = html.replace(/\{(.+?)\}/g, function() {
                    var parts = arguments[1].split('|'),
                        value = response.data[parts[0]];
                    return Ox.isEmpty(value)
                        || Ox.isNull(value)
                        || Ox.isUndefined(value)
                        ? Ox._(parts[1] || '<span class="OxLight">unknown</a>')
                        : Ox.isArray(value) ? value.join('; ')
                        : value;
                });
                callback(html);
            }
        );
    });
};
