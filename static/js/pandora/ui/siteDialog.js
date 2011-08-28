pandora.ui.siteDialog = function(section) {

    var tabs = [
        {id: 'about', title: 'About'},
        {id: 'news', title: 'News'},
        {id: 'tour', title: 'Take a Tour'},
        {id: 'faq', title: 'Frequently Asked Questions'},
        {id: 'tos', title: 'Terms of Service'},
        {id: 'contact', title: 'Contact'},
        {id: 'software', title: 'Software'}
    ];
    Ox.getObjectById(tabs, section).selected = true;
    var $tabPanel = Ox.TabPanel({
            content: function(id) {
                return Ox.SplitPanel({
                    elements: [
                        {
                            element: Ox.Element()
                                .css({padding: '16px'})
                                .append(
                                    $('<img>')
                                        .attr({src: '/static/png/' + (
                                            id == 'software' ? 'pandora' : 'logo'
                                        ) + '256.png'})
                                        .css({width: '256px'})
                                ),
                            size: 272
                        },
                        {
                            element: Ox.Element()
                                .css({padding: '16px', overflowY: 'auto'})
                                .html(Ox.repeat(Ox.getObjectById(tabs, id).title + ' ', 200))
                        }
                    ],
                    orientation: 'horizontal'
                });
            },
            tabs: tabs
        })
        .bindEvent({
            change: function(data) {
                $dialog.options({
                    title: Ox.getObjectById(tabs, data.selected).title
                });
            }
        });
    var $dialog = Ox.Dialog({
        buttons: [
            Ox.Button({
                id: 'close',
                title: 'Close'
            }).bindEvent({
                click: function() {
                    $dialog.close();
                }
            })
        ],
        //closeButton: true,
        content: $tabPanel,
        height: Math.round((window.innerHeight - 24) * 0.75),
        //maximizeButton: true,
        minHeight: 256,
        minWidth: 640,
        title: 'About',
        width: Math.round(window.innerWidth * 0.75),
    });

    return $dialog;
  
};