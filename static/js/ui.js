$(function() {
    Ox.initLoading();
    oxdb = {};

    var user = {
        username: "",
        group: "guest", // guest / user / vip / admin
        prefs: {
            find: "all",
            groupMovies: "country",
            orderMovies: "ascending",
            orderGroups: "descending",
            showGroups: true,
            showInfo: true,
            showMovies: true,
            showSidebar: true,
            sortMovies: "director",
            sortGroups: "items",
            useOxdbPosters: false,
            useGroups: true,
            viewMovies: "list",
            viewIcons: "poster",
        }
    }

    Ox.Location.set("find", {
        s: user.prefs.sortMovies,
        o: user.prefs.orderMovies
    })

    var $body = $("body");
    var aspectRatio = 4 / 3;

    var foo = {
        id: "foo",
        title: ["Show Window", "Hide Window"],
        disabled: true,
        checked: false,
        group: "foo",
        shortcut: "ALT ESCAPE", // $(this).bind("OxKeyboardAltEscape", function() { $(this).trigger("click"); })
        click: function() {
            
        },
        bind: [
            ["OxUserLogin", function(e) {
                $(this).setTitle("User:" + e.user)
            }],
            ["OxResizeWindow", function() {
                $(this).toggleChecked();
                $(this).toggleDisabled();
                $(this).toggleTitle();
            }]
        ],
        trigger: true // $("*").trigger("OxMenuUserLogin") // or trigger({ "type: OxMenuGroupname", item: Item })
    }

    var m = [
        ["oxdb", "0xdb", [
            ["about", "About 0xdb", {
                click: loadPage
            }],
            [],
            ["faq", "Frequently Asked Questions", {
                click: loadPage
            }],
            ["tos", "Terms of Service", {
                click: loadPage
            }],
            ["sas", "Security Advisory System", {
                click: loadPage
            }],
            [],
            ["contact", "Contact", {
                click: loadPage
            }],
            [],
            ["technology", "Technology", {
                click: loadPage
            }],
            ["source", "Source Code", {
                click: loadPage
            }],
            ["report", "Report a Bug...", {
                click: loadPage
            }]
        ]],
        ["user", "User", [
            ["user", "User: not logged in", {
                disabled: true,
                bind: [
                    ["OxLogin", function() {
                        $(this).setTitle("User: " + e.username)
                    }],
                    ["OxLogout", function() {
                        $(this).toggleTitle();
                    }]
                ]
            }],
            [],
            ["account", "Account", {
                disabled: true,
                click: loadPage
            }],
            ["preferences", "Preferences", {
                disabled: true,
                shortcut: "CONTROL ,",
                click: loadPage
            }],
            [],
            ["login", ["Login", "Logout"], {
                click: loadDialog,
                bind: [
                    ["OxLogin", function() {
                        $(this).toggleTitle();
                    }],
                    ["OxLogout", function() {
                        $(this).toggleTitle();
                    }]
                ]
            }]
        ]],
        ["list", "List", [
            ["history", "History", [
                ["All Movies", "All Movies", {}]
            ]],
            ["viewFilter", "View Filter", [
                ["Most Viewed", "Most Viewed", {}],
                ["Recently Viewed", "Recently Viewed", {}]
            ]],
            ["viewList", "View List", [
                ["Favorites", "Favorites", {}]
            ]],
            ["viewFeature", "View Feature", [
                ["Situationist Film", "Situationist Film", {}],
                ["Timelines", "Timelines", {}],
            ]],
            [],
            ["newList", "New List...", {
                disabled: true,
                shortcut: "CONTROL N",
                click: loadDialog
            }],
            ["newListFromSelection", "New List from Selection...", {
                disabled: true,
                shortcut: "SHIFT CONTROL N",
                click: loadDialog
            }],
            ["newFilter", "New Filter...", {
                disabled: true,
                shortcut: "ALT CONTROL N",
                click: loadDialog
            }],
            [],
            ["add", "Add Selected Movie to List...", {
                disabled: true
            }],
            [],
            ["set", "Set Poster Frame", {
                disabled: true
            }]
        ]],
        ["edit", "Edit", [
            ["undo", "Undo", {
                disabled: true,
                shortcut: "CONTROL Z"
            }],
            ["redo", "Redo", {
                disabled: true,
                shortcut: "SHIFT CONTROL Z"
            }],
            [],
            ["cut", "Cut", {
                disabled: true,
                shortcut: "CONTROL X"
            }],
            ["copy", "Copy", {
                disabled: true,
                shortcut: "CONTROL C"
            }],
            ["paste", "Paste", {
                disabled: true,
                shortcut: "CONTROL V"
            }],
            ["delete", "Delete", {
                disabled: true,
                shortcut: "DELETE"
            }],
            [],
            ["all", "Select All", {
                disabled: true,
                shortcut: "CONTROL A"
            }],
            ["none", "Select None", {
                disabled: true,
                shortcut: "SHIFT CONTROL A"
            }],
            ["invert", "Invert Selection", {
                disabled: true,
                shortcut: "ALT CONTROL A"
            }],
        ]],
        ["view", "View", [
            ["movies", "View Movies", getMenuGroupItems("viewMovies", [
                "as List",
                "as Icons",
                "with Clips",
                "with Timelines",
                "with Maps",
                "",
                "as Scenes",
                "on Map",
                "on Calendar"
            ])],
            ["icons", "Icons", getMenuGroupItems("viewIcons", [
                "Poster",
                "Still",
                "Timeline"
            ])],
            ["info", "Info", getMenuGroupItems("viewInfo", [
                "Poster",
                "Video"
            ])],
            [],
            ["open", "Open Movie", [
                ["info", "Info", {
                    shortcut: "CONTROL RETURN"
                }],
                ["poster", "Statistics", {}],
                ["scenes", "Clips", {}],
                ["editor", "Timeline", {}],
                ["map", "Map", {}],
                ["calendar", "Calendar", {}],
                [],
                ["files", "Files", {}]
            ]],
            ["preview", "Preview", { shortcut: "CONTROL SPACE" }],
            [],
            ["toggleSidebar", ["Hide Sidebar", "Show Sidebar"], {
                shortcut: "SHIFT S"
            }],
            ["toggleInfo", ["Hide Info", "Show Info"], {
                shortcut: "SHIFT I"
            }],
            ["toggleGroups", ["Hide Groups", "Show Groups"], {
                shortcut: "SHIFT G"
            }],
            ["toggleMovies", ["Hide Movies", "show Movies"], {
                disabled: true,
                shortcut: "SHIFT M"
            }],
        ]],
        ["sort", "Sort", [
            ["sortMovies", "Sort Movies by", getMenuGroupItems("sortMovies", [
                "Title",
                "Director",
                "Country",
                "Year",
                "Runtime",
                "Language",
                "Writer",
                "Producer",
                "Cinematographer",
                "Editor",
                "Cast",
                "Genre",
                "Keywords",
                "Release Date",
                "Budget",
                "Gross",
                "Profit",
                "Rating",
                "Votes",
                "Connections",
                "Locations",
                "ID",
                "",
                "Aspect Ratio",
                "Duration",
                "Color",
                "Saturation",
                "Brightness",
                "Volume",
                "Clips",
                "Cuts",
                "Cuts per Minute",
                "Words",
                "Words per Minute",
                "",
                "Resolution",
                "Pixels",
                "Size",
                "Bitrate",
                "Files",
                "Filename",
                "Date Published",
                "Date Modified"
            ])],
            ["orderMovies", "Order Movies", getMenuGroupItems("orderMovies", [
                "Ascending",
                "Descending"
            ])],
            [],
            ["groups", "Use Groups", {
                checked: true
            }],
            ["groupMovies", "Group Movies by", getMenuGroupItems("groupMovies", [
                "Director",
                "Country",
                "Year",
                "Language",
                "Genre"
            ])],
            ["sortGroups", "Sort Groups by", getMenuGroupItems("sortGroups", [
                "Name",
                "Number of Movies"
            ])],
            ["orderGroups", "Order Groups", getMenuGroupItems("orderGroups", [
                "Ascending",
                "Descending"
            ])]
        ]],
        ["find", "Find", [
            ["find", "Find", getMenuGroupItems("find", [
                "All",
                "Title",
                "Director",
                "Country",
                "Year",
                "Language",
                "Writer",
                "Producer",
                "Cinematographer",
                "Editor",
                "Cast",
                "Name",
                "Genre",
                "Keyword",
                "Summary",
                "Trivia",
                "Dialog"
            ])],
            [],
            ["advanced", "Advanced Find...", {}]
        ]],
        ["help", "Help", [
            ["help", "0xdb Help", {
                shortcut: "SHIFT ?"
            }]
        ]]
    ];

    function getMenuGroupItems(group, titles) {
        var items = [];
        $.each(titles, function(i, v) {
            if (v) {
                //v.replace(/(^[as|on] )/, "");
                var id = v.replace("as ", "").replace("with ", "").replace(" of Movies", "").replace(" ", "").toLowerCase();
                items.push([id, v, {
                    group: group,
                    checked: user.prefs[group] == id,
                    bind: [group, function(e) {
                        if (e.sort == id) {
                            Ox.topMenu.toggleChecked("sort/" + group + "/" + id);
                        }
                    }]
                }]);
            } else {
                items.push([]);
            }
        });
        if (group == "viewMovies") {
            items.push([]),
            items.push(["rss", "RSS", {}]);
            items.push(["json", "JSON", {}]);
        }
        if (group == "viewIcons") {
            items.push([]);
            items.push(["oxdb", "Always Use 0xdb Posters", {
                group: "oxdbPosters",
                checked: false
            }]);
        }
        return items;
    }

    var menus = [
        ["list", "List", [
            ["foo", "Foo", { checked: true, shortcut: "ALT ESCAPE" }, function() {}],
            ["view", "View List", getMenuItemsC()],
            ["more", "View More", getMenuItemsL()],
            [],
            ["createList", "New List...", { disabled: true, shortcut: "CONTROL N" }, function() { loadDialog("createList"); }],
            ["createListFromSelection", "New List from Selection...", { disabled: true, shortcut: "SHIFT CONTROL N" }, function() { loadDialog("createListFromSelection"); }],
            ["createSmartList", "New Filter...", { disabled: true, shortcut: "ALT CONTROL N"}, function() { loadDialog("createList"); }],
            [],
            ["add", "Add Movie to List", { disabled: false }, function() {}],
            ["remove", "Remove Movie from List", { disabled: true }, function() {}]
        ]],
        ["edit", "Edit", [
            ["undo", "Undo", { shortcut: "CONTROL Z" }, function() {}],
            ["redo", "Redo", { shortcut: "SHIFT CONTROL Z" }, function() {}],
            [],
            ["cut", "Cut", { shortcut: "CONTROL X" }, function() {}],
            ["copy", "Copy", { shortcut: "CONTROL C" }, function() {}],
            ["paste", "Paste", { shortcut: "CONTROL V" }, function() {}],
            ["delete", "Delete", { shortcut: "DELETE" }, function() {}],
            [],
            ["all", "Select All", { shortcut: "CONTROL A" }, function() {}],
            ["none", "Select None", { shortcut: "SHIFT CONTROL A" }, function() {}],
            ["invert", "Invert Selection", { shortcut: "ALT CONTROL A" }, function() {}],
        ]],
        ["view", "View", [
            ["view", "View Movies", [
                ["viewList", "as List", function() { setPref("view", "list"); }],
                ["viewGrid", "as Grid", { checked: true }, function() { setPref("view", "grid"); }],
                ["viewScenes", "as Scenes", function() { setPref("view", "scenes"); }],
                ["viewTimelines", "as Timelines", function() { setPref("view", "timelines"); }],
                ["viewMaps", "as Maps", function() { setPref("view", "maps"); }],
                [],
                ["map", "on Map", function() {}],
                ["calendar", "on Calendar", function() {}],
                [],
                ["viewRSS", "RSS", function() { setPref("view", "maps"); }],
                ["viewJSON", "JSON", function() { setPref("view", "maps"); }],
                [],
                ["foobar", "foobar", [
                    ["foo", "foo", function() { setPref("view", "maps"); }],
                    ["bar", "bar", function() { setPref("view", "maps"); }]
                ]]
            ]],
            ["icons", "Icons", [
                ["posters", "Posters", { checked: true }, function() {}],
                ["stills", "Stills", function() {}],
                ["timelines", "Timelines", function() {}],
                [],
                ["oxdb", "Always Use 0xdb Posters", function() {}],
            ]],
            [],
            ["open", "Open Movie", [
                ["info", "Info", { shortcut: "CONTROL RETURN" }, function() {}],
                ["poster", "Poster", function() {}],
                ["scenes", "Scenes", function() {}],
                ["editor", "Editor", function() {}],
                ["map", "Map", function() {}],
                ["calendar", "Calendar", function() {}]
            ]],
            ["preview", "Preview Movie", { shortcut: "CONTROL SPACE" }, function() {}],
            [],
            ["lists", "Hide Lists", { shortcut: "SHIFT L" }, function() { $("#sideView").parent().next().trigger("dblclick"); $topMenu.toggleTitle("view/lists", ["Hide Lists", "Show Lists"]) }],
            ["stills", "Hide Scenes", { shortcut: "SHIFT S" }, function() {} ],
            ["groups", "Hide Groups", { shortcut: "SHIFT G" }, function() {}],
            ["movies", "Hide Movies", { disabled: true, shortcut: "SHIFT M" }, function() {}],
        ]],
        ["sort", "Sort", [
            ["sort", "Sort Movies by", [
                ["id", "ID", { group: "sort", checked: true }, function() { setPref("sort", "id"); }],
                ["title", "Title", { group: "sort" }, function() { setPref("sort", "title"); }],
                ["director", "Director", { group: "sort" }, function() { setPref("sort", "director"); }],
                ["country", "Country", { group: "sort" }, function() { setPref("sort", "country"); }],
                ["year", "Year", { group: "sort" }, function() { setPref("sort", "year"); }],
                ["language", "Language", { group: "sort" }, function() { setPref("sort", "language"); }],
                ["runtime", "Runtime", { group: "sort" }, function() { setPref("sort", "runtime"); }],
                ["producer", "Producer", { group: "sort" }, function() { setPref("sort", "producer"); }],
                ["writer", "Writer", { group: "sort" }, function() { setPref("sort", "writer"); }],
                ["cinematographer", "Cinematographer", { group: "sort" }, function() { setPref("sort", "cinematographer"); }],
                ["editor", "Editor", { group: "sort" }, function() { setPref("sort", "editor"); }],
                ["genre", "Genre", { group: "sort" }, function() { setPref("sort", "genre"); }],
                ["releasedate", "Release Date", { group: "sort" }, function() { setPref("sort", "releasedate"); }],
                ["rating", "Rating", { group: "sort" }, function() { setPref("sort", "rating"); }],
                ["votes", "Votes", { group: "sort" }, function() { setPref("sort", "votes"); }]
            ]],
            ["order", "Order Movies", [
                ["ascending", "Ascending", { group: "order", checked: true }, function() { setPref("order", "ascending"); }],
                ["descending", "Descending", { group: "order" }, function() { setPref("order", "descending"); }]
            ]],
            [],
            ["groups", "Use Groups", { checked: true }, function() {}],
            ["group", "Group Movies by", [
                ["title", "Title", function() { setPref("group", "title"); }],
                ["director", "Director", { checked: true }, function() { setPref("group", "director"); }],
                ["country", "Country", function() { setPref("group", "country"); }],
                ["year", "Year", function() { setPref("group", "year"); }]
            ]],
            ["sortGroups", "Sort Groups by", [
                ["name", "Name", { checked: true }, function() { setPref("sortGroups", "name"); }],
                ["movies", "Number of Movies", function() { setPref("sortGroups", "movies"); }]
            ]],
            ["orderGroups", "Order Groups", [
                ["ascending", "Ascending", { checked: true }, function() { setPref("orderGroups", "ascending"); }],
                ["descending", "Descending", function() { setPref("orderGroups", "descending"); }]
            ]]
        ]],
        ["find", "Find", [
            ["find", "Find", [
                ["all", "All", { checked: true }, function() {}],
                ["title", "Title", function() { setPref("find", "title"); }],
                ["director", "Director", function() { setPref("find", "director"); }],
                ["country", "Country", function() { setPref("find", "country"); }],
                ["year", "Year", function() { setPref("find", "year"); }],
                ["language", "Language", function() { setPref("find", "language"); }],
                ["producer", "Producer", function() { setPref("find", "producer"); }],
                ["writer", "Writer", function() { setPref("find", "writer"); }],
                ["cinematographer", "Cinematographer", function() { setPref("find", "cinematographer"); }],
                ["editor", "Editor", function() { setPref("find", "editor"); }],
                ["cast", "Cast", function() { setPref("find", "cast"); }],
                ["name", "Name", function() { setPref("find", "name"); }],
                ["genre", "Name", function() { setPref("find", "genre"); }],
                ["keywords", "Keywords", function() { setPref("find", "keywords"); }],
            ]],
            [],
            ["advanced", "Advanced Find", function() {}]
        ]],
        ["help", "Help", [
            ["help", "0xdb Help", { shortcut: "SHIFT ?" }, function() {}]
        ]],
        ["test", "Test", [
            ["me", "Check Me", function() { $topMenu.toggleChecked("test/me"); }],
            ["disable", "Disable It", function() { $topMenu.toggleDisabled("test/me"); $topMenu.toggleTitle("test/disable", ["Disable It", "Enable It"]); }],
            ["them", "Check Them", [
                ["me", "Check Me", { checked: true, group: "them" }, function() { $topMenu.checkItem("test/them/me"); }],
                ["her", "Check Her", { group: "them" }, function() { $topMenu.checkItem("test/them/her"); }],
                ["him", "Check Him", { group: "them" }, function() { $topMenu.checkItem("test/them/him"); }],
                [],
                ["disable", "Disable Them", function() { $topMenu.toggleDisabled("test/them/me"); $topMenu.toggleDisabled("test/them/her"); $topMenu.toggleDisabled("test/them/him"); $topMenu.toggleTitle("test/them/disable", ["Disable Them", "Enable Them"]); }]
            ]],
            ["1", "1"],
            ["2", "2"],
            ["3", "3"],
            ["4", "4"],
            ["5", "5"],
            ["6", "6"],
            ["7", "7"],
            ["8", "8"],
            ["9", "9"],
            ["10", "10"],
            ["11", "11"],
            ["12", "12"],
            [],
            ["add", "Add Item", function() { $topMenu.insertItemAfter("test/12", ["13", "13"]); $topMenu.toggleDisabled("test/add"); $topMenu.toggleDisabled("test/remove"); }],
            ["remove", "Remove Item", { disabled: true }, function() { $topMenu.removeItem("test/13"); $topMenu.toggleDisabled("test/add"); $topMenu.toggleDisabled("test/remove"); }],
        ]]
    ];

    function getMenuItemsC() {
        var items = [];
        var countries = Ox.getCountries();
        $.each(countries, function(i, v) {
            items.push([v.code, v.name, { icon: Ox.baseUrl + "png/flags/" + v.flag + ".png" }, function() {}]);            
        });
        return items;
    }
    function getMenuItemsL() {
        var items = [];
        var languages = Ox.getLanguages();
        $.each(languages, function(i, v) {
            items.push([v.code, v.name, { icon: Ox.baseUrl + "png/flags/" + v.flag + ".png" }, function() {}]);            
        });
        return items;
    }

    function getBrowserItems() {
        var items = [];
        var groups = [{"items": 3093, "title": "United States"}, {"items": 1142, "title": "France"}, {"items": 688, "title": "Germany"}, {"items": 548, "title": "United Kingdom"}, {"items": 296, "title": "Italy"}, {"items": 285, "title": "Japan"}, {"items": 253, "title": "Canada"}, {"items": 94, "title": "Austria"}, {"items": 88, "title": "Spain"}, {"items": 88, "title": "Switzerland"}, {"items": 79, "title": "Soviet Union"}, {"items": 75, "title": "Belgium"}, {"items": 72, "title": "Netherlands"}, {"items": 72, "title": "Sweden"}, {"items": 69, "title": "Unknown"}, {"items": 61, "title": "Poland"}, {"items": 52, "title": "Hong Kong"}, {"items": 50, "title": "Denmark"}, {"items": 46, "title": "Australia"}, {"items": 42, "title": "China"}, {"items": 42, "title": "India"}, {"items": 39, "title": "Finland"}, {"items": 38, "title": "South Korea"}, {"items": 36, "title": "Iran"}, {"items": 36, "title": "Russia"}, {"items": 34, "title": "Mexico"}, {"items": 34, "title": "Taiwan"}, {"items": 30, "title": "Ireland"}, {"items": 28, "title": "Portugal"}, {"items": 27, "title": "Cuba"}, {"items": 27, "title": "Yugoslavia"}, {"items": 26, "title": "Norway"}, {"items": 24, "title": "Argentina"}, {"items": 24, "title": "Brazil"}, {"items": 16, "title": "Czechoslovakia"}, {"items": 16, "title": "Luxembourg"}, {"items": 15, "title": "Thailand"}, {"items": 12, "title": "Chile"}, {"items": 12, "title": "Czech Republic"}, {"items": 11, "title": "Hungary"}, {"items": 10, "title": "Senegal"}, {"items": 9, "title": "Israel"}, {"items": 8, "title": "Greece"}, {"items": 7, "title": "Tunisia"}, {"items": 7, "title": "Turkey"}, {"items": 6, "title": "East Germany"}, {"items": 6, "title": "Egypt"}, {"items": 5, "title": "Algeria"}, {"items": 5, "title": "Burkina Faso"}, {"items": 4, "title": "Cameroon"}, {"items": 4, "title": "South Africa"}, {"items": 3, "title": "Bolivia"}, {"items": 3, "title": "Morocco"}, {"items": 3, "title": "Peru"}, {"items": 3, "title": "Philippines"}, {"items": 3, "title": "Romania"}, {"items": 3, "title": "Slovenia"}, {"items": 3, "title": "Ukraine"}, {"items": 3, "title": "Venezuela"}, {"items": 2, "title": "Armenia"}, {"items": 2, "title": "Bosnia and Herzegovina"}, {"items": 2, "title": "Croatia"}, {"items": 2, "title": "Estonia"}, {"items": 2, "title": "Iceland"}, {"items": 2, "title": "Jamaica"}, {"items": 2, "title": "Kazakhstan"}, {"items": 2, "title": "Lebanon"}, {"items": 2, "title": "Liechtenstein"}, {"items": 2, "title": "Lithuania"}, {"items": 2, "title": "Malaysia"}, {"items": 2, "title": "New Zealand"}, {"items": 2, "title": "Serbia"}, {"items": 2, "title": "Singapore"}, {"items": 2, "title": "Sri Lanka"}, {"items": 2, "title": "Vietnam"}, {"items": 1, "title": "Afghanistan"}, {"items": 1, "title": "Bangladesh"}, {"items": 1, "title": "Belarus"}, {"items": 1, "title": "Botswana"}, {"items": 1, "title": "Bulgaria"}, {"items": 1, "title": "Chad"}, {"items": 1, "title": "Colombia"}, {"items": 1, "title": "Congo"}, {"items": 1, "title": "Ecuador"}, {"items": 1, "title": "Indonesia"}, {"items": 1, "title": "Iraq"}, {"items": 1, "title": "Kenya"}, {"items": 1, "title": "Macau"}, {"items": 1, "title": "Madagascar"}, {"items": 1, "title": "Mali"}, {"items": 1, "title": "Niger"}, {"items": 1, "title": "Palestine"}, {"items": 1, "title": "Puerto Rico"}, {"items": 1, "title": "Serbia and Montenegro"}, {"items": 1, "title": "Slovakia"}, {"items": 1, "title": "Syria"}, {"items": 1, "title": "Tajikistan"}, {"items": 1, "title": "Uruguay"}, {"items": 1, "title": "Yemen"}];
        $.each(groups, function(i, v) {
            var code = Ox.getCountryCode(v.title.replace("Unknown", "Neutral Zone"));
            var flag = Ox.getFlag(v.title.replace("Unknown", "Neutral Zone"));
            var strings = v.title.split(" ");
            items.push({
                size: 64,
                id: code,
                icon: "http://oil21.org/tmp/flags/" + flag + ".png",
                title: strings[0] + (strings.length > 1 ? "<br/>" + strings[1] : ""),
                info: Ox.formatNumber(v.items) + " Movie" + (v.items > 1 ? "s" : "")
            });
        });
        return items;
    }

    /*

    $element = new Ox.Container().css({
        width: "256px",
        height: "256px",
        background: "red"
    }).click(function() {
        Ox.print("click");
    }).html("foo").appendTo($body);

    $bar = new Ox.Bar({
        orientation: "horizontal",
        height: 16
    }).appendTo($body);

    */

    var $sideBrowserPlayer = $("<div/>")
        .attr({
            id: "sideBrowserPlayer"
        }).css({
            width: "100%",
            height: "100%"
        }).append(
            $("<img/>").attr({
                src: '/static/png/frame.png'
            }).css({
                width: "100%",
                height: "100%"
            }).click(function() {
                var maxWidth = $(document).width(),
                    maxHeight = $(document).height() - 96,
                    width = Math.min($(this).data("width"), maxWidth),
                    height = width * $(this).data("height") / $(this).data("width");
                if (height > maxHeight) {
                    width *= maxHeight / height;
                    height = maxHeight;
                }
                oxdb.$dialog = new Ox.Dialog({
                    title: "Foo",
                    buttons: [
                        new Ox.Button()
                            .val("Close")
                            .click(function() {
                                oxdb.$dialog.close();
                            })
                    ],
                    width: width,
                    height: height
                }).append(
                    $("<img/>")
                        .attr({
                            src: $(this).attr("src")
                        })
                        .css({
                            display: "block",
                            width: width + "px",
                            height: height + "px"
                        })
                ).open();
            })
        );

    var $sideBrowser = new Ox.Element().css({
        width: "100%",
        height: "100%"
    }).attr({
        id: "sideBrowser" // remove this later
    }).append($sideBrowserPlayer);

    var $sideBar = new Ox.Container();

    var $historyPanel = new Ox.Panel({
        title: "History"
    }).appendTo($sideBar.$content);
    for (var i = 0; i < 10; i++) {
        $historyPanel.append("Item #" + (i + 1) + "<br/>")
    }
    //$("<br/>").appendTo($sideBar.$content);
    var $filtersPanel = new Ox.Panel({
        title: "Filters"
    }).appendTo($sideBar.$content);
    for (var i = 0; i < 10; i++) {
        $filtersPanel.append("Item #" + (i + 1) + "<br/>")
    }
    var $listsPanel = new Ox.Panel({
        title: "Lists"
    }).appendTo($sideBar.$content);
    for (var i = 0; i < 10; i++) {
        $listsPanel.append("Item #" + (i + 1) + "<br/>")
    }
    var $featuresPanel = new Ox.Panel({
        title: "Features"
    }).appendTo($sideBar.$content);
    for (var i = 0; i < 10; i++) {
        $featuresPanel.append("Item #" + (i + 1) + "<br/>")
    }

    oxdb.$sideView = new Ox.SplitView({
        orientation: "vertical",
        elements: [
            {
                element: $sideBar
            },
            {
                element: $sideBrowser,
                size: 145,
                resizable: true
            }
        ]
    }).attr({
        id: "sideView"
    });


    /*
    var $main = new Ox.Container();
    var $mainBar = new Ox.Bar({
        orientation: "horizontal",
        size: 16
    });
    var $mainBrowser = new Ox.IconList({
        size: 64,
        items: getBrowserItems()
    });


    var $mainView = new Ox.SplitView({
        orientation: "vertical",
        elements: [
            {
                element: $mainBrowser,
                size: 132,
                resizable: true
            },
            {
                element: $mainBar,
                size: 16
            },
            {
                element: $main
            }
        ]
    });
    */

    var $mainBrowser = new Ox.IconList({
        size: 64,
        sort: user.prefs.sortGroups,
        order: user.prefs.orderGroups,
        url: "/json/find",
        params: ["g=country"]
    }).attr({
        id: "groups"
    });
    var $main = new Ox.Table({
        list: "movies",
        columns: [
            {
                id: "id",
                title: "ID",
                order: "ascending",
                width: 60,
                align: "left",
                checked: true
            },
            {
                id: "title",
                title: "Title",
                order: "ascending",
                width: 240,
                align: "left",
                checked: true
            },
            {
                id: "director",
                title: "Director",
                order: "ascending",
                width: 180,
                align: "left",
                checked: true
            },
            {
                id: "country",
                title: "Country",
                order: "ascending",
                width: 120,
                align: "left",
                checked: true
            },
            {
                id: "year",
                title: "Year",
                order: "descending",
                width: 40,
                align: "right",
                checked: true
            },
            {
                id: "runtime",
                title: "Runtime",
                order: "descending",
                width: 60,
                align: "right",
                checked: true
            },
            {
                id: "language",
                title: "Language",
                order: "ascending",
                width: 120,
                align: "left",
                checked: true
            },
            {
                id: "genre",
                title: "Genre",
                order: "ascending",
                width: 120,
                align: "left",
                checked: true
            },
            {
                id: "rating",
                title: "Rating",
                order: "descending",
                width: 60,
                align: "right",
                checked: true
            },
            {
                id: "votes",
                title: "Votes",
                order: "descending",
                width: 60,
                align: "right",
                checked: true
            }
        ],
        sort: user.prefs.sortMovies,
        order: user.prefs.orderMovies,
        url: "/json/find",
        select: selectItem
    });

    // these should go with their respective Ox Objects
    Ox.Event.bind("menu", function(data) {
        if (data.menu == "topmenu" && Ox.startsWith(data.item, "sort/sortMovies/")) {
            var sort = data.item.split("/").pop();
            Ox.Location.set({
                s: sort
            });
            $main.$body.sort(sort);
        }
        if (data.menu == "topmenu" && Ox.startsWith(data.item, "sort/orderMovies/")) {
            var order = data.item.split("/").pop();
            Ox.Location.set({
                o: order
            });
            $main.$body.order(order);
        }
        if (data.menu == "topmenu" && data.item == "view/toggleSidebar") {
            oxdb.$sideView.toggle();
            $topMenu.toggleDisabled("view/toggleInfo");
        }
        if (data.menu == "topmenu" && data.item == "view/toggleInfo") {
            $sideBrowser.toggle();
        }
        if (data.menu == "topmenu" && data.item == "view/toggleGroups") {
            $mainBrowser.toggle();
        }
        if (data.menu == "topmenu" && Ox.startsWith(data.item, "find/find/")) {
            var find = data.item.split("/").pop();
            $find.setPlaceholder("Find: " + Ox.toTitleCase(find));
        }
        if (data.menu == "topmenu" && data.item == "help/help") {
            oxdb.$dialog = new Ox.Dialog({
                title: "0xdb Help",
                buttons: [
                    new Ox.Button()
                        .val("Close")
                        .click(function() {
                            oxdb.$dialog.close();
                        })
                ],
                width: $(document).width() / 2,
                height: ($(document).height() / 2) - 48
            }).append(
                new Ox.Element().html(Ox.repeat("Foo<br/>", 100))
            ).open();
        }
    });

    var $mainView = new Ox.SplitView({
        orientation: "vertical",
        elements: [
            {
                element: $mainBrowser,
                size: 132,
                resizable: true
            },
            {
                element: $main
            }
        ]
    });

    var $middleView = new Ox.SplitView({
        orientation: "horizontal",
        elements: [
            {
                element: oxdb.$sideView,
                size: 192,
                resizable: [128, 192, 256],
                resize: resizePlayer
            },
            {
                element: $mainView
            }
        ]
    });

    function resizePlayer(width) {
        var height = Math.round((width - 4) / aspectRatio + 4);
        //Ox.print(width, height);
        $sideBar.css({
            bottom: height + "px"
        });
        $sideBrowser.$element.parent().parent().css({
            height: height + "px"
        });
        if (oxdb.$sideView.$element.css("bottom") != "0px") {
            oxdb.$sideView.css({
                bottom: (4 - height) + "px"
            })
        }
    }

    function selectItem(item) {
        var url = "http://0xdb.org/" + item.id + "/still.jpg";
        var img = $("<img/>").attr({
            src: url
        }).load(function() {
            var img = new Image();
            img.src = url;
            aspectRatio = img.width / img.height;
            var width = $sideBrowser.$element.width() + 4;
            resizePlayer(width);
            $sideBrowserPlayer.children().eq(0).attr({
                src: url
            }).data("width", img.width).data("height", img.height);
        })
    }

    var $topMenu = new Ox.MenuBar({
        id: "topmenu",
        size: "large",
        menus: m
    });

    var b = [
        ["login", function(data) {
            Ox.print("username:", data.username, "this:", this);
            $topMenu.toggleChecked("user/login");
        }],
        ["sort", function(data) {
            if (data.list == "movies") {
                $topMenu.checkItem("sort/sortMovies/" + data.sort);
                $topMenu.checkItem("sort/orderMovies/" + data.order);
            }
        }],
        ["order", function(data) {
            if (data.list == "movies") {
                $topMenu.checkItem("sort/orderMovies/" + data.order);
            }
        }],
        ["toggle", function(data) {
            if (data.id == "sideView") {
                $topMenu.toggleTitle("view/toggleSidebar");
                $topMenu.toggleDisabled("view/toggleInfo");
            } else if (data.id == "sideBrowser") {
                $topMenu.toggleTitle("view/toggleInfo");
            } else if (data.id == "groups") {
                $topMenu.toggleTitle("view/toggleGroups");
            }
        }],
        ["space", function(data) {
            var height = $(document).height() - 96,
                width = height * 5/8;
            oxdb.$dialog = new Ox.Dialog({
                title: data.items[0].title,
                buttons: [
                    new Ox.Button()
                        .val("Close")
                        .click(function() {
                            oxdb.$dialog.close();
                        })
                ],
                width: width,
                height: height
            }).append(
                $("<img/>").attr({
                    src: "http://0xdb.org/" + data.items[0].id + "/poster.large.jpg"
                }).css({
                    display: "block",
                    width: width + "px",
                    height: height + "px"
                })
            ).open();
        }]
    ];

    $.each(b, function(i, v) {
        Ox.Event.bind(v[0], function(data) {
            v[1](data);
        });
    });

    var $statusBar = new Ox.Bar({
        orientation: "horizontal",
        size: 24
    }).attr({
        id: "statusBar"
    });

    var loadingInterval;
    $loading = $("<img/>").attr({
        id: "loading",
        src: Ox.baseUrl + "png/themes/ox/loading0.png"
    }).ajaxStart(function() {
        Ox.print("start")
        $(this).attr({
            src: Ox.baseUrl + "png/themes/ox/loading0.png"
        });
        $(this).show();
        var loadingStep = 1;
        loadingInterval = setInterval(function() {
            $loading.attr({
                src: Ox.baseUrl + "png/themes/ox/loading" + (loadingStep % 12) + ".png"
            });
            loadingStep++;
        }, 83);
        /*
        $("body").css({
            cursor: "wait"
        });
        */
    }).ajaxStop(function() {
        Ox.print("stop")
        clearInterval(loadingInterval);
        $(this).hide();
        /*
        $("body").css({
            cursor: "default"
        });
        */
    }).appendTo($topMenu.$element).trigger("ajaxStart");

    var $view = new Ox.SplitView({
        orientation: "vertical",
        elements: [
            {
                element: $topMenu,
                size: 24
            },
            {
                element: $middleView
            },
            {
                element: $statusBar,
                size: 24
            }
        ]
    }).appendTo($body);

    /*
    for (var i = 0; i < 100; i++) {
        $main.$container.append("Item #" + (i + 1) + "<br/>");
    }
    */

    $find = new Ox.Input({
        placeholder: "Find: All"
    }).attr({
        id: "find"
    }).appendTo($topMenu.$element).trigger("blur");

    /*
    $find = $("<input/>")
        .attr({
            id: "find",
            type: "text",
            placeholder: "Find: All"
        })
        .focus(function() {
            if ($(this).hasClass("OxPlaceholder")) {
                $(this)
                    .val("")
                    .removeClass("OxPlaceholder");
            }
        })
        .blur(function() {
            if ($(this).val() === "") {
                $(this)
                    .addClass("OxPlaceholder")
                    .val($(this).attr("placeholder"));
            }
        })
        .appendTo($topMenu.$element)
        .trigger("blur");

    function focusFind() {
        Ox.print("!!!")
        $find.focus();
        $find.select();
    }

    var keyboard = Ox.KeyboardController.setup({
        "CONTROL F": focusFind
    }, true);
    Ox.KeyboardController.enable(keyboard);
    */

    //Ox.print($topMenu);



    function loadDialog() {}
    function loadPage() {}
    function setPref(key, value) {
        if (key == "sort") {
            $topMenu.checkItem("sort/sort/" + value);
        }
    }

    $("<select/>").css({
        position: "absolute",
        right: "4px",
        bottom: "4px",
    }).append(
        $("<option/>").val("foo").html("Foo")
    ).append(
        $("<option/>").val("bar").html("Bar")
    ).append(
        $("<option/>").val("bar").html($main.$body.width())
    ).appendTo($statusBar.$element);


});
