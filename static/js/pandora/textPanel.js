'use strict';

pandora.ui.textPanel = function() {

    var that = Ox.SplitPanel({
            elements: [
                {element: Ox.Element(), size: 24},
                {element: Ox.Element()},
                {element: Ox.Element(), size: 16}
            ],
            orientation: 'vertical'
        }),
        embedURLs,
        selected;

    pandora.api.getText({id: pandora.user.ui.text}, function(result) {

        Ox.print('TEXT:', result.data);

        var text = result.data;
        embedURLs = text.type == 'html'
            ? getEmbedURLs(text.text)
            : [];
        selected = embedURLs.length ? 0 : -1;

        var $toolbar = Ox.Bar({size: 24}),

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
                .bindEvent({
                    click: function() {
                        selectEmbed(
                            selected < embedURLs.length - 1 ? selected + 1 : 0
                        );
                    }
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
                .bindEvent({
                    click: function() {
                        selectEmbed(
                            selected ? selected - 1 : embedURLs.length - 1
                        );
                    }
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
                        element: pandora.$ui.textEmbed = pandora.ui.textEmbed(embedURLs[selected]),
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
                $uploadButton = Ox.FileButton({
                        image: 'upload',
                        tooltip: 'Upload PDF',
                        type: 'image'
                    })
                    .css({
                        float: 'left',
                        margin: '4px 2px 4px 4px'
                    })
                    .bindEvent({
                        click: function(data) {
                            if(data.files.length) {
                                pandora.$ui.uploadPDFDialog = pandora.ui.uploadPDFDialog({
                                    file: data.files[0],
                                    id: pandora.user.ui.text
                                }).open();
                            }
                        }
                    })
                    .appendTo($toolbar);
            }
        }

        that.replaceElement(0, $toolbar);
        that.replaceElement(1, $panel);
        that.replaceElement(2, $statusbar);

    });

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

    function selectEmbed(index) {
        selected = index;
        pandora.$ui.textEmbed.update(embedURLs[selected]);
    }

    return that;

};

pandora.ui.textHTML = function(text) {

    var height = getHeight(),
        width = getWidth(),

        that = Ox.Element()
            .css({margin: '16px'}),

        $title = Ox.Editable({
                editable: text.editable,
                height: 32,
                placeholder: text.editable ? 'Doubleclick to edit title' : 'Untitled',
                tooltip: text.editable ? 'Doubleclick to edit title' : '',
                value: text.name,
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
                format: function(text) {
                    return text.replace(
                        /<a [^<>]*?href="(.+?)".*?>/gi,
                        function() {
                            var link = arguments[0], url = arguments[1];
                            return pandora.isEmbedURL(url)
                                ? '<a class="OxSpecialLink" href="' + url + '">'
                                : link;
                        }
                    );
                },
                height: height,
                maxHeight: Infinity,
                placeholder: text.editable ? 'Doubleclick to edit text' : '',
                tooltip: text.editable ? 'Doubleclick to edit text' : '',
                type: 'textarea',
                width: width,
                value: text.text
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
                    Ox.print('SUBMIT', data.value);
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
    if (text.uploaded) {
        $('<iframe>')
            .attr({
                height: '100%',
                frameborder: 0,
                src: '/texts/' + pandora.user.ui.text + '/text.pdf.html',
                width: '100%'
            })
        .appendTo(that);

    } else {
        that.html('UPLOADED: ' + text.uploaded);
    }
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
                width: '100%',
                allowFullScreen: true,
                mozallowfullscreen: true,
                webkitAllowFullScreen: true
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
        var parsed, src;
        if (url) {
            url = url.replace(/&amp;/g, '&') + '&matchRatio=true';
            src = $iframe.attr('src');
            parsed = {src: Ox.parseURL(src), url: Ox.parseURL(url)};
            if (
                src
                && parsed.url.protocol == parsed.src.protocol
                && parsed.url.hostname == parsed.src.hostname
            ) {
                $iframe[0].contentWindow.postMessage(
                    parsed.url.pathname + parsed.url.search + parsed.url.hash,
                    '*'
                );
            } else {
                $iframe.attr({src: url});                
            }
            $message.hide();
            $iframe.show();
        } else {
            $iframe.hide();
            $message.show();
        }
        return that;
    };

    that.update(url);

    return that;

};
