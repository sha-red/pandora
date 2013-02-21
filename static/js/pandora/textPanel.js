'use strict';

pandora.ui.textPanel = function() {

    var tags = [
            'b', 'code', 'em', 'i', 's', 'span', 'strong', 'sub', 'sup', 'u',
            'blockquote', 'div', 'h1', 'h2', 'h3', 'p', 'pre',
            'li', 'ol', 'ul',
            'table', 'tbody', 'td', 'tfoot', 'th', 'thead', 'tr',
            'a', 'br', 'img',
            'rtl'
        ],

        that = Ox.SplitPanel({
            elements: [
                {element: Ox.Element(), size: 24},
                {element: Ox.Element()},
                {element: Ox.Element(), size: 16}
            ],
            orientation: 'vertical'
        });

    pandora.api.getText({id: pandora.user.ui.text}, function(result) {

        var text = result.data,

            embedURLs = getEmbedURLs(text.text),

            $toolbar = Ox.Bar({size: 24}),

            $editMenu, $uploadButton,

            $find = Ox.Input({
                    clear: true,
                    placeholder: 'Find in Texts',
                    value: pandora.user.ui.textFind,
                    width: 188
                })
                .css({
                    float: 'right',
                    margin: '4px 4px 4px 2px'
                })
                .bindEvent({
                    submit: function(data) {
                        Ox.print('SUBMIT', data);
                    }
                })
                .appendTo($toolbar),

            $nextButton = Ox.Button({
                    disabled: embedURLs.length < 2,
                    title: 'arrowRight',
                    tooltip: 'Next Clip',
                    type: 'image'
                })
                .css({
                    float: 'right',
                    margin: '4px 2px 4px 2px'
                })
                .appendTo($toolbar),

            $currentButton = Ox.Button({
                    disabled: embedURLs.length < 1,
                    title: 'center',
                    tooltip: 'Current Reference',
                    type: 'image'
                })
                .css({
                    float: 'right',
                    margin: '4px 2px 4px 2px'
                })
                .appendTo($toolbar),

            $previousButton = Ox.Button({
                    disabled: embedURLs.length < 2,
                    title: 'arrowLeft',
                    tooltip: 'Previous Clip',
                    type: 'image'
                })
                .css({
                    float: 'right',
                    margin: '4px 2px 4px 2px'
                })
                .appendTo($toolbar),

            $statusbar = Ox.Bar({size: 16}),

            $panel = Ox.SplitPanel({
                elements: [
                    {
                        element: pandora.$ui.text = text.type == 'html'
                            ? pandora.ui.textHTML(text)
                            : pandora.ui.textPDF(text)
                    },
                    {
                        element: pandora.$ui.textEmbed = pandora.ui.textEmbed(embedURLs[0]),
                        size: pandora.user.ui.embedSize,
                        resizable: true,
                        resize: [192, 256, 320, 384, 448, 512]
                    }
                ],
                orientation: 'horizontal'
            });

        if (text.editable) {
            if (text.type == 'html') {
                $editMenu = Ox.MenuButton({
                        items: [
                            {id: 'inserthtml', title: 'Insert HTML...'},
                            {id: 'insertembed', title: 'Insert Embed...'}
                        ],
                        title: 'edit',
                        tooltip: 'Editing Options',
                        type: 'image'
                    })
                    .css({
                        float: 'left',
                        margin: '4px 2px 4px 4px'
                    })
                    .appendTo($toolbar);
            } else {
                $uploadButton = Ox.Button({
                        title: 'upload',
                        tooltip: 'Upload PDF',
                        type: 'image'
                    })
                    .css({
                        float: 'left',
                        margin: '4px 2px 4px 4px'
                    })
                    .appendTo($toolbar);
            }
        }

        that.replaceElement(0, $toolbar);
        that.replaceElement(1, $panel);
        that.replaceElement(2, $statusbar);

    });

    function getEmbedURLs(text) {
        var matches = text.match(/<span data-video=".+?">/g),
            urls = [];
        if (matches) {
            matches.forEach(function(match) {
                urls.push(match.match(/"(.+?)"/)[1]);
            });
        }
        return urls;
    }

    return that;

};

