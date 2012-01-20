// vim: et:ts=4:sw=4:sts=4:ft=javascript

'use strict';

pandora.ui.clipsView = function(videoRatio) {

    var that = Ox.SplitPanel({
            elements: [
                {
                    element: Ox.Bar({size: 24})
                        .append(
                            pandora.$ui.sortSelect = pandora.ui.sortSelect()
                        )
                        .append(
                            pandora.$ui.orderButton = pandora.ui.orderButton()
                        )
                        .append(
                            Ox.Input({
                                    clear: true,
                                    placeholder: 'Find Clips',
                                    value: pandora.user.ui.itemFind.conditions[0]
                                        ? pandora.user.ui.itemFind.conditions[0].value : '',
                                    width: 192
                                })
                                .css({float: 'right', margin: '4px'})
                                .bindEvent({
                                    submit: function(data) {
                                        pandora.UI.set('itemFind', data.value ? {
                                            conditions: [{key: 'annotations', value: data.value, operator: '='}],
                                            operator: '&'
                                        } : pandora.site.user.ui.itemFind);
                                        // since this is the only way itemFind can change,
                                        // there's no need for an event handler
                                        that.replaceElement(1,
                                            pandora.$ui.clipList = pandora.ui.clipList(videoRatio)
                                        );
                                    }
                                })
                        ),
                    size: 24
                },
                {
                    element: pandora.$ui.clipList = pandora.ui.clipList(videoRatio)
                }
            ],
            orientation: 'vertical'
        });

    return that;
  
};
