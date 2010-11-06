if(typeof(app.afterLaunch) == "undefined")
    app.afterLaunch = [];

//app.afterLaunch[0]();
app.afterLaunch.push(function() {
    if (typeof(OxFF) == 'undefined')
        return;
    app.local = {
        api: new OxFF(),
        volumes: function(cb) {
            var _this = this;
            Ox.print('api.volumes');
            this.api.login(window, app.user.username);
            Ox.print('api.now access');
            this.api.access(function(access) {
                Ox.print('access callback', access);
                if(!access) {
                    var dialogHeight = app.$document.height()/2,
                        dialogWidth  = parseInt((dialogHeight - 48) * 0.75);

                    var $dialog = new Ox.Dialog({
                            buttons: [
                                {
                                    title: 'Close',
                                    click: function() {
                                        $dialog.close();
                                        delete $dialog;
                                    }
                                }
                            ],
                            height: dialogHeight,
                            padding: 0,
                            title: "Pan.do/ra OxFF Local Archive",
                            width: dialogWidth
                        })
                        .append("For this part of the page to work, you have to allow OxFF to send data to this site")
                        .open();
                } else {
                    _this.api.volumes(function(result) {
                        var data = JSON.parse(result);
                        cb(data);
                    });
                }
            });
        },
        files: function(archive, cb) {
            this.api.login(window, app.user.username);
            if(!this.api.access())
                return false;
            this.api.files(archive, function(result) {
                var data = JSON.parse(result);
                cb(data);
            });
            return true;
        },
        upload: function(options, done_cb, progress_cb) {
            function wrap(cb) {
                if(!cb)
                    return null;
                return function(result) {
                    var data = JSON.parse(result);
                    cb(data);
                }
            }
            this.api.upload(JSON.stringify(options),
                            wrap(done_cb),
                            wrap(progress_cb));
            return true;
        },
        parsePath: function(path) {
            var folder = path.split('/');
            folder.pop();
            if(folder.length==0) {
                folder.push("rootfolder");
            }
            //FIXME: this is also done on the backend but might require more sub options
            if (folder[folder.length-1] == "Extras" || folder[folder.length-1] == "Versions")
                folder.pop();
            folder = folder.join('/');
            return {
                folder: folder,
                name: path.substring(folder.length),
            }
        },
        loadVolumes: function() {
            var _this = this;
            Ox.print("load volumes");
            var $section = new Ox.CollapsePanel({
                id: 'volumes',
                size: 'small',
                title: 'Volumes'
            });

            app.$ui.sections.push($section);
            app.local.volumes(function(data) {
                Ox.print("got volumes", data);
                var volumes = 0;
                $.each(data, function(name, info) {
                    volumes ++;
                    Ox.print("add volume", name, info);
                    var status = info.available?"online":"offline";
                    var $line = $('<div>').css({ height: '20px' }).append(
                        $('<div>').css({ float: 'left', width: '16px', height: '16px', margin: '1px'}).append(
                            $('<img>').attr({ src: 'static/oxjs/build/png/ox.ui.modern/iconFind.png' })
                                      .css({
                                        width: '16px', height: '16px',
                                        border: 0, background: 'rgb(64, 64, 64)',
                                        WebkitBorderRadius: '2px' })
                        )
                    ).append(
                        $('<div>').css({ float: 'left', width: '122px', height: '14px', margin: '2px' }).html(name)
                    ).append(
                        $('<div>').css({ float: 'left', width: '40px', height: '14px', margin: '2px', textAlign: 'right' }).html(status)
                    );
                    $line.click(function() {
                        Ox.print("get files", name);
                        app.local.constructFileList(name);
                    });
                    $section.$content.append($line);
                });

                add_button = new Ox.Button({
                            id: 'add_volume',
                            title: 'add',
                            width: 32
                }).bindEvent('click', function(event, data) {
                    if(_this.api.setLocation("Volume "+(volumes+1))) _this.loadVolumes();
                });
                var update_button = new Ox.Button({
                            id: 'update_archive',
                            title: 'update',
                            width: 48
                }).bindEvent('click', function(event, data) {
                    update_button.options({disabled: true});
                    _this.api.update(function() {
                        update_button.options({disabled: false});
                    })
                });
                app.$ui.lists.replaceWith(app.constructLists());
                $section.find('.OxBar').append($('<div>')
                                                .css({'text-align': 'right', 'margin': '2px'})
                                                .append(update_button.$element)
                                                .append(add_button.$element)
                );
            });
        },
        uploadVideos: function(ids, done, progress, total) {
            var _this = this;
            if(typeof(total) == 'undefined')
                total = ids.length;

            if(ids.length>0) {
                var oshash = ids.pop();
                this.uploadVideo(oshash,
                    function(data) {
                        if(ids.length>0) {
                            Ox.print('more files in queue, calling again', ids, total);
                            _this.uploadVideos(ids, done, progress, total);
                        } else { //FIXME: should keep info about all uploads
                            done(data);
                        }
                    },
                    function(data) {
                        data.progress = data.progress/total;
                        progress(data);
                    });
            }
        },
        uploadVideo: function(oshash, done, progress) {
            Ox.print('upload', oshash);
            var url = app.local.absolute_url('/api/');
            app.local.upload({
                url: url,
                data: {action: 'upload', oshash: oshash},
                oshash: oshash,
                action: 'frames'
                },
                function(result) {
                    Ox.print(result);
                    //FIXME: check result before posting video
                    profile = '96p.webm';
                    var url = app.local.absolute_url('/api/upload/') + '?profile=' + profile + '&oshash=' + oshash;
                    app.local.upload(
                        {
                            oshash: oshash,
                            action: 'video',
                            profile: profile,
                            url: url
                        },
                        done,
                        progress
                    );
                }
            );
        },
        uploadFile: function(oshash) {
            Ox.print('upload file', oshash);
            var url = app.local.absolute_url('/api/');
            app.local.upload({
                url: url,
                data: {action: 'upload', oshash: oshash},
                oshash: oshash,
                action: 'file'
                },
                function(result) {
                    Ox.print(result);
                }
            );
        },
        cancel: function(oshash) {
            Ox.print('this function needs to be implemented: cancel ', oshash);
        },
        constructFileList: function(name) {
            var _this = this,
                $list = new Ox.TextList({
                columns: [
                    {
                        align: "left",
                        id: "id",
                        operator: "+",
                        title: "ID",
                        unique: true,
                        visible: false,
                        width: 120
                    },
                    {
                        align: "left",
                        id: "path",
                        operator: "+",
                        title: "path",
                        unique: false,
                        visible: true,
                        width: 600
                    },
                    {
                        align: "left",
                        id: "files",
                        operator: "+",
                        title: "files",
                        visible: true,
                        width: 80
                    },
                    {
                        align: "left",
                        id: "status",
                        operator: "+",
                        title: "status",
                        unique: false,
                        visible: true,
                        width:120
                    },
                ],
                id: "volume",
                request: function(options, callback) {
                    Ox.print("options, volumes", options)
                    if(!options.range) {
                        callback({
                            data: {
                                items: 58
                            }
                        });
                    } else {
                        app.local.files(name, function(result) {
                            var fileInfo = result.info;
                            app.api.update({
                                'volume': name, 'files': result.files
                            }, function(result) {
                                var videos = {};
                                function parseResult(result) {
                                    //extract and upload requested videos
                                    $.each(result.data.data, function(i, oshash) {
                                        $.each(folder_ids, function(i, ids) {
                                            if($.inArray(oshash, ids) > -1) {
                                                if(!videos[i]) {
                                                    videos[i] = [];
                                                    var button = new Ox.Button({
                                                                id: 'upload_' + oshash,
                                                                title: 'Upload',
                                                                width: 48
                                                    }).bindEvent('click', function(fid) { return function(event, data) {
                                                        Ox.print(videos[fid]);
                                                        $($('#'+fid).find('.OxCell')[1]).html(function(fid) {
                                                            var button = new Ox.Button({
                                                                        title: 'Cancel',
                                                                        width: 48
                                                            }).bindEvent('click', function(event, data) { 
                                                              $.each(videos[fid], function(i, oshash) {
                                                                _this.cancel(oshash);
                                                              });
                                                            });
                                                            return button.$element;
                                                        }(fid));
                                                        //$($('#'+fid).find('.OxCell')[2]).html('extracting data...');
                                                        app.local.uploadVideos(
                                                            videos[fid],
                                                            function(data) { 
                                                                $($('#'+fid).find('.OxCell')[2]).html('done');
                                                            },
                                                            function(data) {
                                                                $($('#'+fid).find('.OxCell')[2]).html(parseInt(data.progress*100));
                                                            }
                                                        );
                                                    }}(i));
                                                    $($('#'+i).find('.OxCell')[2]).html(button.$element);
                                                    $('#'+i).css({'font-weight': 'bold'});
                                                }
                                                videos[i].push(oshash);
                                                //add some double click callback here to trigger video upload
                                                return false;
                                            }
                                        });
                                    });
                                    //upload requested files
                                    $.each(result.data.file, function(i, oshash) {
                                        app.local.uploadFile(oshash);
                                    });
                                };
                                if (result.data.info.length>0) {
                                    var post = {'info': {}};
                                    $.each(result.data.info, function(i, oshash) {
                                        if(fileInfo[oshash]) {
                                            post.info[oshash] = fileInfo[oshash];
                                        }
                                    });
                                    app.api.update(post, function(result) {
                                        parseResult(result);
                                    });
                                } else {
                                    parseResult(result);
                                }

                            });
                            var data = {
                                items: []
                            }
                            var folder_ids = {};
                            var folders = {};
                            $.each(result.files, function(i, file) {
                                var f = app.local.parsePath(file.path);
                                if(!folders[f.folder]) {
                                    folders[f.folder] = {
                                        id: file.oshash,
                                        path: f.folder,
                                        files: 0,
                                        status:'ok',
                                        ids: []
                                    };
                                    folder_ids[file.oshash] = [];
                                }
                                folders[f.folder].files++;
                                folder_ids[folders[f.folder].id].push(file.oshash);
                            });
                            var j = 1;
                            $.each(folders, function(i, folder) {
                                data.items.push(folder);
                            });
                            r = {
                                data: data,
                            }
                            Ox.print(r);
                            callback(r);

                        });
                    }
                },
                sort: [
                    {
                        key: "path",
                        operator: "+"
                    }
                ]
            });
            app.$ui.contentPanel.replace(1, $list);
        },
        absolute_url: function (url) {
            var base = document.location.href;
            if (url.substring(0, 1) == '/') {
                base = document.location.protocol + '//' + document.location.hostname;
                if(document.location.port) base += ':'+document.location.port
                url = base + url;
            }
            else {
                if(base.substring(base.length-1) == '/')
                    url = base + url;
                else
                    url = base + '/' + url;
            }
            return url;
        },
    };
    app.local.loadVolumes();
});
