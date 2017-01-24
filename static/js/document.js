
// vim: et:ts=4:sw=4:sts=4:ft=javascript
'use strict';

pandora.ui.document = function() {
    var $toolbar = Ox.Bar({size: 16})
        .bindEvent({
            doubleclick: function(e) {
                if ($(e.target).is('.OxBar')) {
                    pandora.$ui.text && pandora.$ui.text.animate({scrollTop:0}, 250);
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
        .bindEvent({
            pandora_showbrowser: function(data) {
                that.update();
            }
        }),
        item,
        $find,
        $nextButton,
        $currentButton,
        $previousButton;

    pandora.api.getDocument({
        id: pandora.user.ui.document
    }, function(result) {
        if (pandora.user.ui.document != result.data.id) {
            return;
        }
        item = result.data;
        var documentTitle = pandora.getWindowTitle(item);
        document.title = pandora.getPageTitle(document.location.pathname) || documentTitle;
        pandora.$ui.itemTitle
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
                        + item.title + '.' + item.extension,
                    width: that.width(),
                    zoom: 'fit'
                })
                : item.extension == 'html'
                ? pandora.$ui.textPanel = textPanel(item).css({
                })
                : Ox.ImageViewer({
                    area: pandora.user.ui.documents[item.id]
                        ? pandora.user.ui.documents[item.id].position
                        : [],
                    height: that.height() - 16,
                    imageHeight: item.dimensions[1],
                    imagePreviewURL: pandora.getMediaURL('/documents/' + item.id + '/256p.jpg?' + item.modified),
                    imageURL: pandora.getMediaURL('/documents/' + item.id + '/'
                        + item.title + '.' + item.extension + '?' + item.modified),
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

    function textPanel(text) {
        var textElement,
            embedURLs = getEmbedURLs(text.text),
            that = Ox.SplitPanel({
                elements: [
                    {
                        element: pandora.$ui.text = textElement = pandora.ui.textHTML(text)
                    },
                    {
                        element: pandora.$ui.textEmbed = pandora.ui.textEmbed(),
                        collapsed: !embedURLs.length,
                        size: pandora.user.ui.embedSize,
                        resizable: true,
                        resize: [192, 256, 320, 384, 448, 512]
                    }
                ],
                orientation: 'horizontal'
            }),
            selected = -1,
            selectedURL;
        /*
        $find = Ox.Input({
                clear: true,
                placeholder: Ox._('Find in Texts'),
                value: pandora.user.ui.textFind,
                width: 188
            })
            .css({
                float: 'right',
            })
            .bindEvent({
                submit: function(data) {
                    Ox.print('SUBMIT', data);
                }
            })
            .appendTo($toolbar);
        */
        $nextButton = Ox.Button({
                disabled: embedURLs.length < 2,
                title: 'arrowRight',
                tooltip: Ox._('Next Reference'),
                type: 'image'
            })
            .css({
                'margin-right': (pandora.user.ui.embedSize + Ox.SCROLLBAR_SIZE) + 'px',
                float: 'right',
            })
            .bindEvent({
                click: function() {
                    that.selectEmbed(
                        selected < embedURLs.length - 1 ? selected + 1 : 0,
                        true
                    );
                }
            })
            .appendTo($toolbar);

        $currentButton = Ox.Button({
                disabled: embedURLs.length < 1,
                title: 'center',
                tooltip: Ox._('Current Reference'),
                type: 'image'
            })
            .css({
                float: 'right',
            })
            .bindEvent({
                click: scrollToSelectedEmbed
            })
            .appendTo($toolbar);

        $previousButton = Ox.Button({
                disabled: embedURLs.length < 2,
                title: 'arrowLeft',
                tooltip: Ox._('Previous Reference'),
                type: 'image'
            })
            .css({
                float: 'right',
            })
            .bindEvent({
                click: function() {
                    that.selectEmbed(
                        selected ? selected - 1 : embedURLs.length - 1,
                        true
                    );
                }
            })
            .appendTo($toolbar);

        function getEmbedURLs(text) {
            var matches = text.match(/<a [^<>]*?href="(.+?)".*?>/gi),
                urls = [];
            if (matches) {
                matches.forEach(function(match) {
                    var url = match.match(/"(.+?)"/)[1];
                    if (pandora.isEmbedURL(url)) {
                        urls.push(url);
                    }
                });
            }
            return urls;
        }

        function scrollToSelectedEmbed() {
            var scrollTop = Math.max(
                textElement[0].scrollTop + $('#embed' + selected).offset().top - (
                    pandora.user.ui.showBrowser
                        ? pandora.$ui.documentContentPanel.options().elements[0].size
                        : 0
                ) - 48,
                0),
                position = 100 * scrollTop / Math.max(1, textElement[0].scrollHeight);
            textElement.scrollTo(position);
            window.text = textElement;
        }

        that.selectEmbed = function(index, scroll) {
            if (index != selected) {
                selected = index;
                selectedURL = embedURLs[selected]
                $('.OxSpecialLink').removeClass('OxActive');
                selected > -1 && $('#embed' + selected).addClass('OxActive');
                pandora.$ui.textEmbed.update(selectedURL);
                scroll && scrollToSelectedEmbed();
            }
        };

        that.update = function(text) {
            var index;
            embedURLs = getEmbedURLs(text);
            index = embedURLs.indexOf(selectedURL);
            if (embedURLs.length && (index == -1 || index >= embedURLs.length)) {
                index = 0;
            }
            selected = -1;
            that.selectEmbed(index);
        };

        embedURLs.length && that.selectEmbed(0);
        return that;
    }

    that.info = function() {
        return item;
    };

    that.update = function() {
        $content.options({
            height: that.height(),
            width: that.width()
        });
        $nextButton && $nextButton.css({
            'margin-right': (pandora.user.ui.embedSize + Ox.SCROLLBAR_SIZE) + 'px',
        });
    };

    return that;

};
