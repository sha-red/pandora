// vim: et:ts=4:sw=4:sts=4:ft=javascript
'use strict';
pandora.ui.folderPlaceholder = function(id, section) {
    var that = Ox.Element()
            .addClass('OxLight')
            .css({
                height: '14px',
                padding: '1px 4px',
            });
    that.updateText = function(string, isFind) {
        return that.html(
            string != 'volumes'
            ? Ox._('No {0} {1}' + (isFind ? ' found' : ''),
                [Ox._(string), Ox._(section == 'items' ? 'lists' : section)])
            : Ox._('No local volumes')
        );
    };
    return that.updateText(id);
};

