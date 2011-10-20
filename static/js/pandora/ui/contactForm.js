// vim: et:ts=4:sw=4:sts=4:ft=javascript
pandora.ui.contactForm = function() {
    var that = Ox.Element(),
        $form = Ox.Form({
            items: [
                Ox.Input({
                        id: 'email',
                        label: 'E-Mail',
                        labelWidth: 60,
                        value: pandora.user.email,
                        width: 240
                }),
                Ox.Input({
                        id: 'subject',
                        label: 'Subject',
                        labelWidth: 60,
                        value: '',
                        width: 240
                }),
                Ox.Input({
                    height: 120,
                    id: 'message',
                    placeholder: 'Message',
                    type: 'textarea',
                    value: '',
                    width: 240
                })
                .css({height: '240px'})
            ],
            submit: function(data, callback) {
                pandora.api.contact({
                    email: data.email,
                    subject: data.subject,
                    message: data.message
                }, function(result) {
                    callback && callback(result);
                });
            },
            width: 240
        })
        .css({margin: '8px'})
        .bindEvent({
            change: function(event) {
            }
        })
        .appendTo(that);

    Ox.Button({
        title: 'Send'
    })
    .bindEvent({
        click: function() {
            $form.submit();
        }
    }).appendTo(that);
    return that;
};
