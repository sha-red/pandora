// vim: et:ts=4:sw=4:sts=4:ft=javascript

'use strict';

pandora.ui.clipsView = function(videoRatio) {

    var $status = $('<div>')
            .css({
                width: '100%',
                marginTop: '2px',
                fontSize: '9px',
                textAlign: 'center'
            })
            .html('Loading...'),

        that = Ox.SplitPanel({
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
                                    value: pandora.user.ui.itemFind,
                                    width: 192
                                })
                                .css({float: 'right', margin: '4px'})
                                .bindEvent({
                                    submit: function(data) {
                                        $status.html('Loading...');
                                        pandora.UI.set('itemFind', data.value);
                                        // since this is the only way itemFind can change,
                                        // there's no need for an event handler
                                        that.replaceElement(1,
                                            pandora.$ui.clipList = getClipList()
                                        );
                                    }
                                })
                        ),
                    size: 24
                },
                {
                    element: pandora.$ui.clipList = getClipList()
                },
                {
                    element: Ox.Bar({size: 16}).append($status),
                    size: 16
                }
            ],
            orientation: 'vertical'
        });

    function getClipList() {
        return pandora.ui.clipList(videoRatio)
            .bindEvent({
                init: function(data) {
                    var items = data.items;
                    $status.html(
                        (items ? Ox.formatNumber(items) : 'No')
                        + ' Clip' + (items == 1 ? '' : 's')
                    );
                }
            });
    }

    return that;
  
};
