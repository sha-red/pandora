// vim: et:ts=4:sw=4:sts=4:ft=javascript
pandora.ui.status = function(key, data) {
    var that = Ox.toTitleCase(key) + ': ' + [
        Ox.formatNumber(data.items) + ' '+ (data.items != 1 ? pandora.site.itemName.plural : pandora.site.itemName.sinular),
        Ox.formatDuration(data.runtime, 'medium'),
        data.files + ' file' + (data.files != 1 ? 's' : ''),
        Ox.formatDuration(data.duration, 'short'),
        Ox.formatValue(data.size, 'B'),
        Ox.formatValue(data.pixels, 'px')
    ].join(', ');
    return that;
};

