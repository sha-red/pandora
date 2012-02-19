// vim: et:ts=4:sw=4:sts=4:ft=javascript
'use strict';
pandora.ui.status = function(key, data) {
    var itemName = data.items != 1 ? pandora.site.itemName.plural : pandora.site.itemName.singular,
        segments = [],
        that = Ox.toTitleCase(key) + ': ';
    if (!pandora.user.ui.item && pandora.user.ui.listView == 'clip') {
        itemName = data.items != 1 ? 'Clips' : 'Clip';
    }
    segments.push(Ox.formatNumber(data.items) + ' '+ itemName);
    if (data.runtime)
        segments.push(Ox.formatDuration(data.runtime, 'short'));
    if (data.files)
        segments.push(data.files + ' file' + (data.files != 1 ? 's' : ''));
    if (!data.runtime && data.duration)
        segments.push(Ox.formatDuration(data.duration, 'short'));
    else if (data.duration)
        segments.push(Ox.formatDuration(data.duration));
    if (data.size)
        segments.push(Ox.formatValue(data.size, 'B'));
    if (data.pixels)
        segments.push(Ox.formatValue(data.pixels, 'px'));
    return that + segments.join(', ');
};

