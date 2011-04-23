/***
    Pandora
***/

// fixme: never set ui.videoPosition to 0 ... set to null a.k.a. delete
// fixme: sort=-director doesn't work
// fixme: don't reload full right panel on sortSelect
// fixme: clear items cache after login/logout
// fixme: rename config to site (site/user is better than config/user)

Ox.load('UI', {
    hideScreen: false,
    showScreen: true,
    theme: 'modern'
}, function() {

    window.pandora = new Ox.App({url: '/api/'}).bindEvent({

        load: function(event, data) {

            Ox.print('Ox.App load', data);

            $.extend(app, {
        		$ui: {
        			body: $('body'),
        			document: $(document),
        			window: $(window)
        			    .resize(resizeWindow)
        			    .unload(unloadWindow)
        		},
                config: data.config,
                ui: {
        		    findKeys: $.map(data.config.itemKeys, function(key, i) {
        		        return key.find ? key : null;
        		    }),
        			infoRatio: 16 / 9,
        			sectionElement: 'buttons',
        		    sectionFolders: {
        		        site: $.merge([
                            {id: 'site', title: 'Site', items: $.merge([
                                {id: 'home', title: 'Home'}
                            ], $.merge(data.config.sitePages, [
                                {id: 'software', title: 'Software'},
                                {id: 'help', title: 'Help'}
                            ]))},
                            {id: 'user', title: 'User', items: [
                                {id: 'preferences', title: 'Preferences'},
                                {id: 'archives', title: 'Archives'}
                            ]}
                        ], data.user.level == 'admin' ? [
                            {id: 'admin', title: 'Admin', items: [
                                {id: 'statistics', title: 'Statistics'},
                                {id: 'users', title: 'Users'}
                            ]}
                        ] : []),
        		        items: [
                            {id: 'personal', title: 'Personal Lists'},
                            {id: 'favorite', title: 'Favorite Lists', showBrowser: false},
                            {id: 'featured', title: 'Featured Lists', showBrowser: false}
        		        ],
        		    },
        	        selectedMovies: [],
        		    sortKeys: $.map(data.config.itemKeys, function(key, i) {
        		        return key.columnWidth ? key : null;
        		    })
        		},
        		user: data.user.level == 'guest' ? $.extend({}, data.config.user) : data.user
            });

            if (data.user.level == 'guest' && $.browser.mozilla) {
                app.user.ui.theme = 'classic'
            }

    	    URL.parse();
    	    window.onpopstate = function() {
    	        URL.update();
    	    };

            Ox.Theme(app.user.ui.theme);
    		app.$ui.appPanel = ui.appPanel().display();	    

        	Ox.Request.requests() && app.$ui.loadingIcon.start();
        	app.$ui.body.ajaxStart(app.$ui.loadingIcon.start);
        	app.$ui.body.ajaxStop(app.$ui.loadingIcon.stop);

            app.ui.sectionButtonsWidth = app.$ui.sectionButtons.width() + 8;

            Ox.UI.hideLoadingScreen();

            window.pandora.app = app;

        }

    });

	var app = {
		requests: {}
	};

	var ui = {
	    accountDialog: function(action) {
	        var that = new Ox.Dialog($.extend({
                    height: 256,
                    id: 'accountDialog',
                    minHeight: 256,
                    minWidth: 384,
                    width: 384
    	        }, ui.accountDialogOptions(action)))
    	        .bindEvent({
    	            resize: function(event, data) {
                        var width = data.width - 32;
                        app.$ui.accountForm.items.forEach(function(item) {
                            item.options({width: width});
                        });
                    }
    	        });
	        return that;
	    },
	    accountDialogOptions: function(action, value) {
	        //Ox.print('ACTION', action)
            app.$ui.accountForm && app.$ui.accountForm.removeElement();
	        var buttons = {
	                login: ['register', 'reset'],
	                register: ['login'],
	                reset: ['login'],
	                resetAndLogin: []
                },
                buttonTitle = {
                    login: 'Login',
                    register: 'Register',
                    reset: 'Reset Password',
                    resetAndLogin: 'Reset Password and Login'
                },
                dialogText = {
                    login: 'To login to your account, please enter your username and password.',
                    register: 'To create a new account, please choose a username and password, and enter your e-mail address.',
                    reset: 'To reset your password, please enter either your username or your e-mail address.',
                    resetAndLogin: 'To login to your account, please choose a new password, and enter the code that we have just e-mailed to you.'
                },
                dialogTitle = {
                    login: 'Login',
                    register: 'Register',
                    reset: 'Reset Password',
                    resetAndLogin: 'Reset Password'
                };
            function button(type) {
                if (type == 'cancel') {
    	            return new Ox.Button({
                        id: 'cancel' + Ox.toTitleCase(action),
                        title: 'Cancel'
                    }).bindEvent('click', function() {
                        app.$ui.accountDialog.close();
                    });
    	        } else if (type == 'submit') {
    	            return new Ox.Button({
                        disabled: true,
                        id: 'submit' + Ox.toTitleCase(action),
                        title: buttonTitle[action]
                    }).bindEvent('click', function() {
                        app.$ui.accountForm.submit();
                    });
    	        } else {
    	            return new Ox.Button({
    	                id: type,
    	                title: buttonTitle[type] + '...'
    	            }).bindEvent('click', function() {
    	                //Ox.print('CLICK EVENT', type)
                        app.$ui.accountDialog.options(ui.accountDialogOptions(type));
                    });
    	        }
            }
            return {
                buttons: [
    	            $.map(buttons[action], function(type) {
                        return button(type);
                    }),
                    [button('cancel'), button('submit')]
                ],
                content: new Ox.Element('div')
                    .append(
                        new Ox.Element('div')
                            .addClass('OxText')
                            .html(dialogText[action] + '<br/><br/>')
                    )
                    .append(
                        app.$ui.accountForm = ui.accountForm(action, value)
                    ),
                keys: {
    	            enter: 'submit' + Ox.toTitleCase(action),
    	            escape: 'cancel' + Ox.toTitleCase(action)
    	        },
                title: dialogTitle[action]
            };
	    },
	    accountForm: function(action, value) {
	        if (app.$ui.accountForm) {
	            app.$ui.accountForm.items.forEach(function(item) {
	                if (item.options('id') == 'usernameOrEmail') {
	                    //Ox.print('REMOVING')
	                    //Ox.Event.unbind('usernameOrEmailSelect')
	                    //Ox.Event.unbind('usernameOrEmailSelectMenu')
	                    //Ox.Event.unbind('usernameOrEmailInput')
	                }
	                //Ox.print('REMOVING ITEM', item.options('id'));
	                item.removeElement();
	            });
	        }
	        var items = {
	                'login': ['username', 'password'],
	                'register': ['newUsername', 'password', 'email'],
	                'reset': ['usernameOrEmail'],
	                'resetAndLogin': ['oldUsername', 'newPassword', 'code']
	            },
	            $items = $.map(items[action], function(v) {
                    return item(v, value);
                }),
	            that = new Ox.Form({
                    id: 'accountForm' + Ox.toTitleCase(action),
                    items: $items,
                    submit: function(data, callback) {
                        if (action == 'login') {
                            pandora.api.signin(data, function(result) {
                                if (!result.data.errors) {
                                    app.$ui.accountDialog.close();
                                    login(result.data);
                                } else {
                                    callback([{id: 'password', message: 'Incorrect password'}]);
                                }
                            });
                        } else if (action == 'register') {
                            pandora.api.signup(data, function(result) {
                                if (!result.data.errors) {
                                    app.$ui.accountDialog.close();
                                    login(result.data);
                                    ui.accountWelcomeDialog().open();
                                } else {
                                    callback([{id: 'password', message: result.data.errors.toString()}]); // fixme
                                }
                            });
                        } else if (action == 'reset') {
                            var usernameOrEmail = data.usernameOrEmail,
                                key = usernameOrEmail[0].id;
                            data = {};
                            data[key] = usernameOrEmail[1];
                            pandora.api.requestToken(data, function(result) {
                                if (!result.data.errors) {
                                    app.$ui.accountDialog.options(ui.accountDialogOptions('resetAndLogin', result.data.username));
                                } else {
                                    callback([{id: 'usernameOrEmail', message: 'Unknown ' + (key == 'username' ? 'username' : 'e-mail address')}])
                                }
                            });
                        } else if (action == 'resetAndLogin') {
                            pandora.api.resetPassword(data, function(result) {
                                if (!result.data.errors) {
                                    app.$ui.accountDialog.close();
                                    login(result.data);
                                } else {
                                    callback([{id: 'code', message: 'Incorrect code'}]);
                                }
                            })
                        }
                    }
                }).bindEvent({
                    submit: function(event, data) {
                
                    },
                    validate: function(event, data) {
                        //Ox.print('FORM VALIDATE', data)
                        app.$ui.accountDialog[
                            (data.valid ? 'enable' : 'disable') + 'Button'
                        ]('submit' + Ox.toTitleCase(action));
                    }
                });
            that.items = $items;
            function item(type, value) {
                if (type == 'code') {
                    return new Ox.Input({
                        autovalidate: autovalidateCode,
                        id: 'code',
                        label: 'Code',
                        labelWidth: 120,
                        validate: function(value, callback) {
                            callback({
                                message: 'Missing code',
                                valid: !!value.length
                            });
                        },
                        width: 352
                    });
                } else if (type == 'email') {
                    return new Ox.Input({
                        autovalidate: autovalidateEmail,
                        id: 'email',
                        label: 'E-Mail Address',
                        labelWidth: 120,
                        type: 'email',
                        validate: validateUser('email'),
                        width: 352
                    });
                } else if (type == 'newPassword') {
                    return new Ox.Input({
                        autovalidate: /.+/,
                        id: 'password',
                        label: 'New Password',
                        labelWidth: 120,
                        type: 'password',
                        validate: function(value, callback) {
                            callback({
                                message: 'Missing password',
                                valid: value.length > 0
                            });
                        },
                        width: 352
                    });
                } else if (type == 'newUsername') {
                    return new Ox.Input({
                        autovalidate: autovalidateUsername,
                        id: 'username',
                        label: 'Username',
                        labelWidth: 120,
                        validate: validateUser('username'),
                        width: 352
                    });
                } else if (type == 'oldUsername') {
                    return new Ox.Input({
                        disabled: true,
                        id: 'username',
                        label: 'Username',
                        labelWidth: 120,
                        value: value,
                        width: 352
                    });
                } else if (type == 'password') {
                    return new Ox.Input({
        	            autovalidate: /.+/,
                        id: 'password',
                        label: 'Password',
                        labelWidth: 120,
                        type: 'password',
                        validate: function(value, callback) {
                            callback({
                                message: 'Missing Password',
                                valid: value.length > 0
                            });
                        },
                        width: 352
                    });
                } else if (type == 'username') {
                    return new Ox.Input({
                        autovalidate: autovalidateUsername,
                        id: 'username',
                        label: 'Username',
                        labelWidth: 120,
                        validate: validateUser('username', true),
                        width: 352
                    });    
                } else if (type == 'usernameOrEmail') {
                    return new Ox.FormElementGroup({
                        id: 'usernameOrEmail',
                        elements: [
                            app.$ui.usernameOrEmailSelect = new Ox.Select({
                                    id: 'usernameOrEmailSelect',
                                    items: [
                                        {id: 'username', title: 'Username'},
                                        {id: 'email', title: 'E-Mail Address'},
                                    ],
                                    overlap: 'right',
                                    width: 120
                                })
                                .bindEvent({
                                    change: function(event, data) {
                                        var selected = data.selected[0].id;
                                        app.$ui.usernameOrEmailInput.options({
                                            autovalidate: selected == 'username' ? autovalidateUsername : autovalidateEmail,
                                            validate: validateUser(selected, true),
                                            value: ''
                                        }).focus();
                                    }
                                }),
                            app.$ui.usernameOrEmailInput = new Ox.Input({
                                autovalidate: autovalidateUsername,
                                id: 'usernameOrEmailInput',
                                validate: validateUser('username', true),
                                width: 232
                            })
                        ],
                        separators: [
                            {title: '', width: 0}
                        ]
                    });
                }
            }
            return that;	        
	    },
        accountLogoutDialog: function() {
            var that = new Ox.Dialog({
                    buttons: [
                        new Ox.Button({
                            id: 'cancel',
                            title: 'Cancel'
                        }).bindEvent('click', function() {
                            that.close();
                            app.$ui.mainMenu.getItem('loginlogout').toggleTitle();
                        }),
                        new Ox.Button({
                            id: 'logout',
                            title: 'Logout'
                        }).bindEvent('click', function() {
                            that.close();
                            pandora.api.signout({}, function(result) {
                                logout(result.data);
                            });
                        })
                    ],
                    content: new Ox.Element('div').html('Are you sure you want to logout?'),
                    height: 160,
                    keys: {enter: 'logout', escape: 'cancel'},
                    title: 'Logout',
                    width: 300
                });
            return that;
        },
        accountWelcomeDialog: function() {
            var that = new Ox.Dialog({
                    buttons: [
                        [
                            new Ox.Button({
                                id: 'preferences',
                                title: 'Preferences...'
                            }).bindEvent('click', function() {
                                that.close();
                            })
                        ],
                        [
                            new Ox.Button({
                                id: 'close',
                                title: 'Close'
                            }).bindEvent('click', function() {
                                that.close();
                            })
                        ]
                    ],
                    content: new Ox.Element('div').html('Welcome, ' + app.user.username + '!<br/><br/>Your account has been created.'),
                    height: 160,
                    keys: {enter: 'close', escape: 'close'},
                    title: 'Welcome to ' + app.config.site.name,
                    width: 300
                });
            return that;
        },
		annotations: function() {
			var that = new Ox.Element({
			        id: 'annotations'
			    })
			    .bindEvent({
			        resize: function(event, data) {
			            app.user.ui.annotationsSize = data;
			        },
			        resizeend: function(event, data) {
			            UI.set({annotationsSize: data});
			        },
			        toggle: function(event, data) {
			            UI.set({showAnnotations: !data.collapsed});
			        }
			    }),
				$bins = [];
		    $.each(app.config.layers, function(i, layer) {
		        var $bin = new Ox.CollapsePanel({
		            id: layer.id,
		            size: 16,
		            title: layer.title
		        });
		        $bins.push($bin);
		        $bin.$content.append(
		            $('<div>').css({ height: '20px' }).append(
		                $('<div>').css({ float: 'left', width: '16px', height: '16px', margin: '1px'}).append(
		                    $('<img>').attr({ src: Ox.UI.getImagePath('iconFind.svg') }).css({ width: '16px', height: '16px', border: 0, background: 'rgb(64, 64, 64)', WebkitBorderRadius: '2px' })
		                )
		            ).append(
		                $('<div>').css({ float: 'left', width: '122px', height: '14px', margin: '2px' }).html('Foo')
		            ).append(
		                $('<div>').css({ float: 'left', width: '40px', height: '14px', margin: '2px', textAlign: 'right' }).html('23')
		            )
		        );
		    });
		    $.each($bins, function(i, bin) {
		        that.append(bin);
		    });
			return that;
		},
		appPanel: function() {
			var that = new Ox.SplitPanel({
			        elements: [
			            {
			                element: app.$ui.mainMenu = ui.mainMenu(),
			                size: 20
			            },
			            {
			                element: app.$ui.mainPanel = ui.mainPanel()
						}
					],
			        orientation: 'vertical'
			    });
			that.display = function() {
			    // fixme: move animation into Ox.App
				app.$ui.body.css({opacity: 0});
			    that.appendTo(app.$ui.body);
			    app.$ui.body.animate({opacity: 1}, 1000);
				return that;
			}
			that.reload = function() {
			    app.$ui.appPanel.removeElement();
			    app.$ui.appPanel = ui.appPanel().appendTo(app.$ui.body);
			    return that;
			}
			return that;
		},
        backButton: function() {
            var that = Ox.Button({
                title: 'Back to ' + app.config.itemName.plural,
                width: 96
            }).css({
                float: 'left',
                margin: '4px'
            })
            .bindEvent({
                click: function(event, data) {
                    URL.set(Query.toString());
                }
            });
            return that;
        },
		browser: function() {
		    var that;
			if (!app.user.ui.item) {
				app.$ui.groups = ui.groups();
				that = new Ox.SplitPanel({
	                elements: [
	                    {
	                        element: app.$ui.groups[0],
	                        size: app.ui.groups[0].size
	                    },
	                    {
	                        element: app.$ui.groupsInnerPanel = ui.groupsInnerPanel()
	                    },
	                    {
	                        element: app.$ui.groups[4],
	                        size: app.ui.groups[4].size
	                    },
	                ],
	                id: 'browser',
	                orientation: 'horizontal'
	            })
	            .bindEvent({
	                resize: function(event, data) {
    	                app.user.ui.groupsSize = data;
    	                $.each(app.$ui.groups, function(i, list) {
    	                    list.size();
    	                });
    	            },
    	            resizeend: function(event, data){
    	                UI.set({groupsSize: data});
    	            },
    	            toggle: function(event, data) {
    	                UI.set({showGroups: !data.collapsed});
    	                data.collapsed && app.$ui.list.gainFocus();
    	            }
	            });
			} else {
		        var that = new Ox.IconList({
		            centered: true,
		            id: 'list',
		            item: function(data, sort, size) {
		                var ratio = data.poster.width / data.poster.height;
		                size = size || 64;
		                return {
		                    height: ratio <= 1 ? size : size / ratio,
		                    id: data['id'],
		                    info: data[['title', 'director'].indexOf(sort[0].key) > -1 ? 'year' : sort[0].key],
		                    title: data.title + (data.director ? ' (' + data.director + ')' : ''),
		                    url: data.poster.url.replace(/jpg/, size + '.jpg'),
		                    width: ratio >= 1 ? size : size * ratio
		                };
		            },
		            items: function(data, callback) {
		                //Ox.print('data, Query.toObject', data, Query.toObject())
		                pandora.api.find($.extend(data, {
		                    query: Query.toObject()
		                }), callback);
		            },
		            keys: ['director', 'id', 'poster', 'title', 'year'],
		            max: 1,
		            min: 1,
		            orientation: 'horizontal',
		            selected: [app.user.ui.item],
		            size: 64,
		            sort: app.user.ui.lists[app.user.ui.list].sort,
		            unique: 'id'
		        })
		        .bindEvent({
		            open: function(event, data) {
		                that.scrollToSelection();
		            },
		            select: function(event, data) {
		                URL.set(data.ids[0]);
		            },
		            toggle: function(event, data) {
		                UI.set({showMovies: !data.collapsed});
		                if (data.collapsed) {
		                    if (app.user.ui.itemView == 'timeline') {
		                        app.$ui.editor.gainFocus();
		                    }
		                }
		            }
		        });
			}
			that.update = function() {
			    app.$ui.contentPanel.replaceElement(0, app.$ui.browser = ui.browser());
			}
			return that;
		},
		contentPanel: function() {
			var that = new Ox.SplitPanel({
		        elements: app.user.ui.item == '' ? [
		            {
		                collapsed: !app.user.ui.showGroups,
		                collapsible: true,
		                element: app.$ui.browser = ui.browser(),
		                resizable: true,
		                resize: [96, 112, 128, 144, 160, 176, 192, 208, 224, 240, 256],
		                size: app.user.ui.groupsSize
		            },
		            {
		                element: app.$ui.list = ui.list(app.user.ui.lists[app.user.ui.list].listView)
		            }
		        ] : [
    	            {
    	                collapsed: !app.user.ui.showMovies,
    	                collapsible: true,
    	                element: app.$ui.browser = ui.browser(),
    	                size: 112 + Ox.UI.SCROLLBAR_SIZE
    	            },
    	            {
    	                element: app.$ui.item = ui.item(app.user.ui.item, app.user.ui.itemView)
    	            }
		        ],
		        orientation: 'vertical'
		    })
			return that;
		},
        filter: function() {
            var that = new Ox.Filter({
                findKeys: $.map(app.config.itemKeys, function(key) {
                    return {
                        autocomplete: key.autocomplete,
                        autocompleteSortKey: key.autocompleteSortKey,
                        format: key.format,
                        id: key.id,
                        title: key.title,
                        type: key.type == 'layer' ? Ox.getObjectById(
                            app.config.layers, key.id
                        ).type : key.type
                    };
                }),
                sortKeys: app.ui.sortKeys,
                viewKeys: app.config.listViews
            });
            return that;
        },
        filterDialog: function() {
            var that = new Ox.Dialog({
                buttons: [
                    new Ox.Button({
                            id: 'debug',
                            title: 'Debug',
                        })
                        .bindEvent({
                            click: function() {
                                alert(JSON.stringify(app.$ui.filter.options('query')));
                            }
                        }),
                    new Ox.Button({
                            id: 'cancel',
                            title: 'Cancel'
                        })
                        .bindEvent({
                            click: function() {
                                app.$ui.filterDialog.close();
                            }
                        }),
                    new Ox.Button({
                            id: 'save',
                            title: 'Save'
                        })
                        .bindEvent({
                            click: function() {
                                app.$ui.filterDialog.close();
                            }
                        })
                ],
                content: app.$ui.filter = new ui.filter(),
                height: 264,
                keys: {enter: 'save', escape: 'cancel'},
                title: 'Advanced Find',
                width: 616 + Ox.UI.SCROLLBAR_SIZE
            });
            return that;
        },
		findElement: function() {
			var findKey = '',
			    findValue = '';
			if (app.user.ui.findQuery.conditions.length == 1) {
			    findKey = app.user.ui.findQuery.conditions[0].key;
			    findValue = app.user.ui.findQuery.conditions[0].value;
			}
			var that = new Ox.FormElementGroup({
                    elements: $.merge(app.user.ui.list ? [
                            app.$ui.findListSelect = new Ox.Select({
                                    items: [
                                        {id: 'all', title: 'Find: All ' + app.config.itemName.plural},
                                        {id: 'list', title: 'Find: This List'}
                                    ],
                                    overlap: 'right',
                                    type: 'image'
                                })
                                .bindEvent({
                                    change: function(event, data) {
                                        var key = data.selected[0].id;
                                        app.$ui.findInput.options({
                                            autocomplete: autocompleteFunction()
                                        }).focus();
                                    }
                                }),
                        ] : [], [
                            app.$ui.findSelect = new Ox.Select({
                                    id: 'select',
                                    items: $.merge($.merge([{
                                        id: 'all',
                                        title: 'Find: All'
                                    }], $.map(app.ui.findKeys, function(key, i) {
                                        return {
                                            id: key.id,
                                            checked: key.id == findKey,
                                            title: 'Find: ' + key.title
                                        };
                                    })), [{}, {
                                        id: 'advanced',
                                        title: 'Find: Advanced'
                                    }]),
                                    overlap: 'right',
                                    width: 112
                                })
                                .bindEvent({
                                    change: function(event, data) {
                                        var key = data.selected[0].id;
                                        if (key == 'advanced') {
                                            app.$ui.filterDialog = ui.filterDialog().open();
                                        } else {
                                            if (!app.user.ui.findQuery.conditions.length) { // fixme: can this case happen at all?
                                                app.user.ui.findQuery.conditions = [{key: key, value: '', operator: ''}];
                                            } else {
                                                app.user.ui.findQuery.conditions[0].key = key;
                                            }
                                            app.$ui.mainMenu.checkItem('findMenu_find_' + key);
                                            app.$ui.findInput.options({
                                                autocomplete: autocompleteFunction()
                                            }).focus();
                                        }
                                    }
                                }),
                            app.$ui.findInput = new Ox.Input({
                                autocomplete: autocompleteFunction(),
                                autocompleteSelect: true,
                                autocompleteSelectHighlight: true,
                                autocompleteSelectSubmit: true,
                                clear: true,
                                id: 'input',
                                value: findValue,
                                width: 192
                            })
                            .bindEvent({
                                submit: function(event, data) {
                                    var key = app.user.ui.findQuery.conditions.length ?
                                            app.user.ui.findQuery.conditions[0].key : '';
                                    if (app.user.ui.list && that.value()[0].id == 'all') {
                                        $.each(app.$ui.folderList, function(k, $list) {
                                            $list.options({selected: []});
                                        });
                                        UI.set({list: ''});
                                        app.user.ui.listQuery = {conditions: [], operator: ''};
                                    }
                                    app.user.ui.findQuery.conditions = [{
                                        key: key == 'all' ? '' : key,
                                        value: data.value,
                                        operator: ''
                                    }];
                                    URL.set(Query.toString());
                                }
                            })
                    ]),
                    id: 'findElement'
                })
                .css({
                    float: 'right',
                    margin: '4px'
                });
            function autocompleteFunction() {
                return app.user.ui.findQuery.conditions.length ? function(value, callback) {
                    var elementValue = that.value(),
                        key = elementValue[app.user.ui.list ? 1 : 0].id,
                        findKey = Ox.getObjectById(app.ui.findKeys, key);
                    Ox.print('!!!!', key, findKey, 'autocomplete' in findKey && findKey.autocomplete)
                    value === '' && Ox.print('Warning: autocomplete function should never be called with empty value');
                    if ('autocomplete' in findKey && findKey.autocomplete) {
                        pandora.api.autocomplete({
                            key: key,
                            query: elementValue[0].id == 'list' ? app.user.ui.listQuery : {conditions: [], operator: ''},
                            range: [0, 20],
                            sort: [{
                                key: 'votes',
                                operator: '-'
                            }],
                            value: value
                        }, function(result) {
                            callback(result.data.items);
                        });
                    } else {
                        callback([]);                            
                    }
                } : null;
            }
			return that;
		},
        flipbook: function(item) {
            var that = new Ox.Flipbook({
                }).bindEvent('click', function(event, data) {
                    UI.set('videoPosition|' + item, data.position);
                    URL.set(item + '/timeline');
                });
                pandora.api.getItem(item, function(result) {
                    var duration = result.data.item.duration,
                        posterFrame = result.data.item.posterFrame || parseInt(duration/2),
                        steps = 24,
                        framePrefix = '/' + item + '/frame/' + that.width() + '/',
                        frames = {};
                    Ox.range(0, duration, duration/steps).forEach(function(position) {
                        position = parseInt(position);
                        frames[position] = framePrefix + position + '.jpg';
                    });
                    that.options({
                        frames: frames,
                        icon: framePrefix + posterFrame + '.jpg',
                        duration: duration
                    });
                });
            return that;
        },
        folderBrowser: function(id) {
            var that = new Ox.SplitPanel({
                elements: [
                    {
                        element: ui.folderBrowserBar(),
                        size: 24
                    },
                    {
                        element: app.$ui.folderList[id] = ui.folderBrowserList(id)
                    }
                ],
                orientation: 'vertical'
            });
            return that;
        },
        folderBrowserBar: function(id) {
            var that = new Ox.Bar({
                    size: 24
                });
            app.$ui.findListInput = new Ox.Input({
                    placeholder: 'Find User',
                    width: 184 - Ox.UI.SCROLLBAR_SIZE
                })
                .css({
                    margin: '4px',
                    align: 'right'
                })
                .appendTo(that);
            return that;
        },
        folderBrowserList: function(id) {
            var columnWidth = (app.user.ui.sidebarSize - Ox.UI.SCROLLBAR_SIZE - 88) / 2,
                i = Ox.getPositionById(app.ui.sectionFolders[app.user.ui.section], id),
                that = new Ox.TextList({
                    columns: [
                        {
                            format: function() {
                                return $('<img>')
                                    .attr({
                                        src: '/static/oxjs/build/png/Ox.UI/icon16.png'
                                    });
                            },
                            id: 'id',
                            operator: '+',
                            title: $('<img>')
                                .attr({
                                    src: '/static/oxjs/build/png/Ox.UI/icon16.png'
                                })
                                .css({
                                    width: '10px',
                                    height: '10px',
                                    padding: '3px 2px 1px 2px',
                                }),
                            unique: true,
                            visible: true,
                            width: 16
                        },
                        {
                            id: 'user',
                            operator: '+',
                            title: 'User',
                            visible: true,
                            width: Math.floor(columnWidth)
                        },
                        {
                            id: 'name',
                            operator: '+',
                            title: 'List',
                            visible: true,
                            width: Math.ceil(columnWidth)
                        },
                        {
                            align: 'right',
                            id: 'items',
                            operator: '-',
                            title: 'Items',
                            visible: true,
                            width: 40
                        },
                        {
                            clickable: function(data) {
                                return data.type == 'smart';
                            },
                            format: function(value) {
                                return $('<img>')
                                    .attr({
                                        src: Ox.UI.getImagePath('symbolFind.svg')
                                    })
                                    .css({
                                        width: '10px',
                                        height: '10px',
                                        padding: '3px 2px 1px 2px', // fixme: strange
                                        opacity: value == 'static' ? 0.1 : 1
                                    });
                            },
                            id: 'type',
                            operator: '+',
                            title: $('<img>')
                                .attr({
                                    src: Ox.UI.getImagePath('symbolFind.svg')
                                })
                                .css({
                                    width: '10px',
                                    height: '10px',
                                    padding: '3px 2px 1px 2px',
                                }),
                            visible: true,
                            width: 16
                        },
                        {
                            clickable: true,
                            format: function(value) {
                                return $('<img>')
                                    .attr({
                                        src: Ox.UI.getImagePath(
                                            'symbol' + (id == 'favorite' ? 'Check' : 'Star') + '.svg'
                                        )
                                    })
                                    .css({
                                        width: '10px',
                                        height: '10px',
                                        padding: '3px 2px 1px 2px',
                                        opacity: id == 'favorite' ? (value ? 1 : 0.1) :
                                        (value == 'featured' ? 1 : 0.1)
                                    });
                            },
                            id: id == 'favorite' ? 'subscribed' : 'status',
                            operator: '+',
                            title: $('<img>')
                                .attr({
                                    src: Ox.UI.getImagePath(
                                        'symbol' + (id == 'favorite' ? 'Check' : 'Star') + '.svg'
                                    )
                                })
                                .css({
                                    width: '10px',
                                    height: '10px',
                                    padding: '3px 2px 1px 2px'
                                }),
                            visible: true,
                            width: 16
                        },
                    ],
                    columnsVisible: true,
                    items: function(data, callback) {
                        var query = id == 'favorite' ? {conditions: [
                            {key: 'user', value: app.user.username, operator: '!'},
                            {key: 'status', value: 'public', operator: '='}
                        ], operator: '&'} : {conditions: [
                            {key: 'status', value: 'public', operator: '='},
                            {key: 'status', value: 'featured', operator: '='}
                        ], operator: '|'};
                        return pandora.api.findLists($.extend(data, {
                            query: query
                        }), callback);
                    },
                    pageLength: 1000,
                    // fixme: select if previously selected
                    // selected: app.user.ui.list ? [app.user.ui.list] : [],
                    sort: [
                        {key: 'name', operator: '+'}
                    ]
                })
                .bindEvent({
                    click: function(event, data) {
                        if (data.key == 'type') {
                            alert('...');
                        } else if (data.key == 'subscribed') {
                            var subscribed = that.value(data.id, 'subscribed');
                            pandora.api[subscribed ? 'unsubscribeFromList' : 'subscribeToList']({
                                id: data.id,
                            }, function(result) {
                                that.value(data.id, 'subscribed', !subscribed);
                            });
                        } else if (data.key == 'status') {
                            pandora.api.editList({
                                id: data.id,
                                status: that.value(data.id, 'status') == 'featured' ? 'public' : 'featured'
                            }, function(result) {
                                Ox.print('result', result)
                                if (result.data.user == app.user.username || result.data.subscribed) {
                                    Ox.Request.clearCache(); // fixme: remove
                                    app.$ui.folderList[
                                        result.data.user == app.user.username ? 'personal' : 'favorite'
                                    ].reloadList();
                                }
                                that.value(data.id, 'status', result.data.status);
                            });
                        }
                    },
                    init: function(event, data) {
                        app.ui.sectionFolders[app.user.ui.section][i].items = data.items;
                        app.$ui.folder[i].$content.css({
        	                height: 40 + data.items * 16 + 'px'
        	            });
        	            app.$ui.folderList[id].css({
        	                height: 16 + data.items * 16 + 'px'
        	            });
        	            resizeFolders();
                    },
                    paste: function(event, data) {
                        app.$ui.list.triggerEvent('paste', data);
                    },
                    select: function(event, data) {
                        // fixme: duplicated
                        if (data.ids.length) {
                            $.each(app.$ui.folderList, function(id_, $list) {
        	                    id != id_ && $list.options('selected', []);
                            });
        	                UI.set({list: data.ids[0]});
        	                URL.set('?find=list:' + data.ids[0]);
                        } else {
                            UI.set({list: ''});
                            URL.set('');
                        }
                    }
                });
            return that;
        },
        folderList: function(id) {
            var i = Ox.getPositionById(app.ui.sectionFolders[app.user.ui.section], id),
                that;
            if (app.user.ui.section == 'site') {
                that = new Ox.TextList({
		            columns: [
    		            {
                            format: function() {
                                return $('<img>')
                                    .attr({
                                        src: '/static/oxjs/build/png/Ox.UI/icon16.png'
                                    })
                            },
                            id: 'id',
                            operator: '+',
                            unique: true,
                            visible: true,
                            width: 16
                        },
                        {
                            id: 'title',
                            operator: '+',
                            visible: true,
                            width: app.user.ui.sidebarSize - 16
                        }
		            ],
		            items: function(data, callback) {
		                var result = {data: {}};
		                if (!data.range) {
		                    result.data.items = Ox.getObjectById(app.ui.sectionFolders.site, id).items.length;
		                } else {
		                    result.data.items = Ox.getObjectById(app.ui.sectionFolders.site, id).items;
		                }
		                callback(result);
		            },
		            max: 1,
		            min: 1,
		            sort: [{key: '', operator: ''}]
                })
                .bindEvent({
                    select: function(event, data) {
                        // fixme: duplicated
                        $.each(app.$ui.folderList, function(id_, $list) {
                            id != id_ && $list.options('selected', []);
                        })
        	            URL.set((id == 'admin' ? 'admin/' : '' ) + data.ids[0]);
    	            },
                });
            } else if (app.user.ui.section == 'items') {
                that = new Ox.TextList({
                    columns: [
                        {
                            format: function() {
                                return $('<img>').attr({
                                    src: '/static/oxjs/build/png/Ox.UI/icon16.png'
                                });
                            },
                            id: 'user',
                            operator: '+',
                            visible: true,
                            width: 16
                        },
                        {
                            format: function(value) {
                                return value.split('/').join(': ');
                            },
                            id: 'id',
                            operator: '+',
                            unique: true,
                            visible: id == 'favorite',
                            width: app.user.ui.sidebarWidth - 88
                        },
                        {
                            editable: function(data) {
                                return data.user == app.user.username;
                            },
                            id: 'name',
                            input: {
                                autovalidate: autovalidateListname
                            },
                            operator: '+',
                            visible: id != 'favorite',
                            width: app.user.ui.sidebarWidth - 88
                        },
                        {
                            align: 'right',
                            id: 'items',
                            operator: '-',
                            visible: true,
                            width: 40
                        },
                        {
                            clickable: function(data) {
                                return data.type == 'smart';
                            },
                            format: function(value) {
                                return $('<img>')
                                    .attr({
                                        src: Ox.UI.getImagePath('symbolFind.svg')
                                    })
                                    .css({
                                        width: '10px',
                                        height: '10px',
                                        padding: '3px 2px 1px 2px',
                                        opacity: value == 'static' ? 0.1 : 1
                                    });
                            },
                            id: 'type',
                            operator: '+',
                            visible: true,
                            width: 16
                        },
                        {
                            clickable: id == 'personal',
                            format: function(value) {
                                //var symbols = {private: 'Publish', public: 'Publish', featured: 'Star'};
                                return $('<img>')
                                    .attr({
                                        src: Ox.UI.getImagePath(
                                            'symbol' + (value == 'featured' ? 'Star' : 'Publish') + '.svg'
                                        )
                                    })
                                    .css({
                                        width: '10px',
                                        height: '10px',
                                        padding: '3px 2px 1px 2px',
                                        opacity: value == 'private' ? 0.1 : 1
                                    })
                            },
                            id: 'status',
                            operator: '+',
                            visible: true,
                            width: 16
                        }
                    ],
                    items: function(data, callback) {
                        var query;
                        if (id == 'personal') {
                            query = {conditions: [
                                {key: 'user', value: app.user.username, operator: '='},
                                {key: 'status', value: 'featured', operator: '!'}
                            ], operator: '&'};
                        } else if (id == 'favorite') {
                            query = {conditions: [
                                {key: 'subscribed', value: true, operator: '='},
                                {key: 'status', value: 'featured', operator: '!'},
                            ], operator: '&'};
                        } else if (id == 'featured') {
                            query = {conditions: [{key: 'status', value: 'featured', operator: '='}], operator: '&'};
                        }
                        return pandora.api.findLists($.extend(data, {
                            query: query
                        }), callback);
                    },
                    max: 1,
                    min: 0,
                    pageLength: 1000,
                    sort: [
                        {key: 'position', operator: '+'}
                    ],
                    sortable: id == 'personal' || id == 'favorite' || app.user.level == 'admin'
                })
                .css({
                    left: 0,
                    top: 0,
                    width: app.user.ui.sidebarWidth + 'px',
                })
                .bind({
                    dragenter: function(e) {
                        //Ox.print('DRAGENTER', e)
                    }
                })
                .bindEvent({
                    click: function(event, data) {
                        var $list = app.$ui.folderList[id];
                        if (data.key == 'type') {
                            app.$ui.filterDialog = ui.filterDialog().open();
                        } else if (data.key == 'status') {
                            pandora.api.editList({
                                id: data.id,
                                status: $list.value(data.id, data.key) == 'private' ? 'public' : 'private'
                            }, function(result) {
                                $list.value(result.data.id, 'status', result.data.status);
                            });
                        }
                    },
                    'delete': function(event, data) {
                        var $list = app.$ui.folderList[id];
                        app.user.ui.listQuery.conditions = [];
                        URL.set(Query.toString());
                        $list.options({selected: []});
                        if (id == 'personal') {
                            pandora.api.removeList({
                                id: data.ids[0]
                            }, function(result) {
                                // fixme: is this the best way to delete a ui preference?
                                delete app.user.ui.lists[data.ids[0]];
                                UI.set({lists: app.user.ui.lists});
        	                    Ox.Request.clearCache(); // fixme: remove
                                $list.reloadList();
                            });
                        } else if (id == 'favorite') {
                            pandora.api.unsubscribeFromList({
                                id: data.ids[0]
                            }, function(result) {
        	                    Ox.Request.clearCache(); // fixme: remove
                                $list.reloadList();
                            });
                        } else if (id == 'featured' && app.user.level == 'admin') {
                            pandora.api.editList({
                                id: data.ids[0],
                                status: 'public'
                            }, function(result) {
                                // fixme: duplicated
                                if (result.data.user == app.user.username || result.data.subscribed) {
                                    Ox.Request.clearCache(); // fixme: remove
                                    app.$ui.folderList[
                                        result.data.user == app.user.username ? 'personal' : 'favorite'
                                    ].reloadList();
                                }
                                $list.reloadList();
                            });
                        }
                    },
                    init: function(event, data) {
                        app.ui.sectionFolders[app.user.ui.section][i].items = data.items;
                        app.$ui.folder[i].$content.css({
        	                height: data.items * 16 + 'px'
        	            });
        	            app.$ui.folderList[id].css({
        	                height: data.items * 16 + 'px'
        	            });
        	            resizeFolders();
                    },
    	            move: function(event, data) {
    	                /*
    	                data.ids.forEach(function(id, pos) {
    	                    app.user.ui.lists[id].position = pos;
    	                });
    	                */
                        pandora.api.sortLists({
                            section: id,
                            ids: data.ids
                        });
    	            },
    	            paste: function(event, data) {
                        app.$ui.list.triggerEvent('paste', data);
                    },
                    select: function(event, data) {
                        if (data.ids.length) {
                            $.each(app.$ui.folderList, function(id_, $list) {
                                id != id_ && $list.options('selected', []);
                            })
        	                URL.set('?find=list:' + data.ids[0]);
                        } else {
                            URL.set('?find=');
                        }
    	            },
    	            submit: function(event, data) {
    	                data_ = {id: data.id};
    	                data_[data.key] = data.value;
                        pandora.api.editList(data_, function(result) {
                            if (result.data.id != data.id) {
                                app.$ui.folderList[id].value(data.id, 'name', result.data.name);
    	                        app.$ui.folderList[id].value(data.id, 'id', result.data.id);
    	                        URL.set('?find=list:' + result.data.id);
                            }
                        });
                    }
                });
            }
            return that;
        },
		folders: function() {
			var that = new Ox.Element()
			    .css({overflowX: 'hidden', overflowY: 'auto'})
			    .bindEvent({
			        resize: function(event, data) {
                        resizeFolders();
    	            }
			    });
			var counter = 0;
			//var $sections = [];
			app.$ui.folder = [];
			app.$ui.folderBrowser = {};
			app.$ui.folderList = {};
			if (app.user.ui.section == 'site') {
			    $.each(app.ui.sectionFolders.site, function(i, folder) {
			        var height = (Ox.getObjectById(app.ui.sectionFolders.site, folder.id).items.length * 16);
			        app.$ui.folder[i] = new Ox.CollapsePanel({
        		            id: folder.id,
        		            collapsed: !app.user.ui.showFolder.site[folder.id],
        		            size: 16,
        		            title: folder.title
        		        })
        		        .bindEvent({
        		            toggle: function(event, data) {
        		                
        		            }
        		        });
        		    //alert(JSON.stringify(Ox.getObjectById(app.ui.sectionFolders.site, folder.id)))
        		    app.$ui.folder[i].$content.css({
    		            height: height + 'px'
        		    })
        		        //.appendTo(that);
        		    app.$ui.folderList[folder.id] = ui.folderList(folder.id)
        		        .css({
        		            height: height + 'px'
        		        })
        		        .appendTo(app.$ui.folder[i].$content);
    		        app.$ui.folder.forEach(function($folder) {
        		        that.append($folder);
        		    });
			    });
			    //resizeFolders();
			} else if (app.user.ui.section == 'items') {
    		    $.each(app.ui.sectionFolders.items, function(i, folder) {
    		        var extras;
    		        if (folder.id == 'personal' && app.user.level != 'guest') {
    		            extras = [new Ox.Select({
                            items: [
        		                { id: 'new', title: 'New List...' },
        		                { id: 'newfromselection', title: 'New List from Current Selection...', disabled: true },
        		                { id: 'newsmart', title: 'New Smart List...' },
        		                { id: 'newfromresults', title: 'New Smart List from Current Results...', disabled: true },
        		                {},
        		                { id: 'addselection', title: 'Add Selection to List...' }
        		            ],
                            max: 0,
                            min: 0,
                            selectable: false,
                            type: 'image'
                        })
                        .bindEvent({
                            click: function(event, data) {
    		                    var $list = app.$ui.folderList[folder.id],
    		                        id;
    		                    if (data.id == 'new' || data.id == 'newsmart') {
        		                    pandora.api.addList({
        		                        name: 'Untitled',
        		                        status: 'private',
        		                        type: data.id == 'new' ? 'static' : 'smart'
        		                    }, function(result) {
        		                        id = result.data.id;
        		                        UI.set(['lists', id].join('|'), app.config.user.ui.lists['']); // fixme: necessary?
        		                        URL.set('?find=list:' + id)
                	                    Ox.Request.clearCache(); // fixme: remove
        		                        $list.reloadList().bindEventOnce({
        		                            load: function(event, data) {
                    		                    $list.gainFocus()
                    		                        .options({selected: [id]})
                    		                        .editCell(id, 'name');
                    		                }
        		                        });
        		                    });
        		                }
                            }
                        })];
    		        } else if (folder.id == 'favorite' && app.user.level != 'guest') {
    		            extras = [new Ox.Button({
    		                selectable: true,
    		                style: 'symbol',
    		                title: 'Edit',
    		                tooltip: 'Manage Favorite Lists',
    		                type: 'image'
    		            })
    		            .bindEvent({
    		                change: function(event, data) {
    		                    Ox.Request.clearCache(); // fixme: remove
    		                    app.ui.sectionFolders.items[i].showBrowser = !app.ui.sectionFolders.items[i].showBrowser;
    		                    if (app.ui.sectionFolders.items[i].showBrowser) {
        		                    app.$ui.folderList.favorite.replaceWith(
        		                        app.$ui.folderBrowser.favorite = ui.folderBrowser('favorite')
        		                    );
    		                    } else {
    		                        app.$ui.folderBrowser.favorite.replaceWith(
    		                            app.$ui.folderList.favorite = ui.folderList('favorite')
    		                        );
    		                    }
    		                    resizeFolders();
    		                }
    		            })];
    		        } else if (folder.id == 'featured' && app.user.level == 'admin') {
    		            extras = [new Ox.Button({
    		                selectable: true,
    		                style: 'symbol',
    		                title: 'Edit',
    		                tooltip: 'Manage Featured Lists',
    		                type: 'image'
    		            })
    		            .bindEvent({
    		                change: function(event, data) {
    		                    Ox.Request.clearCache(); // fixme: remove
    		                    app.ui.sectionFolders.items[i].showBrowser = !app.ui.sectionFolders.items[i].showBrowser;
    		                    if (app.ui.sectionFolders.items[i].showBrowser) {
        		                    app.$ui.folderList.featured.replaceWith(
        		                        app.$ui.folderBrowser.featured = ui.folderBrowser('featured'));
    		                    } else {
    		                        app.$ui.folderBrowser.featured.replaceWith(
    		                            app.$ui.folderList.featured = ui.folderList('featured')
    		                        );
    		                    }
    		                    resizeFolders();
    		                }
    		            })];
    		        }
    		        app.$ui.folder[i] = new Ox.CollapsePanel({
        		            id: folder.id,
        		            collapsed: !app.user.ui.showFolder.items[folder.id],
        		            extras: extras,
        		            size: 16,
        		            title: folder.title
        		        })
        		        .bindEvent({
        		            // fixme: duplicated
        		            click: function(event, data) {
        		                var $list = app.$ui.folderList[i],
        		                    hasFocus, id;
        		                if (data.id == 'new' || data.id == 'newsmart') {
        		                    pandora.api.addList({
        		                        name: 'Untitled',
        		                        status: 'private',
        		                        type: data.id == 'new' ? 'static' : 'smart'
        		                    }, function(result) {
        		                        id = result.data.id;
        		                        URL.set('?find=list:' + id)
                	                    Ox.Request.clearCache(); // fixme: remove
        		                        $list.reloadList().bindEventOnce({
        		                            load: function(event, data) {
        		                                $list.gainFocus()
                    		                        .options({selected: [id]})
                    		                        .editCell(id, 'name');
        		                            }
        		                        });
        		                    });
        		                } else if (data.id == 'browse') {
        		                    alert('??')
        		                    /*
        		                    app.$ui.sectionList[1].replaceWith(app.$ui.publicLists = ui.publicLists());
        		                    app.ui.showAllPublicLists = true;
        		                    */
        		                }
        		            },
        		            toggle: function(event, data) {
        		                data.collapsed && app.$ui.folderList[folder.id].loseFocus();
        		                UI.set('showFolder|items|' + folder.id, !data.collapsed);
        		                resizeFolders();
        		            }
        		        });
    		        //$sections.push(app.$ui.section[i]);
    	            app.$ui.folderList[folder.id] = ui.folderList(folder.id)
                        .bindEventOnce({
                            init: function(event, data) {
                                Ox.print('init', i, counter)
            	                if (++counter == 3) {
                                    app.$ui.folder.forEach(function($folder) {
                        		        that.append($folder);
                        		    });
                        		    resizeFolders();
                        		    selectList(); //fixme: doesn't work
                                }
                            }
                        })
    	                .appendTo(app.$ui.folder[i].$content);
    		    });
			}
			that.toggle = function() {
				
			}
			return that;
		},
        group: function(id, query) {
            //Ox.print('group', id, query);
            /*
            query && query.conditions.length && alert($.map(query.conditions, function(v) {
                return v.value;
            }));
            */
            //alert(id + ' ' + JSON.stringify(Query.toObject(id)))
            var i = app.user.ui.groups.indexOf(id),
                panelWidth = app.$ui.document.width() - (app.user.ui.showSidebar * app.user.ui.sidebarSize) - 1,
                title = Ox.getObjectById(app.config.groups, id).title,
                width = getGroupWidth(i, panelWidth),
                that = new Ox.TextList({
                    columns: [
                        {
                            align: 'left',
                            id: 'name',
                            operator: id == 'year' ? '-' : '+',
                            title: title,
                            unique: true,
                            visible: true,
                            width: width.column
                        },
                        {
                            align: 'right',
                            id: 'items',
                            operator: '-',
                            title: '#',
                            visible: true,
                            width: 40
                        }
                    ],
                    columnsVisible: true,
                    id: 'group_' + id,
                    items: function(data, callback) {
                        //Ox.print('sending request', data)
                        delete data.keys;
                        //alert(id + " Query.toObject " + JSON.stringify(Query.toObject(id)) + ' ' + JSON.stringify(data))
                        return pandora.api.find($.extend(data, {
                            group: id,
                            query: Query.toObject(id)
                        }), callback);
                    },
                    scrollbarVisible: true,
                    selected: query ? $.map(query.conditions, function(v) {
                        return v.value;
                    }) : [],
                    sort: [
                        {
                            key: id == 'year' ? 'name' : 'items',
                            operator: '-'
                        }
                    ]
                })
                .bindEvent({
                    paste: function(event, data) {
                        app.$ui.list.triggerEvent('paste', data);
                    },
                    select: function(event, data) {
                        var group = app.ui.groups[i],
                            query;
                        app.ui.groups[i].query.conditions = $.map(data.ids, function(v) {
                            return {
                                key: id,
                                value: v,
                                operator: '='
                            };
                        });
                        reloadGroups(i);
                    }
                });
            new Ox.Select({
                    items: $.map(app.config.groups, function(v) {
                        return {
                            checked: v.id == id,
                            id: v.id,
                            title: v.title
                        }
                    }),
                    max: 1,
                    min: 1,
                    type: 'image'
                })
                .bindEvent('change', function(event, data) {
                    var id_ = data.selected[0].id,
                        i_ = app.user.ui.groups.indexOf(id_);
                    if (i_ == -1) {
                        // new group was not part of old group set
                        if (app.ui.groups[i].query.conditions.length) {
                            // if group with selection gets replaced, reload
                            app.ui.groups[i].query.conditions = [];
                            reloadGroups(i);
                        }
                        app.ui.groups[i] = getGroupObject(id_);
                        app.user.ui.groups[i] = id_;
                        UI.set({groups: app.user.ui.groups});
                        replaceGroup(i, id_);
                    } else {
                        // swap two existing groups
                        var group = $.extend({}, app.ui.groups[i]);
                        app.ui.groups[i] = app.ui.groups[i_];
                        app.ui.groups[i_] = group;
                        app.user.ui.groups[i] = id_;
                        app.user.ui.groups[i_] = id;
                        UI.set({groups: app.user.ui.groups});
                        replaceGroup(i, id_, app.ui.groups[i].query);
                        replaceGroup(i_, id, app.ui.groups[i_].query);
                    }
                    function replaceGroup(i, id, query) {
                        // if query is passed, selected items will be derived from it
                        var isOuter = i % 4 == 0;
                        app.$ui[isOuter ? 'browser' : 'groupsInnerPanel'].replaceElement(
                            isOuter ? i / 2 : i - 1,
                            app.$ui.groups[i] = ui.group(id, query)
                        );
                    }
                })
                .appendTo(that.$bar.$element);
            if (!query) {
                // if query is set, group object has already been taken care of
                app.ui.groups[i] = getGroupObject(id);
            }
            function getGroupObject(id) {
                var i = app.user.ui.groups.indexOf(id),
                    title = Ox.getObjectById(app.config.groups, id).title,
                    width = getGroupWidth(i, panelWidth);
                return {
                    id: id,
                    element: that,
                    query: {
                        conditions: [],
    	                operator: '|'
                    },
                    size: width.list,
                    title: title
                };
            }
            return that;
        },
		groups: function() {
			var $groups = [];
			app.ui.groups = [];
            app.user.ui.groups.forEach(function(id, i) {
                $groups[i] = ui.group(id);
            });
		    return $groups;
		},
		groupsInnerPanel: function() {
			var that = new Ox.SplitPanel({
                elements: [
                    {
                        element: app.$ui.groups[1],
                        size: app.ui.groups[1].size
                    },
                    {
                        element: app.$ui.groups[2],
                    },
                    {
                        element: app.$ui.groups[3],
                        size: app.ui.groups[3].size
                    }
                ],
                orientation: 'horizontal'
            });
			return that;
		},
		info: function() {
			var that = new Ox.Element()
		        .append(
		            app.$ui.infoStill = new Ox.Element('div')
		                .css({
		                    position: 'absolute',
		                    left: 0,
		                    top: 0,
		                    height: '96px'
		                })
		        )
		        .append(
		            app.$ui.infoTimeline = new Ox.Element('img')
		                .css({
		                    position: 'absolute',
		                    left: 0,
		                    bottom: 0,
		                    height: '16px',
		                })
		        )
		        .bindEvent({
		            toggle: function(event, data) {
		                UI.set({showInfo: !data.collapsed});
		                resizeFolders();
		            }
		        });
            if(app.user.ui.item) {
                pandora.api.getItem(app.user.ui.item, function(result) {
                    app.ui.infoRatio = result.data.item.stream.aspectRatio;
                    var width = that.width() || 256,
                        height = width / app.ui.infoRatio + 16;
                    app.$ui.infoStill.removeElement();
                    app.$ui.infoStill = ui.flipbook(app.user.ui.item)
                                          .appendTo(that.$element);
                    app.$ui.infoStill.css({
                        'height': (height-16) + 'px'
                    });
                    that.css({
                        height: height  + 'px'
                    });
                    resizeFolders();
                    !app.user.ui.showInfo && app.$ui.leftPanel.css({bottom: -height});
                    app.$ui.leftPanel.size(2, height );
                });
                app.$ui.infoTimeline.attr('src', '/'+app.user.ui.item+'/timeline.16.png')
            }
		    return that;
		},
        item: function() {
            var that;
            if (app.user.ui.itemView == 'info' || app.user.ui.itemView == 'files') {
                that = new Ox.Element('div');
            } else if (app.user.ui.itemView == 'player') {
                that = new Ox.Element('div');
            } else if (app.user.ui.itemView == 'timeline') {
                that = new Ox.Element('div');
            }
            pandora.api.getItem(app.user.ui.item, function(result) {
                if (app.user.ui.itemView == 'info') {
			        //Ox.print('result.data.item', result.data.item)
                    if (app.user.level == 'admin') {
                        var $form,
                            $edit = new Ox.Element()
                            .append($form = new Ox.FormElementGroup({
                                elements: Ox.map(app.config.itemKeys, function(key) {
                                    return new Ox.Input({
                                        id: key.id,
                                        label: key.title,
                                        labelWidth: 100,
                                        value: result.data.item[key.id],
                                        type: 'text',
                                        width: 500 
                                    });
                                }),
                                separators: [
                                    {title: '', width: 0}
                                ]
                            }))
                            .append(new Ox.Button({
                                title: 'Save',
                                type: 'text'
                            }).bindEvent({
                                click: function(event, data) {
                                    var values = $form.value();
                                    var changed = {};
                                    Ox.map(app.config.itemKeys, function(key, i) {
                                        if(values[i] && values[i] != ''+result.data.item[key.id]) {
                                            if(Ox.isArray(key.type) && key.type[0] == 'string')
                                                changed[key.id] = values[i].split(', ');
                                            else
                                                changed[key.id] = values[i];
                                        }
                                    });
                                    if(changed) {
                                        pandora.api.editItem(Ox.extend(changed, {id: app.user.ui.item}), function(result) {
                                            //fixme just reload parts that need reloading
                                            window.location.reload();
                                        });    
                                    }
                                }
                            }));
                        app.$ui.contentPanel.replaceElement(1, app.$ui.item = $edit);
                    } else {
                        $.get('/static/html/itemInfo.html', {}, function(template) {
                            //Ox.print(template);
                            app.$ui.contentPanel.replaceElement(1,
                                app.$ui.item = new Ox.Element('div')
                                .append($.tmpl(template, result.data.item))
                            );
                        });
                    }

                } else if (app.user.ui.itemView == 'player') {
                    var video = result.data.item.stream,
                        subtitles = result.data.item.layers.subtitles,
                        format = $.support.video.supportedFormat(video.formats);
                        video.height = video.profiles[0]
		            video.width = parseInt(video.height * video.aspectRatio / 2) * 2;
		            video.url = video.baseUrl + '/' + video.height + 'p.' + format;
                    app.$ui.contentPanel.replaceElement(1, app.$ui.player = new Ox.VideoPanelPlayer({
                        annotationsSize: app.user.ui.annotationsSize,
                        duration: video.duration,
                        height: app.$ui.contentPanel.size(1),
                        position: app.user.ui.videoPosition[app.user.ui.item] || 0,
                        showAnnotations: app.user.ui.showAnnotations,
                        showControls: app.user.ui.showControls,
                        subtitles: subtitles,
		                videoHeight: video.height,
		                videoId: app.user.ui.item,
		                videoWidth: video.width,
		                videoSize: app.user.ui.videoScreen,
		                videoURL: video.url,
		                width: app.$ui.document.width() - app.$ui.mainPanel.size(0) - 1
                    }).bindEvent({
                        change: function(event, data) {
                            // showAnnotations, showControls, videoScreen
                            UI.set('videoSize' in data ? {
                                videoScreen: data.videoSize
                            } : data);
                        },
                        enterfullscreen: enterFullscreen,
                        exitfullscreen: exitFullscreen,
                        resize: function(event, data) {
                            app.$ui.player.options({
                                height: data
                            });
                        }
                    }));
                } else if (app.user.ui.itemView == 'timeline') {
                    var layers = [],
                        video = result.data.item.stream,
		                cuts = result.data.item.cuts || {},
                        format = $.support.video.supportedFormat(video.formats);
		                subtitles = result.data.item.layers.subtitles;
                    video.height = video.profiles[0];
		            video.width = parseInt(video.height * video.aspectRatio / 2) * 2;
		            video.url = video.baseUrl + '/' + video.height + 'p.' + format;
                    $.each(app.config.layers, function(i, layer) {
                        layers[i] = $.extend({}, layer, {items: result.data.item.layers[layer.id]});
                    });
                    app.$ui.contentPanel.replaceElement(1, app.$ui.editor = new Ox.VideoEditor({
                        annotationsSize: app.user.ui.annotationsSize,
		                cuts: cuts,
		                duration: video.duration,
		                find: '',
		                frameURL: function(position) {
		                    return '/' + app.user.ui.item + '/frame/' + video.width.toString() + '/' + position.toString() + '.jpg'
		                },
						height: app.$ui.contentPanel.size(1),
		                id: 'editor',
		                largeTimeline: true,
		                layers: layers,
		                matches: [],
		                points: [0, 0],
                        position: app.user.ui.videoPosition[app.user.ui.item] || 0,
		                posterFrame: parseInt(video.duration / 2),
                        showAnnotations: app.user.ui.showAnnotations,
		                subtitles: subtitles,
		                videoHeight: video.height,
		                videoId: app.user.ui.item,
		                videoWidth: video.width,
		                videoSize: app.user.ui.videoSize,
		                videoURL: video.url,
		                width: app.$ui.document.width() - app.$ui.mainPanel.size(0) - 1
		            }).bindEvent({
                        resize: function(event, data) {
                            app.$ui.editor.options({
                                height: data
                            });
                        },
						togglesize: function(event, data) {
						    UI.set({videoSize: data.size});
						},
                        addAnnotation: function(event, data) {
                            Ox.print('addAnnotation', data);
                            data.item = app.user.ui.item;
                            data.value = 'Click to edit';
                            pandora.api.addAnnotation(data, function(result) {
                                app.$ui.editor.addAnnotation(data.layer, result.data);
                            });
                        },
                        removeAnnotations: function(event, data) {
                            pandora.api.removeAnnotations(data, function(result) {
                                //fixme: check for errors
                                app.$ui.editor.removeAnnotations(data.layer, data.ids);
                            });
                        },
                        updateAnnotation: function(event, data) {
                            //fixme: check that edit was successfull
                            Ox.print('updateAnnotation', data);
                            pandora.api.editAnnotation(data);
                        }
					}));
		            that.bindEvent('resize', function(event, data) {
    				    //Ox.print('resize item', data)
    				    app.$ui.editor.options({
    				        height: data
    				    });
    				});
					/*
					app.$ui.rightPanel.bindEvent('resize', function(event, data) {
	                    Ox.print('... rightPanel resize', data, app.$ui.timelinePanel.size(1))
	                    app.$ui.editor.options({
	                        width: data - app.$ui.timelinePanel.size(1) - 1
	                    });
	                });
	                */    		            
                } else if (app.user.ui.itemView == 'files') {
                    app.$ui.contentPanel.replaceElement(1,
                        app.$ui.item = new Ox.FilesView({
                            id: result.data.item.id
                        })
                    );
                }
                var director = result.data.item.director?' ('+result.data.item.director.join(', ')+')':'';
                app.$ui.total.html(result.data.item.title + director);
	        });
            return that;
        },
		leftPanel: function() {
			var that = new Ox.SplitPanel({
                    elements: [
						{
							element: app.$ui.sectionbar = ui.sectionbar('buttons'),
							size: 24
						},
                        {
                            element: app.$ui.folders = ui.folders()
                        },
                        {
                            collapsed: !app.user.ui.showInfo,
                            collapsible: true,
                            element: app.$ui.info = ui.info(),
                            size: app.user.ui.sidebarSize / app.ui.infoRatio + 16
                        }
                    ],
                    id: 'leftPanel',
                    orientation: 'vertical'
                })
                .bindEvent({
                    resize: function(event, data) {
                        var infoSize = Math.round(data / app.ui.infoRatio) + 16;
                        app.user.ui.sidebarSize = data;
                        if (data < app.ui.sectionButtonsWidth && app.$ui.sectionButtons) {
                            app.$ui.sectionButtons.removeElement();
                            delete app.$ui.sectionButtons;
                            app.$ui.sectionbar.append(app.$ui.sectionSelect = ui.sectionSelect());
                        } else if (data >= app.ui.sectionButtonsWidth && app.$ui.sectionSelect) {
                            app.$ui.sectionSelect.removeElement();
                            delete app.$ui.sectionSelect;
                            app.$ui.sectionbar.append(app.$ui.sectionButtons = ui.sectionButtons());
                        }
                        !app.user.ui.showInfo && app.$ui.leftPanel.css({bottom: -infoSize});
                        app.$ui.leftPanel.size(2, infoSize);
                        resizeFolders();
                    },
                    resizeend: function(event, data) {
                        UI.set({sidebarSize: data});
                    },
                    toggle: function(event, data) {
                        UI.set({showSidebar: !data.collapsed});
                        if (data.collapsed) {
                            $.each(app.$ui.folderList, function(k, $list) {
                                $list.loseFocus();
                            });
                        }
                    }
                });
			return that;
		},
		list: function(view) { // fixme: remove view argument
			var that, $map;
		    //Ox.print('constructList', view);
		    if (view == 'list') {
		        /*
		        keys = Ox.unique($.merge(
		            $.map(app.user.ui.lists[app.user.ui.list].columns, function(id) {
		                return Ox.getObjectById(app.config.sortKeys, id);
		            }),
		            app.config.sortKeys
		        ));
		        Ox.print('$$$$', keys)
		        */
		        that = new Ox.TextList({
		            columns: $.map(app.ui.sortKeys, function(key, i) {
		                var position = app.user.ui.lists[app.user.ui.list].columns.indexOf(key.id);
		                return {
		                    align: ['string', 'text'].indexOf(
		                        Ox.isArray(key.type) ? key.type[0]: key.type
		                    ) > -1 ? 'left' : 'right',
		                    defaultWidth: key.columnWidth,
		                    format: key.format,
		                    id: key.id,
		                    operator: getSortOperator(key.id),
		                    position: position,
		                    removable: !key.columnRequired,
		                    title: key.title,
		                    type: key.type,
		                    unique: key.id == 'id',
		                    visible: position > -1,
		                    width: app.user.ui.lists[app.user.ui.list].columnWidth[key.id] || key.columnWidth
		                };
		            }),
		            columnsMovable: true,
		            columnsRemovable: true,
		            columnsResizable: true,
		            columnsVisible: true,
		            id: 'list',
		            items: function(data, callback) {
		                //Ox.print('data, Query.toObject', data, Query.toObject())
		                pandora.api.find($.extend(data, {
		                    query: Query.toObject()
		                }), callback);
		            },
		            scrollbarVisible: true,
		            sort: app.user.ui.lists[app.user.ui.list].sort
		        })
		        .bindEvent({
		            columnchange: function(event, data) {
		                var columnWidth = {}
		                UI.set(['lists', app.user.ui.list, 'columns'].join('|'), data.ids);
		                /*
		                data.ids.forEach(function(id) {
		                    columnWidth[id] = 
		                        app.user.ui.lists[app.user.ui.list].columnWidth[id] ||
		                        Ox.getObjectById(app.ui.sortKeys, id).width
		                });
		                UI.set(['lists', app.user.ui.list, 'columnWidth'].join('|'), columnWidth);
		                */
		            },
		            columnresize: function(event, data) {
		                UI.set(['lists', app.user.ui.list, 'columnWidth', data.id].join('|'), data.width);
		            },
		            resize: function(event, data) { // this is the resize event of the split panel
		                that.size();
		            },
		            sort: function(event, data) {
		                UI.set(['lists', app.user.ui.list, 'sort'].join('|'), [data]);
		            }
		        });
		    } else if (view == 'icons') {
		        that = new Ox.IconList({
		            id: 'list',
		            item: function(data, sort, size) {
		                var ratio = data.poster.width / data.poster.height;
		                size = size || 128;
		                return {
		                    height: ratio <= 1 ? size : size / ratio,
		                    id: data['id'],
		                    info: data[['title', 'director'].indexOf(sort[0].key) > -1 ? 'year' : sort[0].key],
		                    title: data.title + (data.director.length ? ' (' + data.director.join(', ') + ')' : ''),
		                    url: data.poster.url.replace(/jpg/, size + '.jpg'),
		                    width: ratio >= 1 ? size : size * ratio
		                };
		            },
		            items: function(data, callback) {
		                //Ox.print('data, Query.toObject', data, Query.toObject())
		                pandora.api.find($.extend(data, {
		                    query: Query.toObject()
		                }), callback);
		            },
		            keys: ['director', 'id', 'poster', 'title', 'year'],
		            size: 128,
		            sort: app.user.ui.lists[app.user.ui.list].sort,
		            unique: 'id'
		        })
			} else if (view == 'map') {
				that = new Ox.SplitPanel({
					elements: [
						{
							element: new Ox.SplitPanel({
								elements: [
									{
										element: new Ox.Toolbar({
		                                    	orientation: 'horizontal',
		                                    	size: 24
		                                	})
											.append(
		                                        app.$ui.findMapInput = new Ox.Input({
		                                            clear: true,
		                                            id: 'findMapInput',
		                                            placeholder: 'Find on Map',
		                                            width: 192
		                                        })
		                                        .css({
		                                            float: 'right',
		                                            margin: '4px'
		                                        })
												.bindEvent({
													submit: function(event, data) {
														app.$ui.map.find(data.value, function(data) {
															app.$ui.mapStatusbar.html(data.geoname + ' ' + JSON.stringify(data.points))
														});
													}
												})
		                                    ),
										size: 24
									},
									{
										element: app.$ui.map = new Ox.Map({
												places: [
													{
														geoname: 'Beirut, Lebanon',
														name: 'Beirut',
														points: {
															'center': [33.8886284, 35.4954794],
															'northeast': [33.8978909, 35.5114868],
															'southwest': [33.8793659, 35.479472]
														}
													},
													{
														geoname: 'Berlin, Germany',
														name: 'Berlin',
														points: {
															'center': [52.506701, 13.4246065],
															'northeast': [52.675323, 13.760909],
															'southwest': [52.338079, 13.088304]
														}
													},
													{
														geoname: 'Mumbai, Maharashtra, India',
														name: 'Bombay',
														points: {
															'center': [19.07871865, 72.8778187],
															'northeast': [19.2695223, 72.9806562],
															'southwest': [18.887915, 72.7749812]
														}
													}
												]
											})
											.bindEvent({								
												select: function(event, data) {
													app.$ui.mapStatusbar.html(data.geoname + ' ' + JSON.stringify(data.points))
												}
											}),
										id: 'map',
										size: 'auto'
									},
									{
										element: app.$ui.mapStatusbar = new Ox.Toolbar({
			                                    orientation: 'horizontal',
			                                    size: 16
			                                })
											.css({
												fontSize: '9px',
												padding: '2px 4px 0 0',
												textAlign: 'right'
											}),
										size: 16
									}
								],
								orientation: 'vertical'
							}),
						},
						{
							element: new Ox.Element(),
							id: 'place',
							size: 128 + 16 + 12
						}
					],
					orientation: 'horizontal'
				})
				.bindEvent('resize', function() {
				    app.$ui.map.resize();
				});
		    } else {
		        $list = new Ox.Element('<div>')
		            .css({
		                width: '100px',
		                height: '100px',
		                background: 'red'
		            });
		    }

		    ['list', 'icons'].indexOf(view) > -1 && that.bind({
		        dragstart: function(e) {
		            app.$ui.folderList.forEach(function($list, i) {
		                $list.addClass('OxDrop');
		            });
		        },
		        dragend: function(e) {
		            app.$ui.folderList.forEach(function($list, i) {
		                $list.removeClass('OxDrop');
		            });
		        },
		    }).bindEvent({
		        closepreview: function(event, data) {
		            app.$ui.previewDialog.close();
		            delete app.$ui.previewDialog;
		        },
		        copy: function(event, data) {
		            Ox.Clipboard.copy({
		                items: data.ids,
		                text: $.map(data.ids, function(id) {
		                    return app.$ui.list.value(id, 'title');
		                }).join('\n')
		            });
		        },
		        'delete': function(event, data) {
		            getListData().editable && pandora.api.removeListItems({
	                    list: app.user.ui.list,
	                    items: data.ids
	                }, reloadList);
		        },
		        init: function(event, data) {
		            app.$ui.total.html(ui.status('total', data));
		            data = [];
		            $.each(app.config.totals, function(i, v) {
		                data[v.id] = 0;
		            });
		            app.$ui.selected.html(ui.status('selected', data));
		        },
		        open: function(event, data) {
		            var id = data.ids[0],
		                title = that.value(id, 'title');
		            URL.set(title, id);
		        },
		        openpreview: function(event, data) {
		            app.requests.preview && pandora.api.cancel(app.requests.preview);
		            app.requests.preview = pandora.api.find({
		                keys: ['director', 'id', 'poster', 'title'],
		                query: {
		                    conditions: $.map(data.ids, function(id, i) {
		                        return {
		                            key: 'id',
		                            value: id,
		                            operator: '='
		                        }
		                    }),
		                    operator: '|'
		                }
		            }, function(result) {
		                var documentHeight = app.$ui.document.height(),
		                    item = result.data.items[0],
		                    title = item.title + (item.director ? ' (' + item.director + ')' : ''),
		                    dialogHeight = documentHeight - 100,
		                    dialogWidth;
		                app.ui.previewRatio = item.poster.width / item.poster.height,
		                dialogWidth = parseInt((dialogHeight - 48) * app.ui.previewRatio);
		                if ('previewDialog' in app.$ui) {
		                    app.$ui.previewDialog.options({
		                        title: title
		                    });
		                    app.$ui.previewImage.animate({
		                        opacity: 0
		                    }, 100, function() {
		                        app.$ui.previewDialog.size(dialogWidth, dialogHeight, function() {
		                            app.$ui.previewImage
		                                .attr({
		                                    src: item.poster.url
		                                })
		                                .one('load', function() {
		                                    app.$ui.previewImage
		                                        .css({
		                                            width: dialogWidth + 'px',
		                                            height: (dialogHeight - 48 - 2) + 'px', // fixme: why -2 ?
		                                            opacity: 0
		                                        })
		                                        .animate({
		                                            opacity: 1
		                                        }, 100);
		                                });
		                        });
		                    });
		                    //Ox.print(app.$ui.document.height(), dialogWidth, 'x', dialogHeight, dialogWidth / (dialogHeight - 48), item.poster.width, 'x', item.poster.height, item.poster.width / item.poster.height)
		                } else {
		                    app.$ui.previewImage = $('<img>')
		                        .attr({
		                            src: item.poster.url
		                        })
		                        .css({
		                            position: 'absolute',
		                            width: dialogWidth + 'px',
		                            height: (dialogHeight - 48 - 2) + 'px', // fixme: why -2 ?
		                            left: 0,
		                            top: 0,
		                            right: 0,
		                            bottom: 0,
		                            margin: 'auto',
		                        });
		                    app.$ui.previewDialog = new Ox.Dialog({
		                            buttons: [
		                                new Ox.Button({
		                                    title: 'Close',
		                                }).bindEvent({
		                                    click: function() {
		                                        app.$ui.previewDialog.close();
		                                        delete app.$ui.previewDialog;
		                                        app.$ui.list.closePreview();
		                                    }
		                                })
		                            ],
		                            content: app.$ui.previewImage,
		                            height: dialogHeight,
		                            id: 'previewDialog',
		                            minHeight: app.ui.previewRatio >= 1 ? 128 / app.ui.previewRatio + 48 : 176,
		                            minWidth: app.ui.previewRatio >= 1 ? 128 : 176 * app.ui.previewRatio,
		                            padding: 0,
		                            title: title,
		                            width: dialogWidth
		                        })
		                        .bindEvent('resize', function(event, data) {
		                            var dialogRatio = data.width / (data.height - 48),
		                                height, width;
		                            if (dialogRatio < app.ui.previewRatio) {
		                                width = data.width;
		                                height = width / app.ui.previewRatio;
		                            } else {
		                                height = (data.height - 48 - 2);
		                                width = height * app.ui.previewRatio;
		                            }
		                            app.$ui.previewImage.css({
		                                width: width + 'px',
		                                height: height + 'px', // fixme: why -2 ?
		                            })
		                        })
		                        .open();
		                    //app.$ui.previewImage = $image;
		                    //Ox.print(app.$document.height(), dialogWidth, 'x', dialogHeight, dialogWidth / (dialogHeight - 48), item.poster.width, 'x', item.poster.height, item.poster.width / item.poster.height)
		                }
		            });
		        },
                paste: function(event, data) {
                    data.items && getListData().editable && pandora.api.addListItems({
                        list: app.user.ui.list,
                        items: data.items
                    }, reloadList);
                },
		        select: function(event, data) {
		            var $still, $timeline;
		            app.ui.selectedMovies = data.ids;
		            if (data.ids.length) {
		                app.$ui.mainMenu.enableItem('copy');
		                app.$ui.mainMenu.enableItem('openmovie');
		            } else {
		                app.$ui.mainMenu.disableItem('copy');
		                app.$ui.mainMenu.disableItem('openmovie');            
		            }
		            if (data.ids.length == 1) {
                        pandora.api.getItem(data.ids[0], function(result) {
                            app.ui.infoRatio = result.data.item.stream.aspectRatio;
                            var height = app.$ui.info.width() / app.ui.infoRatio + 16;
                            app.$ui.infoStill.removeElement();
                            app.$ui.infoStill = ui.flipbook(data.ids[0])
                                                  .appendTo(app.$ui.info.$element);
                            app.$ui.infoStill.css({
                               'height': (height - 16) + 'px'
                            });
                            !app.user.ui.showInfo && app.$ui.leftPanel.css({bottom: -height});
                            app.$ui.leftPanel.size(2, height);
                            app.$ui.info.animate({
                                height: height + 'px'
                            }, 250, function() {
                                resizeFolders();
                            });
                        });
                        app.$ui.infoTimeline.attr('src', '/'+data.ids[0]+'/timeline.16.png')
		            }
		            pandora.api.find({
		                query: {
		                    conditions: $.map(data.ids, function(id, i) {
		                        return {
		                            key: 'id',
		                            value: id,
		                            operator: '='
		                        }
		                    }),
		                    operator: '|'
		                }
		            }, function(result) {
		                app.$ui.selected.html(ui.status('selected', result.data));
		            });
		        },
		        sort: function(event, data) {
		            /* some magic has already set user.ui.sort
		            Ox.print(':', user.ui.sort[0])
		            if (data.key != user.ui.sort[0].key) {
		                app.$ui.mainMenu.checkItem('sort_sortmovies_' + data.key);
		            }
		            if (data.operator != user.ui.sort[0].operator) {
		                app.$ui.mainMenu.checkItem('sort_ordermovies_' + data.operator === '' ? 'ascending' : 'descending');
		            }
		            user.ui.sort[0] = data;
		            */
		            app.$ui.mainMenu.checkItem('sortMenu_sortmovies_' + data.key);
		            app.$ui.mainMenu.checkItem('sortMenu_ordermovies_' + (data.operator === '' ? 'ascending' : 'descending'));
		        }
		    });
            that.display = function() { // fixme: used?
                app.$ui.rightPanel.replaceElement(1, app.$ui.contentPanel = ui.contentPanel());
            };
		    return that;
		},
		mainMenu: function() {
			var isGuest = app.user.level == 'guest',
			    that = new Ox.MainMenu({
		            extras: [
		                $('<div>').html('beta').css({marginRight: '8px', color: 'rgb(128, 128, 128)'}),
		                app.$ui.loadingIcon = new Ox.LoadingIcon({
		                    size: 'medium'
		                })
		            ],
		            id: 'mainMenu',
		            menus: [
		                { id: app.config.site.id + 'Menu', title: app.config.site.name, items: [
	                        { id: 'home', title: 'Home' },
		                    {},
		                    { id: 'about', title: 'About ' + app.config.site.name },
		                    { id: 'news', title: app.config.site.name + ' News' },
		                    { id: 'tour', title: 'Take a Tour' },
		                    { id: 'faq', title: 'Frequently Asked Questions' },
		                    { id: 'terms', title: 'Terms of Service' },
		                    {},
		                    { id: 'software', title: 'Software', items: [
		                        { id: 'about', title: 'About' },
		                        { id: 'download', title: 'Download' },
		                        { id: 'report', title: 'Report a Bug' }
		                    ] },
		                    {},
		                    { id: 'contact', title: 'Contact ' + app.config.site.name }
		                ] },
		                { id: 'userMenu', title: 'User', items: [
		                    { id: 'username', title: 'User: ' + (isGuest ? 'not logged in' : app.user.username), disabled: true },
		                    {},
		                    { id: 'preferences', title: 'Preferences...', disabled: isGuest, keyboard: 'control ,' },
		                    {},
		                    { id: 'register', title: 'Register...', disabled: !isGuest },
		                    { id: 'loginlogout', title: isGuest ? 'Login...' : 'Logout...' }
		                ] },
		                { id: 'listMenu', title: 'List', items: [
		                    { id: 'history', title: 'History', items: [
		                        { id: 'allmovies', title: 'All ' + app.config.itemName.plural }
		                    ] },
		                    { id: 'lists', title: 'View List', items: [
		                        { id: 'favorites', title: 'Favorites' }
		                    ] },
		                    { id: 'features', title: 'View Feature', items: [
		                        { id: 'situationistfilm', title: 'Situationist Film' },
		                        { id: 'timelines', title: 'Timelines' }
		                    ] },
		                    {},
		                    { id: 'newlist', title: 'New List...', keyboard: 'control n' },
		                    { id: 'newlistfromselection', title: 'New List from Selection...', disabled: true, keyboard: 'shift control n' },
		                    { id: 'newsmartlist', title: 'New Smart List...', keyboard: 'alt control n' },
		                    { id: 'newsmartlistfromresults', title: 'New Smart List from Results...', keyboard: 'shift alt control n' },
		                    {},
		                    { id: 'addmovietolist', title: ['Add Selected ' + app.config.itemName.singular + ' to List...', 'Add Selected ' + app.config.itemName.plural + ' to List...'], disabled: true },
		                    {},
		                    { id: 'setposterframe', title: 'Set Poster Frame', disabled: true }
		                ]},
		                { id: 'editMenu', title: 'Edit', items: [
		                    { id: 'undo', title: 'Undo', disabled: true, keyboard: 'control z' },
		                    { id: 'redo', title: 'Redo', disabled: true, keyboard: 'shift control z' },
		                    {},
		                    { id: 'cut', title: 'Cut', disabled: true, keyboard: 'control x' },
		                    { id: 'copy', title: 'Copy', disabled: true, keyboard: 'control c' },
		                    { id: 'paste', title: 'Paste', disabled: true, keyboard: 'control v' },
		                    { id: 'delete', title: 'Delete', disabled: true, keyboard: 'delete' },
		                    {},
		                    { id: 'selectall', title: 'Select All', disabled: true, keyboard: 'control a' },
		                    { id: 'selectnone', title: 'Select None', disabled: true, keyboard: 'shift control a' },
		                    { id: 'invertselection', title: 'Invert Selection', disabled: true, keyboard: 'alt control a' }
		                ] },
		                { id: 'viewMenu', title: 'View', items: [
		                    { id: 'movies', title: 'View ' + app.config.itemName.plural, items: [
		                        { group: 'viewmovies', min: 0, max: 1, items: $.map(app.config.listViews, function(view, i) {
		                            return $.extend({
		                                checked: app.user.ui.lists[app.user.ui.list].listView == view.id,
		                            }, view);
		                        }) },
		                    ]},
		                    { id: 'icons', title: 'Icons', items: [
		                        { id: 'poster', title: 'Poster' },
		                        { id: 'still', title: 'Still' },
		                        { id: 'timeline', title: 'Timeline' }
		                    ] },
		                    { id: 'info', title: 'Info', items: [
		                        { id: 'poster', title: 'Poster' },
		                        { id: 'video', title: 'Video' }
		                    ] },
		                    {},
		                    { id: 'openmovie', title: ['Open ' + app.config.itemName.singular, 'Open ' + app.config.itemName.plural], disabled: true, items: [
		                        { group: 'movieview', min: 0, max: 1, items: $.map(app.config.itemViews, function(view, i) {
		                            return $.extend({
		                                checked: app.user.ui.itemView == view.id,
		                            }, view);
		                        }) },
		                    ]},
		                    {},
		                    { id: 'lists', title: 'Hide Lists', keyboard: 'shift l' },
		                    { id: 'info', title: 'Hide Info', keyboard: 'shift i' },
		                    { id: 'groups', title: 'Hide Groups', keyboard: 'shift g' },
		                    { id: 'movies', title: 'Hide ' + app.config.itemName.plural, disabled: true, keyboard: 'shift m' }
		                ]},
		                { id: 'sortMenu', title: 'Sort', items: [
		                    { id: 'sortmovies', title: 'Sort ' + app.config.itemName.plural + ' by', items: [
		                        { group: 'sortmovies', min: 1, max: 1, items: $.map(app.ui.sortKeys, function(key, i) {
		                            return $.extend({
		                                checked: app.user.ui.lists[app.user.ui.list].sort[0].key == key.id,
		                            }, key);
		                        }) }
		                    ] },
		                    { id: 'ordermovies', title: 'Order ' + app.config.itemName.plural, items: [
		                        { group: 'ordermovies', min: 1, max: 1, items: [
		                            { id: 'ascending', title: 'Ascending', checked: app.user.ui.lists[app.user.ui.list].sort[0].operator === '' },
		                            { id: 'descending', title: 'Descending', checked: app.user.ui.lists[app.user.ui.list].sort[0].operator == '-' }
		                        ]}
		                    ] },
		                    { id: 'advancedsort', title: 'Advanced Sort...', keyboard: 'shift control s' },
		                    {},
		                    { id: 'groupsstuff', title: 'Groups Stuff' }
		                ] },
		                { id: 'findMenu', title: 'Find', items: [
		                    { id: 'find', title: 'Find', items: [
		                        { group: 'find', min: 1, max: 1, items: $.map(app.ui.findKeys, function(key, i) {
		                            return $.extend({
		                                checked: app.user.ui.findQuery.conditions.length && 
		                                    (app.user.ui.findQuery.conditions[0].key == key.id ||
		                                    (app.user.ui.findQuery.conditions[0].key === '' && key.id == 'all')),
		                            }, key)
		                        }) }
		                    ] },
		                    { id: 'advancedfind', title: 'Advanced Find...', keyboard: 'shift control f' }
		                ] },
		                { id: 'dataMenu', title: 'Data', items: [
		                    { id: 'titles', title: 'Manage Titles...' },
		                    { id: 'names', title: 'Manage Names...' },
		                    {},
		                    { id: 'posters', title: 'Manage Stills...' },
		                    { id: 'posters', title: 'Manage Posters...' },
		                    {},
		                    { id: 'places', title: 'Manage Places...' },
		                    { id: 'events', title: 'Manage Events...' },
		                    {},
		                    { id: 'users', title: 'Manage Users...' },
		                    { id: 'lists', title: 'Manage Lists...' },
		                ] },
		                { id: 'codeMenu', title: 'Code', items: [
		                    { id: 'download', title: 'Download' },
		                    { id: 'contribute', title: 'Contribute' },
		                    { id: 'report', title: 'Report a Bug' },
		                ] },
		                { id: 'helpMenu', title: 'Help', items: [
		                    { id: 'help', title: app.config.site.name + ' Help', keyboard: 'shift ?' }
		                ] },
		                { id: 'debugMenu', title: 'Debug', items: [
		                    { id: 'query', title: 'Show Query' },
		                    { id: 'resetui', title: 'Reset UI Settings'}
		                ] },
		                { id: 'testMenu', title: 'Test', items: [
		                    { group: 'foogroup', items: [
		                        { id: 'item1', title: 'Item 1' },
		                        { id: 'item2', title: 'Item 2' }
		                    ] }
		                ] }
		            ]
		        })
		        .bindEvent({
		            change: function(event, data) {
		                if (data.id == 'find') {
		                    var id = data.checked[0].id;
		                    app.$ui.findSelect.selectItem(id);
		                } else if (data.id == 'movieview') {
		                    var view = data.checked[0].id;
		                    var id = document.location.pathname.split('/')[1];
		                    if (view == 'info')
		                        url(id + '/info');
		                    else
		                        url(id);
		                } else if (data.id == 'ordermovies') {
		                    var id = data.checked[0].id;
		                    app.$ui.list.sortList(app.user.ui.lists[app.user.ui.list].sort[0].key, id == 'ascending' ? '' : '-');
		                } else if (data.id == 'sortmovies') {
		                    var id = data.checked[0].id,
		                        operator = getSortOperator(id);
		                    app.$ui.mainMenu.checkItem('sortMenu_ordermovies_' + (operator === '' ? 'ascending' : 'descending'));
		                    app.$ui.sortSelect.selectItem(id);
		                    app.$ui.list.sortList(id, operator);
		                    URL.set(Query.toString());
		                } else if (data.id == 'viewmovies') {
		                    var view = data.checked[0].id;
		                    url('#view=' + view);
		                }
		            },
		            click: function(event, data) {
		                if (data.id == 'about') {
		                    var $dialog = new Ox.Dialog({
		                        buttons: [
		                            new Ox.Button({
		                                id: 'close',
		                                title: 'Close'
		                            }).bindEvent({
		                                click: function() {
		                                    $dialog.close();
		                                }
		                            })
		                        ],
		                        id: 'about',
		                        title: 'About'
		                    }).open();
		                } else if (data.id == 'home') {
		                    var $dialog = new Ox.Dialog({
		                        buttons: [
		                            new Ox.Button({
		                                id: 'close',
		                                title: 'Close'
		                            }).bindEvent({
		                                click: function() {
		                                    $dialog.close();
		                                }
		                            })
		                        ],
		                        height: 498,
		                        id: 'home',
		                        keys: {enter: 'close', escape: 'close'},
		                        title: app.config.site.name,
		                        width: 800
		                    }).open();
		                } else if (data.id == 'register') {
		                    app.$ui.accountDialog = ui.accountDialog('register').open();
		                } else if (data.id == 'loginlogout') {
		                    app.$ui.accountDialog = (app.user.level == 'guest' ?
		                        ui.accountDialog('login') : ui.accountLogoutDialog()).open();
		                } else if (data.id == 'places') {
		                    app.$ui.placesDialog = ui.placesDialog().open();
		                    /*
		                    var $manage = new Ox.SplitPanel({
		                            elements: [
		                                {
		                                    collapsible: true,
		                                    element: new Ox.SplitPanel({
		                                        elements: [
		                                            {
		                                                element: new Ox.Toolbar({
		                                                    orientation: 'horizontal',
		                                                    size: 44
		                                                }).append(
		                                                    app.$ui.findPlacesElement = new Ox.FormElementGroup({
		                                                        elements: [
		                                                            app.$ui.findPlacesSelect = new Ox.Select({
		                                                                    id: 'findPlacesSelect',
		                                                                    items: [
		                                                                        { id: 'name', title: 'Find: Name' },
		                                                                        { id: 'region', title: 'Find: Region' },
		                                                                        { id: 'user', title: 'Find: User' }
		                                                                    ],
		                                                                    overlap: 'right',
		                                                                    type: 'image'
		                                                                })
		                                                                .bindEvent({
		                                                                    change: function(event, data) {
		                                                                        app.$ui.findPlacesSelect.loseFocus();
		                                                                        app.$ui.findPlacesInput.options({
		                                                                            placeholder: data.selected[0].title
		                                                                        });
		                                                                    }
		                                                                }),
		                                                            app.$ui.findPlacesInput = new Ox.Input({
		                                                                clear: true,
		                                                                id: 'findPlacesInput',
		                                                                placeholder: 'Find: Name',
		                                                                width: 234
		                                                            })
		                                                        ],
		                                                        id: 'findPlacesElement'
		                                                    }) 
		                                                    .css({
		                                                        float: 'left',
		                                                        margin: '4px'
		                                                    })
		                                                ).append(
		                                                    app.$ui.sortPlacesSelect = new Ox.Select({
		                                                        id: 'sortPlacesSelect',
		                                                        items: [
		                                                            { id: 'name', title: 'Sort by Name', checked: true },
		                                                            { id: 'region', title: 'Sort by Region' },
		                                                            { id: 'size', title: 'Sort by Size' },
		                                                            { id: 'latitude', title: 'Sort by Latitude' },
		                                                            { id: 'longitude', title: 'Sort by Longitude' },
		                                                            { id: 'clips', title: 'Sort by Number of Clips' },
		                                                            { id: 'user', title: 'Sort by User' },
		                                                            { id: 'datecreated', title: 'Sort by Date Added' },
		                                                            { id: 'datemodified', title: 'Sort by Date Modified' }
		                                                        ],
		                                                        width: 246
		                                                    })
		                                                    .css({
		                                                        float: 'left',
		                                                        margin: '0 4px 4px 4px'
		                                                    })
		                                                ),
		                                                size: 44
		                                            },
		                                            {
		                                                element: new Ox.Element('div')
		                                            },
		                                            {
		                                                element: new Ox.Toolbar({
		                                                    orientation: 'horizontal',
		                                                    size: 16
		                                                }),
		                                                size: 16
		                                            }
		                                        ],
		                                        orientation: 'vertical'
		                                    }),
		                                    size: 256
		                                },
		                                {
		                                    element: new Ox.SplitPanel({
		                                        elements: [
		                                            {
		                                                element: new Ox.Toolbar({
		                                                    orientation: 'horizontal',
		                                                    size: 24
		                                                }).append(
		                                                    app.$ui.labelsButton = new Ox.Button({
		                                                            id: 'labelsButton',
		                                                            title: [
		                                                                {id: 'show', title: 'Show Labels'},
		                                                                {id: 'hide', title: 'Hide Labels'}
		                                                            ],
		                                                            width: 96
		                                                        })
		                                                        .css({
		                                                            float: 'left',
		                                                            margin: '4px'
		                                                        })
		                                                ).append(
		                                                    app.$ui.findMapInput = new Ox.Input({
		                                                        clear: true,
		                                                        id: 'findMapInput',
		                                                        placeholder: 'Find on Map',
		                                                        width: 192
		                                                    })
		                                                    .css({
		                                                        float: 'right',
		                                                        margin: '4px'
		                                                    })
															.bindEvent({
																submit: function(event, data) {
																	app.$ui.map.find(data.value, function(location) {
																		
																		app.$ui.placeNameInput.options({
																			disabled: false,
																			value: location.name
																		});
																		app.$ui.placeAliasesInput.options({
																			disabled: false
																		});
																		app.$ui.placeGeonameLabel.options({
																			disabled: false,
																			title: location.names.join(', ')
																		});
																		app.$ui.removePlaceButton.options({
																			disabled: false
																		});
																		app.$ui.addPlaceButton.options({
																			disabled: false
																		});

																	});
																}
															})
		                                                ),
		                                                size: 24
		                                            },
		                                            {
		                                                element: app.$ui.map = new Ox.Map({
		                                                    	places: ['Boston', 'Brussels', 'Barcelona', 'Berlin', 'Beirut', 'Bombay', 'Bangalore', 'Beijing']
		                                                	})
															.css({
		                                                    	left: 0,
		                                                    	top: 0,
		                                                    	right: 0,
		                                                    	bottom: 0
		                                                	})
															.bindEvent({
																select: function(event, location) {
																	app.$ui.placeNameInput.options({
																		disabled: false,
																		value: location.name
																	});
																	app.$ui.placeAliasesInput.options({
																		disabled: false
																	});
																	app.$ui.placeGeonameLabel.options({
																		disabled: false,
																		title: location.names.join(', ')
																	});
																	app.$ui.removePlaceButton.options({
																		disabled: false
																	});
																	app.$ui.addPlaceButton.options({
																		disabled: false
																	});
																}
															})
		                                            },
		                                            {
		                                                element: app.$ui.bottomBar = new Ox.Toolbar({
		                                                    orientation: 'horizontal',
		                                                    size: 24
		                                                })
														.append(
															app.$ui.placeNameInput = new Ox.Input({
																disabled: true,
																id: 'placeName',
																placeholder: 'Name',
																width: 128
															})
															.css({
																float: 'left',
																margin: '4px 0 0 4px'
															})
														)
														.append(
															app.$ui.placeAliasesInput = new Ox.Input({
																disabled: true,
																id: 'aliases',
																placeholder: 'Aliases',
																width: 128
															})
															.css({
																float: 'left',
																margin: '4px 0 0 4px'
															})
														)
														.append(
															app.$ui.placeGeonameLabel = new Ox.Label({
																disabled: true,
																id: 'placeGeoname',
																title: 'Geoname',
																width: parseInt(app.$ui.document.width() * 0.8) - 256 - 256 - 32 - 24
															})
															.css({
		                                                        float: 'left',
		                                                        margin: '4px 0 0 4px'
		                                                    })
														)
														.append(
		                                                    app.$ui.addPlaceButton = new Ox.Button({
																disabled: true,
		                                                        id: 'addPlaceButton',
		                                                        title: 'add',
																type: 'image'
		                                                    })
		                                                    .css({
		                                                        float: 'right',
		                                                        margin: '4px 4px 0 0'
		                                                    })
		                                                )
														.append(
		                                                    app.$ui.removePlaceButton = new Ox.Button({
																disabled: true,
		                                                        id: 'removePlaceButton',
		                                                        title: 'remove',
																type: 'image'
		                                                    })
		                                                    .css({
		                                                        float: 'right',
		                                                        margin: '4px 4px 0 0'
		                                                    })
		                                                ),
		                                                size: 24
		                                            }
		                                        ],
		                                        orientation: 'vertical'
		                                    })
		                                }
		                            ],
		                            orientation: 'horizontal'
		                        }).css({
		                            top: '24px',
		                            bottom: '24px',
		                        }),
		                        $dialog = new Ox.Dialog({
		                            buttons: [
		                                {
		                                    click: function() {
		                                        $dialog.close();
		                                    },
		                                    id: 'close',
		                                    title: 'Close',
		                                    value: 'Close'
		                                }
		                            ],
		                            height: parseInt(app.$ui.document.height() * 0.8),
		                            id: 'places',
		                            minHeight: 400,
		                            minWidth: 600,
		                            padding: 0,
		                            title: 'Manage Places',
		                            width: parseInt(app.$ui.document.width() * 0.8)
		                        }).css({
		                            overflow: 'hidden'
		                        }).append($manage).open();
		                    */
		                } else if (data.id == 'query') {
		                    var $dialog = new Ox.Dialog({
		                        buttons: [
		                            new Ox.Button({
		                                id: 'close',
		                                title: 'Close'
		                            }).bindEvent({
		                                click: function() {
		                                    $dialog.close();
		                                }
		                            })
		                        ],
		                        content: new Ox.Element()
		                            .html([
		                                'Query: ' + JSON.stringify(Query.toObject()),
		                                'findQuery: ' + JSON.stringify(app.user.ui.findQuery),
		                                'listQuery: ' + JSON.stringify(app.user.ui.listQuery)
		                            ].join('<br/><br/>')),
		                        height: 200,
		                        keys: {enter: 'close', escape: 'close'},
		                        width: 400
		                    }).open();
		                } else if (data.id == 'resetui') {
		                    pandora.api.resetUI({}, function() {
    		                    app.$ui.appPanel.reload();
		                    });
		                }
		            }
		        });
			return that;
		},
		mainPanel: function() {
			var that = new Ox.SplitPanel({
                elements: [
                    {
                        collapsible: true,
                        collapsed: !app.user.ui.showSidebar,
                        element: app.$ui.leftPanel = ui.leftPanel(),
                        resizable: true,
                        resize: [192, 256, 320, 384],
                        size: app.user.ui.sidebarSize
                    },
                    {
                        element: app.$ui.rightPanel = ui.rightPanel()
                    }
                ],
                orientation: 'horizontal'
            })
			return that;
		},
		placesDialog: function() {
		    var height = Math.round(document.height * 0.8),
		        width = Math.round(document.width * 0.8),
		        that = new Ox.Dialog({
    		        buttons: [
        		        new Ox.Button({
                            id: 'done',
                            title: 'Done'
                        }).bindEvent({
                            click: function() {
                                that.close();
                            }
                        })
    		        ],
    		        content: app.$ui.placesElement = new Ox.ListMap({
    		                height: height - 48,
    		                places: function(data, callback) {
    		                    return pandora.api.findPlaces($.extend(data, {
                                    query: {conditions: [], operator: ''}
                                }), callback);
    		                },
    		                width: width
        		        })
        		        .bindEvent({
        		            addplace: function(event, data) {
        		                Ox.print('ADDPLACE', data)
        		                pandora.api.addPlace(data.place, function(result) {
        		                    var id = result.data.id;
        		                    Ox.print("ID", result.data.id, result)
                                    Ox.Request.clearCache(); // fixme: remove
                                    Ox.print('AAAAA')
                                    app.$ui.placesElement
                                        .reloadList()
                                        .bindEventOnce({
                                            loadlist: function() {
                                                app.$ui.placesElement
                                                    .focusList()
                                                    .options({selected: [id]});
                                            }
                                        });
                                });
        		            },
        		            removeplace: function(event, data) {
        		                pandora.api.removePlace(data.id, function(result) {
        		                    // fixme: duplicated
                                    Ox.Request.clearCache(); // fixme: remove
                                    app.$ui.placesElement
                                        .reloadList()
                                        .bindEventOnce({
                                            loadlist: function(event, data) {
                                                app.$ui.placesElement
                                                    .focusList();
                                            }
                                        });
        		                });
        		            }
        		        }),
    		        height: height,
                    keys: {enter: 'done', escape: 'done'},
                    padding: 0,
                    title: 'Manage Places',
    		        width: width
    		    });
		    return that;
		},
        publicListsDialog: function() { // fixme: unused
            var that = new Ox.Dialog({
                buttons: [
                    new Ox.Button({
                        id: 'done',
                        title: 'Done'
                    }).bindEvent({
                        click: function() {
                            that.close();
                        }
                    })
                ],
                content: ui.publicListsList(),
                height: 320,
                keys: {enter: 'close', escape: 'close'},
                padding: 0,
                title: 'Public Lists',
                width: 420
            })
            .css({
                position: 'absolute'
            });
            return that;
        },
		rightPanel: function() {
			var that;
			if (app.user.ui.section == 'site') {
			    that = new Ox.Element()
			        .html(app.user.ui.sitePage)
			        .bindEvent({
			            resize: function(event, data) {
			                
			            }
			        });
                    pandora.api.getPage(app.user.ui.sitePage, function(result) {
                        that.html(result.data.body).css({'overflow-y':'auto'});                        
                    });
			} else if (app.user.ui.section == 'items') {
			    that = new Ox.SplitPanel({
                    elements: [
                        {
                            element: app.$ui.toolbar = ui.toolbar(),
                            size: 24
                        },
                        {
                            element: app.$ui.contentPanel = ui.contentPanel()
                        },
                        {
                            element: app.$ui.statusbar = ui.statusbar(),
                            size: 16
                        }
                    ],
                    id: 'rightPanel',
                    orientation: 'vertical'
                })
                .bindEvent({
                    resize: function(event, data) {
                        //Ox.print('???? resize rightPanel', event, data)
                        if (!app.user.ui.item) {
                            resizeGroups(data);
                            app.$ui.list.size();
                            if (app.user.ui.lists[app.user.ui.list].listView == 'map') {
                                app.$ui.map.resize();
                            }
                        } else {
                            app.$ui.browser.scrollToSelection();
                            app.user.ui.itemView == 'player' && app.$ui.player.options({
            					width: data
            				});
                            app.user.ui.itemView == 'timeline' && app.$ui.editor.options({
            					width: data
            				});
                        }
                    }
                });
            }
			return that;
		},
		sectionbar: function(mode) {
			var that = new Ox.Bar({
		            size: 24
		        })
		        .append(
		            mode == 'buttons' ?
		            app.$ui.sectionButtons = ui.sectionButtons() :
		            app.$ui.sectionSelect = ui.sectionSelect()
		        );
			that.toggle = function() {
				
			};
			return that;
		},
		sectionButtons: function() {
		    var that = new Ox.ButtonGroup({
                    buttons: [
    					{id: 'site', selected: app.user.ui.section == 'site', title: app.config.site.name},
                        {id: 'items', selected: app.user.ui.section == 'items', title: app.config.itemName.plural},
                        {id: 'texts', selected: app.user.ui.section == 'texts', title: 'Texts'},
    					{id: 'admin', selected: app.user.ui.section == 'admin', title: 'Admin'}
                    ],
                    id: 'sectionButtons',
                    selectable: true
                }).css({
	                float: 'left',
                    margin: '4px'
	            })
	            .bindEvent({
	                change: function(event, data) {
	                    var section = data.selected[0];
	                    if (section == 'site') {
	                        URL.set(app.user.ui.sitePage);
	                    } else if (section == 'items') {
                            URL.set(Query.toString());
	                    }
	                }
	            });
	        return that;
		},
        sectionSelect: function() {
            // fixme: duplicated
		    var that = new Ox.Select({
		            id: 'sectionSelect',
                    items: [
    					{checked: app.user.ui.section == 'site', id: 'site', title: app.config.site.name},
                        {checked: app.user.ui.section == 'items', id: 'items', title: app.config.itemName.plural},
                        {checked: app.user.ui.section == 'texts', id: 'texts', title: 'Texts'},
    					{checked: app.user.ui.section == 'admin', id: 'admin', title: 'Admin'}
                    ]
                }).css({
	                float: 'left',
                    margin: '4px'
	            })
	            .bindEvent({
	                
	            });
	        return that;
		},
        sortSelect: function() {
            var that = new Ox.Select({
                    id: 'sortSelect',
                    items: $.map(app.ui.sortKeys, function(key) {
                        //Ox.print('????', app.user.ui.lists[app.user.ui.list].sort.key, key.id)
                        return $.extend($.extend({}, key), {
                            checked: app.user.ui.lists[app.user.ui.list].sort[0].key == key.id,
                            title: 'Sort by ' + key.title
                        });
                    }),
                    width: 144
                })
                .css({
                    float: 'left',
                    margin: '4px 0 0 4px'
                })
                .bindEvent({
                    change: function(event, data) {
                        var id = data.selected[0].id,
                            operator = getSortOperator(id);
                        /*
                        app.user.ui.lists[app.user.ui.list].sort[0] = {
                            key: id,
                            operator: operator
                        };
                        */
                        app.$ui.mainMenu.checkItem('sortMenu_sortmovies_' + id);
                        app.$ui.mainMenu.checkItem('sortMenu_ordermovies_' + (operator === '' ? 'ascending' : 'descending'));
                        app.$ui.list.sortList(id, operator);
                        URL.set(Query.toString());
                    }
                });
            return that;
        },
		status: function(key, data) {
			var that = Ox.toTitleCase(key) + ': ' + [
		        Ox.formatNumber(data.items) + ' movie' + (data.items != 1 ? 's' : ''),
		        Ox.formatDuration(data.runtime, 'medium'),
		        data.files + ' file' + (data.files != 1 ? 's' : ''),
		        Ox.formatDuration(data.duration, 'short'),
		        Ox.formatValue(data.size, 'B'),
		        Ox.formatValue(data.pixels, 'px')
		    ].join(', ');
			return that;
		},
		statusbar: function() {
			var that = new Ox.Bar({
		            size: 16
		        })
		        .css({
		            textAlign: 'center'
		        })
		        .append(
		            new Ox.Element()
		                .css({
		                    marginTop: '2px',
		                    fontSize: '9px'
		                })
		                .append(
		                    app.$ui.total = new Ox.Element('span')
		                )
		                .append(
		                    new Ox.Element('span').html(' &mdash; ')
		                )
		                .append(
		                    app.$ui.selected = new Ox.Element('span')
		                )
		        );
		    return that;
		},
		toolbar: function() {
			var that = new Ox.Bar({
			        size: 24
			    }).css({
		            zIndex: 2 // fixme: remove later
		        });
		    app.user.ui.item && that.append(
		        app.$ui.backButton = ui.backButton()
		    );
			that.append(
			    app.$ui.viewSelect = ui.viewSelect() 
			);
			!app.user.ui.item && that.append(
			    app.$ui.sortSelect = ui.sortSelect()
			);
			that.append(
			    app.$ui.findElement = ui.findElement()
			);
			that.display = function() {
				app.$ui.rightPanel.replaceElement(0, app.$ui.toolbar = ui.toolbar()); // fixme: remove later
			}
			return that;
		},
		viewSelect: function() {
			var that = new Ox.Select({
                    id: 'viewSelect',
                    items: !app.user.ui.item ? $.map(app.config.listViews, function(view) {
                        return $.extend($.extend({}, view), {
                            checked: app.user.ui.lists[app.user.ui.list].listView == view.id,
                            title: 'View ' + view.title
                        });
                    }) : $.map(app.config.itemViews, function(view) {
                        return $.extend($.extend({}, view), {
                            checked: app.user.ui.itemView == view.id,
                            title: 'View: ' + view.title
                        });
                    }),
                    width: !app.user.ui.item ? 144 : 128
                })
                .css({
                    float: 'left',
                    margin: '4px 0 0 4px'
                })
                .bindEvent({
                    change: !app.user.ui.item ? function(event, data) {
                        var id = data.selected[0].id;
                        app.$ui.mainMenu.checkItem('viewMenu_movies_' + id);
                        UI.set(['lists', app.user.ui.list, 'listView'].join('|'), id);
                        URL.set(Query.toString());
                    } : function(event, data) {
                        var id = data.selected[0].id;
                        //UI.set({itemView: id});
                        URL.set(app.user.ui.item + '/' + id);
                        // app.$ui.contentPanel.replaceElement(1, app.$ui.item = ui.item());
                    }
                });
			return that;
		}
	}

    function autovalidateCode(value, blur, callback) {
        value = $.map(value.toUpperCase().split(''), function(v) {
            return /[0-9A-Z]/(v) ? v : null;
        }).join('');
        callback(value);
    }

    function autovalidateEmail(value, blur, callback) {
        value = $.map(value.toLowerCase().split(''), function(v, i) {
            return /[0-9a-z\.\+\-_@]/(v) ? v : null;
        }).join('');
        callback(value);
    }

    function autovalidateListname(value, blur, callback) {
        var length = value.length;
        value = $.map(value.split(''), function(v, i) {
            if (new RegExp('[0-9' + Ox.regexp.letters + '\\(\\)' + ((i == 0 || (i == length - 1 && blur)) ? '' : ' \-') + ']', 'i').test(v)) {
                return v
            } else {
                return null;
            }
        }).join('');
        $.each(['  ', ' -', '- ', '--', '\\(\\(', '\\)\\(', '\\)\\)'], function(i, v) {
            //Ox.print(v, v[0], v[0] == '\\')
            while (value.indexOf(v) > -1) {
                value = value.replace(new RegExp(v, 'g'), v[0] + (v[0] == '\\' ? v[1] : ''));
            }
        })
        callback(value);
    }

    function autovalidateUsername(value, blur, callback) {
        var length = value.length;
        value = $.map(value.toLowerCase().split(''), function(v, i) {
            if (new RegExp('[0-9a-z' + ((i == 0 || (i == length - 1 && blur)) ? '' : '\-_') + ']').test(v)) {
                return v
            } else {
                return null;
            }
        }).join('');
        $.each(['--', '-_', '_-', '__'], function(i, v) {
            while (value.indexOf(v) > -1) {
                value = value.replace(new RegExp(v, 'g'), v[0]);
            }
        })
        callback(value);
    }

    function enterFullscreen() {
        app.$ui.appPanel.size(0, 0);
        app.user.ui.showSidebar && app.$ui.mainPanel.size(0, 0);
        app.$ui.rightPanel.size(0, 0).size(2, 0);
        !app.user.ui.showMovies && app.$ui.contentPanel.css({
            top: (-112 - Ox.UI.SCROLLBAR_SIZE) + 'px' // fixme: rightPanel.size(0, 0) doesn't preserve negative top of browser
        });
        app.user.ui.showMovies && app.$ui.contentPanel.size(0, 0);
        app.$ui.player.options({
            height: app.$document.height() - 2,
            width: app.$document.width() - 2
        })
    }

    function exitFullscreen() {
        app.$ui.appPanel.size(0, 20);
        app.user.ui.showSidebar && app.$ui.mainPanel.size(0, app.user.ui.sidebarSize);
        app.$ui.rightPanel.size(0, 24).size(2, 16);
        !app.user.ui.showMovies && app.$ui.contentPanel.css({
            top: 24 + (-112 - Ox.UI.SCROLLBAR_SIZE) + 'px' // fixme: rightPanel.size(0, 0) doesn't preserve negative top of browser
        });
        app.user.ui.showMovies && app.$ui.contentPanel.size(0, 112 + Ox.UI.SCROLLBAR_SIZE);
    }

    function getListData() {
        var data = {};
        if (app.user.ui.list) {
            var folder = app.$ui.folderList['personal'].options('selected')[0] ==
                app.user.ui.list ? 'personal' : 'featured';
            data = app.$ui.folderList[folder].value(app.user.ui.list);
        }
        data.editable = data.user == app.user.username && data.type == 'static';
        return data;
    }

    function getFoldersHeight() {
        var height = 48;
        app.ui.sectionFolders[app.user.ui.section].forEach(function(folder, i) {
            height += app.user.ui.showFolder[app.user.ui.section][folder.id] * (
                !!folder.showBrowser * 40 + folder.items * 16
            );
            Ox.print('h', height)
        });
        /*
        $.each(app.user.ui.showFolder[app.user.ui.section], function(id, show) {
            var i = Ox.getPositionById(app.ui.sectionFolders[app.user.ui.section], id);
            height += show * (
                app.ui.sectionFolders[app.user.ui.section][i].showBrowser * 40 +
                app.ui.sectionFolders[app.user.ui.section][i].items * 16
            );
        });
        */
        return height;
    }

    function getFoldersWidth() {
        var width = app.user.ui.sidebarSize;
        // fixme: don't use height(), look up in splitpanels
        Ox.print(getFoldersHeight(), '>', app.$ui.leftPanel.height() - 24 - 1 - app.$ui.info.height())
        if (getFoldersHeight() > app.$ui.leftPanel.height() - 24 - 1 - app.$ui.info.height()) {
            width -= Ox.UI.SCROLLBAR_SIZE;
        }
        return width;
    }

	function getGroupWidth(pos, panelWidth) { // fixme: don't pass panelWidth
	    var width = {};
	    width.list = Math.floor(panelWidth / 5) + (panelWidth % 5 > pos);
	    width.column = width.list - 40 - Ox.UI.SCROLLBAR_SIZE;
	    return width;
	}

    function getSortOperator(key) { // fixme: make static
        var type = Ox.getObjectById(app.config.itemKeys, key).type;
        return ['hue', 'string', 'text'].indexOf(
            Ox.isArray(type) ? type[0] : type
        ) > -1 ? '+' : '-';
    }

    function login(data) {
        app.user = data.user;
        Ox.Theme(app.user.ui.theme);
        app.$ui.appPanel.reload();
    }

    function logout(data) {
        app.user = data.user;
        Ox.Theme(app.config.user.ui.theme);
        app.$ui.appPanel.reload();
    }

    function reloadGroups(i) {
        var query = Query.toObject();
        app.$ui.list.options({
            items: function(data, callback) {
                return pandora.api.find($.extend(data, {
                    query: query
                }), callback);
            }
        });
        $.each(app.ui.groups, function(i_, group_) {
            if (i_ != i) {
                //Ox.print('setting groups request', i, i_)
                app.$ui.groups[i_].options({
                    items: function(data, callback) {
                        delete data.keys;
                        return pandora.api.find($.extend(data, {
                            group: group_.id,
                            query: Query.toObject(group_.id)
                        }), callback);
                    }
                });
            }
        });
        history.pushState({}, '', Query.toString(query));
    }

    function reloadList() {
        Ox.print('reloadList')
        var listData = getListData();
        Ox.Request.clearCache(); // fixme: remove
        app.$ui.groups.forEach(function($group) {
            $group.reloadList();
        });
        app.$ui.list.bindEvent({
                init: function(event, data) {
                    app.$ui.folderList[listData.status]
                        .value(listData.id, 'items', data.items);
                }
            })
            .bindEventOnce({
                load: function(event, data) {
                    app.$ui.list.gainFocus().options({selected: [data.items]});
                }
            })
            .reloadList();
    }

    function resizeGroups(width) {
        var widths = $.map(app.ui.groups, function(v, i) {
            return getGroupWidth(i, width);
        });
        //Ox.print('widths', widths);
        app.$ui.browser.size(0, widths[0].list).size(2, widths[4].list);
        app.$ui.groupsInnerPanel.size(0, widths[1].list).size(2, widths[3].list);
        $.each(app.$ui.groups, function(i, list) {
            list.resizeColumn('name', widths[i].column);
        });
    }

    function resizeFolders() {
        var width = getFoldersWidth(),
            columnWidth = {};
        if (app.user.ui.section == 'site') {
            columnWidth.title = width - 16;
        } else if (app.user.ui.section == 'items') {
            columnWidth = {user: parseInt((width - 88) * 0.4)};
            columnWidth.name = (width - 88) - columnWidth.user;
        }
        //Ox.print('sectionsWidth', width)
        $.each(app.$ui.folderList, function(id, $list) {
            var i = Ox.getPositionById(app.ui.sectionFolders[app.user.ui.section], id);
            app.$ui.folder[i].css({width: width + 'px'});
            $list.css({width: width + 'px'});
            Ox.print('...', id, $list.options())
            if (app.user.ui.section == 'site') {
                $list.resizeColumn('title', columnWidth.title);
            } else if (app.user.ui.section == 'items') {
                if (app.ui.sectionFolders[app.user.ui.section][i].showBrowser) {
                    $list.resizeColumn('user', columnWidth.user)
                        .resizeColumn('name', columnWidth.name);
                } else {
                    $list.resizeColumn(id == 'favorite' ? 'id' : 'name', width - 88);
                }                
            }
            if (!app.user.ui.showFolder[app.user.ui.section][id]) {
                app.$ui.folder[i].update();
            }
        });
    }

    function resizeWindow() {
        resizeFolders();
        if (!app.user.ui.item) {
            app.$ui.list.size();
            resizeGroups(app.$ui.rightPanel.width());
            if (app.user.ui.listView == 'map') {
                app.$ui.map.resize();
            }
        } else {
            //Ox.print('app.$ui.window.resize');
            app.$ui.browser.scrollToSelection();
            app.user.ui.itemView == 'player' && app.$ui.player.options({
                // fixme: duplicated
				height: app.$ui.contentPanel.size(1),
                width: app.$ui.document.width() - app.$ui.mainPanel.size(0) - 1
            });
            app.user.ui.itemView == 'timeline' && app.$ui.editor.options({
                // fixme: duplicated
				height: app.$ui.contentPanel.size(1),
                width: app.$ui.document.width() - app.$ui.mainPanel.size(0) - 1
            });
        }        
    }

    function saveVideoPosition() {
        //alert(JSON.stringify(['videoPosition|' + old.user.ui.item, app.$ui[old.user.ui.itemView == 'player' ? 'player' : 'editor'].options('position')]));
    }

    function selectList() {
        if (app.user.ui.list) {
	        pandora.api.findLists({
	            keys: ['status', 'user'],
	            query: {
	                conditions: [{key: 'id', value: app.user.ui.list, operator: '='}],
	                operator: ''
	            },
	            range: [0, 1]
	        }, function(result) {
	            var folder, list;
	            if (result.data.items.length) {
	                list = result.data.items[0];
	                folder = list.status == 'featured' ? 'featured' : (
	                    list.user == app.user.username ? 'personal' : 'favorite'
	                );
	                app.$ui.folderList[folder]
	                    .options('selected', [app.user.ui.list])
	                    .gainFocus();
	            } else {
	                app.user.ui.list = '';
	                //app.user.ui.listQuery.conditions = []; // fixme: Query should read from ui.list, and not need ui.listQuery to be reset
	                //URL.set(Query.toString());
	            }
	        })
	    }
    }

    function unloadWindow() {
        // fixme: ajax request has to have async set to false for this to work
        app.user.ui.section == 'items' &&
            ['player', 'timeline'].indexOf(app.user.ui.itemView) > -1 &&
            app.user.ui.item &&
            UI.set(
                'videoPosition|' + app.user.ui.item,
                app.$ui[
                    app.user.ui.itemView == 'player' ? 'player' : 'editor'
                ].options('position')
            );
    }

    function validateUser(key, existing) {
        existing = existing || false;
        var string = key == 'username' ? 'username' : 'e-mail address';
        return function(value, callback) {
            var valid = key == 'username' ? !!value.length : Ox.isValidEmail(value);
            valid ? pandora.api.findUser({
                key: key,
                value: value,
                operator: '='
            }, function(result) {
                var valid = existing == !!result.data.users.length;
                //Ox.print(existing, result.data.users)
                callback({
                    message: existing ? 
                        'Unknown ' + string :
                        string[0].toUpperCase() + string.substr(1) + ' already exists',
                    valid: valid
                });
            }) : callback({
                message: (!value.length ? 'Missing' : 'Invalid') + ' ' + string,
                valid: false
            });
        };
    }

	var Query = (function() {

	    function constructFind(query) {
	        //Ox.print('cF', query)
	        return /*encodeURI(*/$.map(query.conditions, function(v, i) {
	            if (!Ox.isUndefined(v.conditions)) {
	                return '[' + constructFind(v) + ']';
	            } else {
	                return v.value !== '' ? v.key + (v.key ? ':' : '') + constructValue(v.value, v.operator) : null;
	            }
	        }).join(query.operator)/*)*/;
	    }

	    function constructValue(value, operator) {
	        operator = operator.replace('=', '^$');
	        if (operator.indexOf('$') > -1) {
	            value = operator.substr(0, operator.length - 1) + value + '$'
	        } else {
	            value = operator + value;
	        }
	        return value;
	    }

	    function mergeFind() {
	    }

	    function parseFind(str) {
	        var find = {
	                conditions: [],
	                operator: ''
	            },
	            subconditions = str.match(/\[.*?\]/g) || [];
	        $.each(subconditions, function(i, v) {
	            subconditions[i] = v.substr(1, v.length - 2);
	            str = str.replace(v, '[' + i + ']');
	        });
	        if (str.indexOf(',') > -1) {
	            find.operator = '&';
	        } else if (str.indexOf('|') > -1) {
	            find.operator = '|';
	        }
	        //Ox.print('pF', str, find.operator)
	        find.conditions = $.map(find.operator === '' ? [str] : str.split(find.operator == '&' ? ',' : '|'), function(v, i) {
	            //Ox.print('v', v)
	            var ret, kv;
	            if (v[0] == '[') {
	                //Ox.print('recursion', subconditions)
	                ret = parseFind(subconditions[parseInt(v.substr(1, v.length - 2))]);
	            } else {
	                kv = ((v.indexOf(':') > - 1 ? '' : ':') + v).split(':');
	                if (kv[0] == 'list') { // fixme: this is just a hack
	                    app.user.ui.listQuery = {conditions: [$.extend({
	                        key: kv[0]
	                    }, parseValue(kv[1]))], operator: ''};
	                } else {
	                    ret = $.extend({
    	                    key: kv[0]
    	                }, parseValue(kv[1]));
	                }
	            }
	            return ret;
	        });
	        return find;
	    }

	    function parseValue(str) {
	        var value = {
	                value: decodeURI(str),
	                operator: ''
	            };
	        if (value.value[0] == '!') {
	            value.operator = '!'
	            value.value = value.value.substr(1);
	        }
	        if ('^<>'.indexOf(value.value[0]) > -1) {
	            value.operator += value.value[0];
	            value.value = value.value.substr(1);
	        }
	        if (value.value.substr(-1) == '$') {
	            value.operator += '$';
	            value.value = value.value.substr(0, value.value.length - 1);
	        }
	        value.operator = value.operator.replace('^$', '=');
	        return value;
	    }

	    return {

	        fromString: function(str) {
	            var list = '',
	                query = Ox.unserialize(str.substr(1)),
	                sort = [];
	            if ('find' in query) {
	                app.user.ui.listQuery = {conditions: [], operator: ''}; // fixme: hackish
	                app.user.ui.findQuery = parseFind(query.find);
	                if (app.user.ui.listQuery.conditions.length) {
	                    list = app.user.ui.listQuery.conditions[0].value;
	                    !app.user.ui.lists[list] && UI.set(
	                        ['lists', list].join('|'), app.config.user.ui.lists['']
	                    );
	                }
	                UI.set({list: list});
	                //Ox.print('user.ui.findQuery', app.user.ui.findQuery)
	            }
	            if ('sort' in query) {
	                sort = query.sort.split(',')
	                UI.set(['lists', app.user.ui.list, 'sort'].join('|'), $.map(query.sort.split(','), function(v, i) {
	                    var hasOperator = '+-'.indexOf(v[0]) > -1,
	                        key = hasOperator ? query.sort.substr(1) : query.sort,
	                        operator = hasOperator ? v[0]/*.replace('+', '')*/ : getSortOperator(key);
	                    return {
	                        key: key,
	                        operator: operator
	                    };
	                }));
	            }
	            if ('view' in query) {
	                UI.set(['lists', app.user.ui.list, 'listView'].join('|'), query.view);
	            }
	        },

	        toObject: function(groupId) {
	            //Ox.print('tO', app.user.ui.findQuery.conditions)
	            // the inner $.merge() creates a clone
	            var conditions = $.merge(
	                    $.merge([], app.user.ui.listQuery.conditions),
	                    app.user.ui.findQuery.conditions
	                ),
	                operator;
	            $.merge(conditions, app.ui.groups ? $.map(app.ui.groups, function(v, i) {
                    if (v.id != groupId && v.query.conditions.length) {
                        return v.query.conditions.length == 1 ?
                            v.query.conditions : v.query;
                    }
                }) : []);
	            operator = conditions.length < 2 ? '' : ','; // fixme: should be &
	            //Ox.print('>>', groupId, app.user.ui.find, conditions);
	            return {
	                conditions: conditions,
	                operator: operator
	            };
	        },

	        toString: function() {
	            //Ox.print('tS', app.user.ui.find)
	            var sort = app.user.ui.lists[app.user.ui.list].sort[0];
	                key = sort.key,
	                operator = sort.operator;
	            return '?' + Ox.serialize({
	                find: constructFind(Query.toObject()),
	                sort: (operator == getSortOperator(key) ? '' : operator) + key,
	                view: app.user.ui.lists[app.user.ui.list].listView
	            });
	        }

	    };

	})();

    var UI = (function() {
        return {
            set: function(obj) {
                if (arguments.length == 2) {
                    // translate (key, value) to {key: value}
                    var obj_ = {};
                    obj_[arguments[0]] = arguments[1];
                    obj = obj_;
                }
                $.each(obj, function(key, val) {
                    Ox.print('key', key, 'val', val)
                    var i = 0,
                        keys = key.split('|'),
                        old = app.user.ui;
                    while (i < keys.length - 1) {
                        old = old[keys[i]];
                        i++;
                    }
                    if (old[keys[i]] !== val) {
                        old[keys[i]] = val;
                    } else {
                        delete obj[key];
                    }
                });
                Ox.len(obj) && pandora.api.setUI(obj);
                //alert('set ' + JSON.stringify(obj))
            }
        }
    }());

    var URL = (function() {

        var old = {
                user: {
                    ui: {}
                }
            },
            regexps = {
                '^\\?': function(url) {
                    Query.fromString(url);
                    UI.set({
                        section: 'items',
                        item: ''
                    });
                },
    			'^(|about|archives|faq|help|license|home|news|preferences|software|terms|tour)$': function(url) {
                    UI.set({
                        section: 'site',
                        sitePage: url || 'home'
                    });
    			},
    			'^admin': function(url) {
    				var split = url.split('/'),
    				    section = new RegExp(
    				        '^ˆ(statistics|users)$'
    				    ).exec(split[1]);
    				section = section ? section[0] : 'users';
    				UI.set({
    				    section: 'site',
    				    sitePage: url
    				})
    			},
    			'^(find)$': function() {
                    Query.fromString('?find='); // fixme: silly hack
                    UI.set({
                        section: 'items',
                        item: ''
                    });
    			},
    			'^(calendar|calendars|clips|icons|flow|map|maps|timelines)$': function() {
                    UI.set({
                        section: 'items',
                        item: ''
                    });
                    UI.set(['lists', app.user.ui.list, 'listView'].join('|'), url);
    			},
                '^[0-9A-Z]': function(url) {
    				var split = url.split('/'),
					    item = split[0],
		        	    view = new RegExp(
		        	        '^(' + $.map(app.config.itemViews, function(v) {
		        	            return v.id
		        	        }).join('|') + ')$'
		        	    ).exec(split[1]);
		        	view = view ? view[0] : app.user.ui.itemView;
                    UI.set({
                        section: 'items',
                        item: item,
                        itemView: view
                    });
    			},
    			'^texts$': function() {
                    UI.set({
                        section: 'texts'
                    });
    			}
            };

        return {

            set: function(title, url) {
                if (arguments.length == 1) { // fixme: remove later
                    url = title;
                }
                history.pushState({}, app.config.site.name + (title ? ' - ' + title : ''), '/' + url);
                old.user.ui = $.extend({}, app.user.ui); // make a clone
                URL.update();
            },

            parse: function() {
                var url = document.location.pathname.substr(1) +
                        document.location.search +
                        document.location.hash;
                $.each(regexps, function(re, fn) {
                    //Ox.print(url, 're', re)
                    re = new RegExp(re);
        			if (re.test(url)) {
        			    Ox.print('URL re ' + re)
        				fn(url);
        				return false;
        			}
                });
            },

            update: function() {
                URL.parse();
                if (app.user.ui.section != old.user.ui.section) {
                    app.$ui.appPanel.replaceElement(1, app.$ui.mainPanel = ui.mainPanel());
                } else if (app.user.ui.sitePage != old.user.ui.sitePage) {
                    app.$ui.mainPanel.replaceElement(1, app.$ui.rightPanel = ui.rightPanel());
                } else if (!app.user.ui.item || !old.user.ui.item) {
                    app.$ui.mainPanel.replaceElement(1, app.$ui.rightPanel = ui.rightPanel());
                    app.$ui.leftPanel.replaceElement(2, app.$ui.info = ui.info());
                } else {
                    app.$ui.contentPanel.replaceElement(1, ui.item());
                    app.$ui.leftPanel.replaceElement(2, app.$ui.info = ui.info());
                }
                if (
                    old.user.ui.item &&
                    ['player', 'timeline'].indexOf(old.user.ui.itemView) > -1
                ) {
                    UI.set(
                        'videoPosition|' + old.user.ui.item,
                        app.$ui[
                            old.user.ui.itemView == 'player' ? 'player' : 'editor'
                        ].options('position')
                    );
                }
                delete old.user.ui;
            }

        }

    }());

	var url = function(url) { // fixme: unused
		var currentURL = document.location.pathname.substr(1) + document.location.hash,
			match = false;
			regexps = {
				'^[0-9A-Z]': function() {
					var split = url.split('/'),
						id = split[0],
			        	view = split[1] || app.user.ui.itemView;
			        ui.item(id, view);
				}
			};
	    if (!url)
	        url = currentURL;
	    else {
	        if (url != currentURL) {
	            var title = document.title + ' ' + url;
	            history.pushState({}, title, url);
	        } else {
	            //FIXME: this is a workaround since open gets called twice
	            //       due to a bug with double click
	            //Ox.print('ignore double call of app.url, double click need to be fixed');
	            return;
	        }
	    }
		$.each(regexps, function(re, fn) {
			re = new RegExp(re);
			if (re.test(url)) {
				fn();
				match = true;
				return false;
			}
		});
		if (!match) {
			Query.fromString(location.hash.substr(1));
	        app.$ui.rightPanel.replaceElement(1, ui.contentPanel());
		}
	}

});
