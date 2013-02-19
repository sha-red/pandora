'use strict';

pandora.ui.text = function() {
    var ui = pandora.user.ui,
        canEdit = pandora.site.capabilities.canEditSitePages[pandora.user.level],
        that,
        text,
        $text;

    getText(ui.text);

    that = Ox.Element()
        .bindEvent({
            pandora_text: function(data) {
                if (ui.text != text) {
                    text = ui.text;
                    getText(ui.text);
                }
            }
        });

    function getText(id) {
        pandora.api.getText({id: id}, function(result) {
            if (!result.data) {
                pandora.UI.set({text: ''});
            } else if (result.data.type == 'pdf') {
                $text && $text.remove();
                $text = Ox.Editable({
                    clickLink: pandora.clickLink,
                    editable: false,
                    type: 'textarea',
                    value: 'REPLACE ME WITH PDF VIEWER'
                })
                .appendTo(that);
            } else {
                var text = result.data ? result.data.text : '';
                $text && $text.remove();
                $text = Ox.Editable({
                    clickLink: pandora.clickLink,
                    editable: canEdit,
                    tooltip: canEdit ? 'Doubleclick to edit' : '',
                    type: 'textarea',
                    placeholder: 'No text',
                    value: text
                })
                .bindEvent({
                    submit: function(data) {
                        Ox.Request.clearCache('getText');
                        pandora.api.editText({
                            id: ui.text,
                            text: data.value
                        });
                    }
                })
                .appendTo(that);
            }
        });
    }
    return that;
}
