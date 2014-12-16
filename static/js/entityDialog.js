// vim: et:ts=4:sw=4:sts=4:ft=javascript

'use strict';

pandora.ui.entityDialog = function() {

    var ui = pandora.user.ui,

        $content = Ox.Element()
            .css({overflowY: 'auto'}),

        that = Ox.Dialog({
            closeButton: true,
            content: $content, 
            fixedSize: true,
            focus: false,
            height: 416,
            padding: 0,
            removeOnClose: true,
            title: '',
            width: 560,
        })
        .bindEvent({
            close: function() {
                pandora.UI.set({entity: ''});
                delete pandora.$ui.entityDialog;
            },
            pandora_entity: function(data) {
                if (data.value) {
                    setTitle();
                    setContent();
                } else {
                    that.close();
                }
            }
        });

    setTitle();
    setContent();

    function setContent() {
        ui.entity && pandora.entity({
            id: ui.entity,
            view: 'entity'
        }, function(html) {
            $content.html(html);
        });
    }

    function setTitle() {
        ui.entity && pandora.api.getEntity({
            id: ui.entity
        }, function(result) {
            that.options({title: result.data.name});
        });
    }

    return that;

};