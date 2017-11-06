// vim: et:ts=4:sw=4:sts=4:ft=javascript

'use strict';

pandora.ui.documentsDialog = function() {

    var dialogHeight = Math.round((window.innerHeight - 48) * 0.9),
        dialogWidth = Math.round(window.innerWidth * 0.9),

        // FIXME: user may not have the manage entites capability
        $switchButton = Ox.Button({
                disabled: !pandora.site.entities.length
                    || !pandora.hasCapability('canManageEntities'),
                title: Ox._('Manage Entities...')
            })
            .bindEvent({
                click: function() {
                    that.close();
                    (pandora.$ui.entitiesDialog || (
                        pandora.$ui.entitiesDialog = pandora.ui.entitiesDialog()
                    )).open();
                }
            }),

        $doneButton = Ox.Button({
                id: 'done',
                title: Ox._('Done'),
                width: 48
            }).bindEvent({
                click: function() {
                    that.close();
                }
            }),

        // reference in pandora.$ui needed to receive pandora_ events
        $content = pandora.$ui.documentsDialogPanel = pandora.ui.documentsPanel({
            isItemView: false 
        }),

        that = Ox.Dialog({
                buttons: [$switchButton, {}, $doneButton],
                closeButton: true,
                content: $content,
                height: dialogHeight,
                maximizeButton: true,
                minHeight: 256,
                minWidth: 512,
                padding: 0,
                removeOnClose: true,
                title: Ox._('Manage Documents'),
                width: dialogWidth
            })
            .bindEvent({
                resize: $content.updateSize
            });

    that.superClose = that.close;
    that.close = function() {
        Ox.Request.clearCache('findDocuments');
        that.superClose();
        // needed in documentDialog to determine if isItemView
        delete pandora.$ui.documentsDialog;
    };

    function addDocuments() {
        pandora.api.addDocument({
            item: pandora.user.ui.item,
            ids: pandora.user.ui.documentsSelection['']
        }, function() {
            Ox.Request.clearCache();
            if (pandora.user.ui.itemView == 'documents') {
                //fixme just upload list here
                //self.$documentsList.reloadList();
                pandora.$ui.contentPanel.replaceElement(1,
                    pandora.$ui.item = pandora.ui.item());
            }
        });
    }

    return that;

};
