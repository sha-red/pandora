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
                },
                {
                    element: pandora.$ui.clipList = pandora.ui.clipList(videoRatio);
                }
            ],
            orientation: 'vertical'
        });

    return that;
  
};