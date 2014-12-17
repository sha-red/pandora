// vim: et:ts=4:sw=4:sts=4:ft=javascript

'use strict';

pandora.ui.entityDialog = function() {

    var ui = pandora.user.ui,

        $content = Ox.Element()
            .css({overflowY: 'auto'}),

        that = Ox.Dialog({
            buttons: (ui.capabilities.canManageEntities ? [
                Ox.Button({
                    id: 'edit',
                    title: Ox._('Edit Entity...')
                })
                .bindEvent({
                    click: function() {
                        that.close();
                        pandora.$ui.entitiesDialog = pandora.ui.entitiesDialog().open();
                    }
                }),
                {}
            ] : []).concat([
                Ox.Button({
                    id: 'close',
                    title: Ox._('Close')
                })
                .bindEvent({
                    click: function() {
                        that.close();
                    }
                })
            ]),
            closeButton: true,
            content: $content, 
            fixedSize: true,
            height: 416,
            keyboard: {escape: 'close'},
            padding: 0,
            removeOnClose: true,
            title: '',
            width: 560,
        })
        .bindEvent({
            close: function() {
                pandora.UI.set({
                    entity: '',
                    page: ''
                });
                delete pandora.$ui.entityDialog;
            },
            'pandora_part.entities': function(data) {
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
        ui.part.entities && pandora.entity({
            id: ui.part.entities,
            view: 'entity'
        }, function(html) {
            $content.html(html);
        });
    }

    function setTitle() {
        ui.part.entities && pandora.api.getEntity({
            id: ui.part.entities
        }, function(result) {
            that.options({title: result.data.name});
        });
    }

    return that;

};