pandora.ui.textHTML = function(text, tags) {

    var height = getHeight(),
        width = getWidth(),

        that = Ox.Element()
            .css({margin: '16px'}),

        $title = Ox.Editable({
                height: 32,
                placeholder: text.editable ? 'Doubleclick to edit title' : 'Untitled',
                tooltip: text.editable ? 'Doubleclick to edit title' : '',
                width: width
            })
            .css({
                //position: 'absolute',
                //width: width + 'px',
                height: '32px',
                fontSize: '18px',
            })
            .bindEvent({
                submit: function(data) {
                    Ox.Request.clearCache('getText');
                    pandora.api.editText({
                        id: pandora.user.ui.text,
                        name: data.value
                    }, function(result) {
                        Ox.print('RESULT.DATA:', result.data);
                    });
                }
            })
            .appendTo(that),

        $spaceTop = Ox.Element()
            .css({height: '16px'})
            .appendTo(that),

        $text = Ox.Editable({
                clickLink: pandora.clickLink,
                editable: text.editable,
                height: height,
                maxHeight: Infinity,
                placeholder: text.editable ? 'Doubleclick to edit text' : '',
                replaceTags: {
                    span: [
                        [
                            /<span [^<>]*?data-video="(.+?)".*?>/gi,
                            function(match) {
                                var url = Ox.parseURL(arguments[1]),
                                    query = Ox.unserialize(url.search);
                                    str = url.origin + url.pathname;
                                return 'foo';
                            }
                        ],
                        [
                            /<\/span>/gi,
                            '</span>'
                        ]
                    ]
                },
                tags: tags,
                tooltip: text.editable ? 'Doubleclick to edit text' : '',
                type: 'textarea',
                width: width
            })
            .css({
                //position: 'absolute',
                height: height + 'px',
                width: width + 'px',
                //marginTop: '48px',
                fontSize: '12px'
            })
            .bindEvent({
                submit: function(data) {
                    Ox.Request.clearCache('getText');
                    pandora.api.editText({
                        id: pandora.user.ui.text,
                        text: data.value
                    });
                }
            })
            .appendTo(that);

    function getHeight() {
        // 24 menu + 24 toolbar + 16 statusbar + 32 title + 32 margins
        return window.innerHeight - 128;
    }

    function getWidth() {
        return window.innerWidth
            - pandora.user.ui.showSidebar * pandora.user.ui.sidebarSize - 1
            - pandora.user.ui.embedSize - 1
            - 32;
    }

    that.update = function() {
        $text.options({
            height: getHeight(),
            width: getWidth()
        });
        return that;
    };

    return that;

};

pandora.ui.textPDF = function(text) {

    var that = Ox.Element();

    that.html('UPLOADED: ' + text.uploaded);

    return that;

};

pandora.ui.textEmbed = function(url) {

    var that = Ox.Element()
            .bindEvent({
                resizestart: function() {
                    url && $overlay.show();
                },
                resize: function(data) {
                    pandora.user.ui.embedSize = data.size;
                    pandora.$ui.text.update();
                },
                resizeend: function() {
                    url && $overlay.hide();
                }
            }),

        $message = $('<div>')
            .css({marginTop: '16px', textAlign: 'center'})
            .html('No Embeds')
            .hide()
            .appendTo(that),

        $iframe = $('<iframe>')
            .attr({
                height: '100%',
                frameborder: 0,
                src: '',
                width: '100%'
            })
            .hide()
            .appendTo(that),

        $overlay = $('<div>')
            .css({
                position: 'absolute',
                left: 0,
                top: 0,
                right: 0,
                bottom: 0
            })
            .hide()
            .appendTo(that);

    that.update = function(url) {
        if (url) {
            $message.hide();
            $iframe.attr({src: url}).show();
        } else {
            $iframe.hide();
            $message.show();
        }
        return that;
    };

    that.update(url);

    return that;

};