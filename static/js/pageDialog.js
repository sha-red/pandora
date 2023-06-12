'use strict';


pandora.ui.pageDialog = function(options, self) {
    self = self || {}
    self.options = Ox.extend({
    }, options);

    console.log(options)

    var dialogHeight = Math.round((window.innerHeight - 48) * 0.9) - 24,
        dialogWidth = Math.round(window.innerWidth * 0.9) - 48,
        isItemView = !pandora.$ui.documentsDialog,

        $content = Ox.Element(),

        that = Ox.Dialog({
                closeButton: true,
                content: $content,
                focus: false,
                height: dialogHeight,
                maximizeButton: true,
                minHeight: 256,
                minWidth: 512,
                padding: 0,
                removeOnClose: true,
                title: '',
                width: dialogWidth
            })
            .bindEvent({
                close: function() {
                    delete pandora.$ui.pageDialog;
                },
                resize: function(data) {
                    dialogHeight = data.height;
                    dialogWidth = data.width;
                    $content.options({
                        height: dialogHeight,
                        width: dialogWidth
                    });
                },
            }),

        $infoButton = Ox.Button({
                title: 'info',
                tooltip: Ox._('Open PDF'),
                type: 'image'
            })
            .css({
                position: 'absolute',
                right: '24px',
                top: '4px'
            })
            .bindEvent({
                click: function(data) {
                    that.close();
                    pandora.URL.push(`/documents/${self.options.document}/${self.options.page}`);
                }
            }),

        $selectButton = Ox.ButtonGroup({
                buttons: [
                    {id: 'previous', title: 'left', tooltip: Ox._('Previous')},
                    {id: 'next', title: 'right', tooltip: Ox._('Next')}
                ],
                type: 'image'
            })
            .css({
                position: 'absolute',
                right: '44px',
                top: '4px'
            })
            [self.options.pages.length > 1 ? 'show' : 'hide']()
            .bindEvent({
                click: function(data) {
                    var pageIdx = self.options.pages.indexOf(self.options.page)
                    if (data.id == 'previous') {
                        pageIdx--
                    } else {
                        pageIdx++
                    }
                    if (pageIdx < 0) {
                        pageIdx = self.options.pages.length - 1
                    } else if (pageIdx >= self.options.pages.length) {
                        pageIdx = 0
                    }
                    that.update({
                        page: self.options.pages[pageIdx]
                    })
                }
            });

    $(that.find('.OxBar')[0])
        .append($infoButton)
        .append($selectButton);
    // fixme: why is this needed?
    $(that.find('.OxContent')[0]).css({overflow: 'hidden'});

    setTitle();
    setContent();

    function setContent() {
        var url = `/documents/${self.options.document}/1024p${self.options.page}.jpg`
        if (self.options.query) {
            url += '?q=' + encodeURIComponent(self.options.query)
        }
        $content.replaceWith(
            $content = (
                Ox.ImageViewer({
                    area: [],
                    height: dialogHeight,
                    imageHeight: self.options.dimensions[1],
                    imagePreviewURL: url.replace('/1024p', `/${self.options.size}p`),
                    imageURL: url,
                    imageWidth: self.options.dimensions[0],
                    width: dialogWidth
                })
            )
            .bindEvent({
                center: function(data) {
                    /*
                    pandora.UI.set(
                        'documents.' + item.id,
                        {position: $content.getArea().map(Math.round)}
                    );
                    */
                },
                key_escape: function() {
                    pandora.$ui.pageDialog.close();
                },
                page: function(data) {
                    /*
                    pandora.UI.set(
                        'documents.' + item.id,
                        {position: data.page}
                    );
                    */
                },
                zoom: function(data) {
                    /*
                    pandora.UI.set(
                        'documents.' + item.id,
                        {position: $content.getArea().map(Math.round)}
                    );
                    */
                }
            })
        );
    }

    function setTitle() {
        that.options({
            title: (self.options.title || "") + " Page " + self.options.page
        });
    }


    that.update = function(options) {
        self.options = Ox.extend(self.options, options)
        setTitle();
        setContent();
    };

    return that;

};

