// vim: et:ts=4:sw=4:sts=4:ft=javascript
'use strict';
pandora.ui.folderPlaceholder = function(id, section) {
    var that = Ox.Element()
            .addClass('OxLight')
            .css({
                height: '14px',
                padding: '1px 4px',
            });
    that.updateText = function(string) {
        return that.html(
            Ox._(
                string != 'volumes'
                ? 'No ' + string + ' ' + (section == 'items' ? 'lists' : section)
                : 'No local volumes'
            )
        );
    };
    return that.updateText(id);
};

