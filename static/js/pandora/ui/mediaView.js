pandora.ui.mediaView = function() {

    var item = pandora.user.ui.item,
        view = pandora.user.ui.itemView,
        width = pandora.$ui.document.width() - pandora.$ui.mainPanel.size(0) - 1,
        height = pandora.$ui.contentPanel.size(1),
        listWidth = 144 + Ox.UI.SCROLLBAR_SIZE,
        previewWidth = width - listWidth,
        previewHeight = height - 48,
        previewRatio = previewWidth / previewHeight,
        $preview = Ox.Element(),
        that = Ox.SplitPanel({
            elements: [
                {
                    element: Ox.Element(),
                    size: listWidth
                },
                {
                    element: $preview
                }
            ],
            orientation: 'horizontal'
        });

    pandora.api.get({
        id: item,
        keys: [view]
    }, function(result) {
        var images = result.data[view],
            selected = [images.filter(function(image) {
                return image.selected;
            })[0]['index']],
            $list = Ox.IconList({
                    item: function(data, sort, size) {
                        var ratio = data.width / data.height;
                        size = size || 128;
                        return {
                            height: ratio <= 1 ? size : size / ratio,
                            id: data['id'],
                            info: data.width + ' x ' + data.height + ' px',
                            title: view == 'frames' ? Ox.formatDuration(data.position) : data.source,
                            url: data.url,
                            width: ratio >= 1 ? size : size * ratio
                        }
                    },
                    items: images,
                    keys: view == 'frames'
                        ? ['index', 'position', 'width', 'height', 'url']
                        : ['index', 'source', 'width', 'height', 'url'],
                    max: 1,
                    min: 1,
                    orientation: 'vertical',
                    selected: selected,
                    size: 128,
                    sort: [{key: 'index', operator: '+'}],
                    unique: 'index'
                })
                .css({background: 'rgb(16, 16, 16)'})
                .bindEvent({
                    select: function(event) {
                        var index = event.ids[0],
                            image = images.filter(function(image) {
                                return image.index == index;
                            })[0],
                            imageRatio = image.width / image.height,
                            imageWidth = imageRatio > previewRatio ? previewWidth : previewHeight * imageRatio,
                            imageHeight = imageRatio < previewRatio ? previewHeight : previewWidth / imageRatio;
                        $preview.html(
                            $('<img>')
                                .attr({
                                    src: image.url
                                })
                                .css({
                                    position: 'absolute',
                                    left: 0,
                                    top: 0,
                                    right: 0,
                                    bottom: 0,
                                    width: imageWidth + 'px',
                                    height: imageHeight + 'px',
                                    margin: 'auto'
                                })
                        );
                        pandora.api[view == 'frames' ? 'setPosterFrame' : 'setPoster'](Ox.extend({
                            id: item
                        }, view == 'frames' ? {
                            position: image.index // api slightly inconsistent
                        } : {
                            source: image.source
                        }), function(result) {
                            $('img[src*="/' + item + '/poster"]').each(function() {
                                var $this = $(this);
                                Ox.print('??', $this.attr('src').split('?')[0] + '?' + Ox.uid())
                                $this.attr({
                                    src: $this.attr('src').split('?')[0] + '?' + Ox.uid()
                                });
                            });
                        });
                    }
                });
        that.replaceElement(0, $list);
    });


    return that;

}