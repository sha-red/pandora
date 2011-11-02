// vim: et:ts=4:sw=4:sts=4:ft=javascript

pandora.ui.contactForm = function() {

    var that = Ox.Element(),

        width = getWidth(),

        $receiptCheckbox = Ox.Checkbox({
                checked: true,
                id: 'receipt',
                title: 'Send me a receipt',
                width: width - 136
            })
            .bindEvent({
                change: function(data) {
                    $receiptCheckbox.options({
                        title: (data.checked ? 'Send' : 'Don\'t send')
                            + ' me a receipt'
                    });
                }
            }),

        $form = Ox.Form({
            items: [
                Ox.Input({
                    id: 'name',
                    label: 'Your Name',
                    labelWidth: 128,
                    value: pandora.user.username,
                    width: width
                }),
                Ox.Input({
                    id: 'email',
                    label: 'Your E-Mail Address',
                    labelWidth: 128,
                    value: pandora.user.email,
                    width: width
                }),
                Ox.Input({
                    id: 'subject',
                    label: 'Subject',
                    labelWidth: 128,
                    value: '',
                    width: width
                }),
                Ox.Input({
                    height: 256,
                    id: 'message',
                    placeholder: 'Message',
                    type: 'textarea',
                    value: '',
                    width: width
                }),
                $receiptCheckbox
            ],
            submit: function(data, callback) {
                pandora.api.contact({
                    name: data.name,
                    email: data.email,
                    subject: data.subject,
                    message: data.message,
                    receipt: data.receipt
                }, function(result) {
                    callback && callback(result);
                });
            },
            width: 240
        })
        .bindEvent({
            change: function(event) {
            }
        })
        .appendTo(that),

    $sendButton = Ox.Button({
            title: 'Send Message',
            width: 128
        })
        .css({position: 'absolute', left: width - 112 + 'px', top: '352px'})
        .bindEvent({
            click: function() {
                $form.submit();
            }
        })
        .appendTo(that);

    $text = $('<div>')
        .css({float: 'left', width: width + 'px'})
        .html(
            'Alternatively, you can contact us via <a href="mailto:'
            + pandora.site.site.email.contact + '">'
            + pandora.site.site.email.contact + '</a>'
        );
 
    $('<div>')
        .css({marginTop: '8px'})
        .append($text)
        .append(
        )
        .appendTo(that);

    function getWidth() {
        return Math.min((
            pandora.$ui.siteDialog
            ? parseInt(pandora.$ui.siteDialog.css('width'))
            : Math.round(window.innerWidth * 0.75)
        ) - 304, 512);
    }

    that.resize = function() {
        var width = getWidth();
        $form.options('items').forEach(function($input, i) {
            i < 4 && $input.options({width: width});
        });
        $receiptCheckbox.options({width: width - 136})
        $sendButton.css({left: width - 112 + 'px'})
        $text.css({width: width + 'px'});
    }

    return that;

};
