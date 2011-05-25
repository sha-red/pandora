// vim: et:ts=4:sw=4:sts=4:ft=js
pandora.ui.status = function(key, data) {
    var that = Ox.toTitleCase(key) + ': ' + [
        Ox.formatNumber(data.items) + ' movie' + (data.items != 1 ? 's' : ''),
        Ox.formatDuration(data.runtime, 'medium'),
        data.files + ' file' + (data.files != 1 ? 's' : ''),
        Ox.formatDuration(data.duration, 'short'),
        Ox.formatValue(data.size, 'B'),
        Ox.formatValue(data.pixels, 'px')
    ].join(', ');
    return that;
};

