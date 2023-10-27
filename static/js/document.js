'use strict';

pandora.ui.document = function() {
    var $toolbar = Ox.Bar({size: 16})
        .bindEvent({
            doubleclick: function(e) {
                if ($(e.target).is('.OxBar')) {
                    pandora.$ui.textPanel && pandora.$ui.textPanel.scrollTextTop();
                }
            }
        }),
        $content = Ox.Element(),
        that = Ox.SplitPanel({
            elements: [
                {
                    element: $toolbar,
                    size: 16
                },
                {
                    element: $content
                }
            ],
            orientation: 'vertical'
        })
        .update(function(key, value) {
            console.log('got update', key, value)
            if (Ox.contains(['area', 'zoom', 'page'], key)) {
                $content.options(key, value)
            }
        })
        .bindEvent({
            pandora_showbrowser: function(data) {
                that.update();
            }
        }),
        item;

    pandora.api.getDocument({
        id: pandora.user.ui.document
    }, function(result) {
        if (pandora.user.ui.document != result.data.id) {
            return;
        }
        item = result.data;
        var documentTitle = pandora.getWindowTitle(item);
        document.title = pandora.getPageTitle(document.location.pathname) || documentTitle;
        pandora.$ui.itemTitle && pandora.$ui.itemTitle
            .options({title: '<b>' + (pandora.getDocumentTitle(item)) + '</b>'})
            .show();

        if (pandora.user.ui.documentView == 'info') {
            $content.replaceWith(
                $content = pandora.ui.documentInfoView(result.data)
            );
        } else {
            setContent();
        }
    });

    function setContent() {
        that.replaceElement(1, $content = (
                item.extension == 'pdf'
                ? Ox.PDFViewer({
                    height: that.height() - 16,
                    page: pandora.user.ui.documents[item.id]
                        ? pandora.user.ui.documents[item.id].position
                        : 1,
                    url: '/documents/' + item.id + '/'
                        + pandora.safeDocumentName(item.title) + '.' + item.extension,
                    width: that.width(),
                    zoom: 'fit'
                })
                : item.extension == 'html'
                ? pandora.$ui.textPanel = pandora.ui.textPanel(item, $toolbar)
                : Ox.ImageViewer({
                    area: pandora.user.ui.documents[item.id]
                        ? pandora.user.ui.documents[item.id].position
                        : [],
                    height: that.height() - 16,
                    imageHeight: item.dimensions[1],
                    imagePreviewURL: pandora.getMediaURL('/documents/' + item.id + '/256p.jpg?' + item.modified),
                    imageURL: pandora.getMediaURL('/documents/' + item.id + '/'
                        + pandora.safeDocumentName(item.title) + '.' + item.extension + '?' + item.modified),
                    imageWidth: item.dimensions[0],
                    width: that.width()
                }).css({
                    //prevents image overflow on zoom, fixme: fix in Ox.ImageViewer
                    position: 'absolute'
                })
            )
            .bindEvent({
                center: function(data) {
                    pandora.UI.set(
                        'documents.' + item.id,
                        {position: $content.getArea().map(Math.round)}
                    );
                },
                embed: function(data) {
                    var id = item.id;
                    pandora.$ui.embedDocumentDialog = pandora.ui.embedDocumentDialog(
                        id,
                        data.page
                    ).open();
                },
                key_escape: function() {
                    // ...
                },
                page: function(data) {
                    pandora.UI.set(
                        'documents.' + item.id,
                        {position: data.page}
                    );
                },
                zoom: function(data) {
                    pandora.UI.set(
                        'documents.' + item.id,
                        {position: $content.getArea().map(Math.round)}
                    );
                }
            })
        );
        if (item.extension == 'html') {
            that.css({
                'overflow-y': 'auto'
            });
        }
    }

    that.info = function() {
        return item;
    };

    that.update = function() {
        $content.options({
            height: that.height(),
            width: that.width()
        });
        pandora.$ui.textPanel && pandora.$ui.textPanel.update();
    };

    return that;

};
