
const getSortValue = function(value) {
    var sortValue = value;
    function trim(value) {
        return value.replace(/^\W+(?=\w)/, '');
    }
    if (
        isEmpty(value)
        || isNull(value)
        || isUndefined(value)
    ) {
        sortValue = null;
    } else if (isString(value)) {
        // make lowercase and remove leading non-word characters
        sortValue = trim(value.toLowerCase());
        // move leading articles to the end
        // and remove leading non-word characters
        ['a', 'an', 'the'].forEach(function(article) {
            if (new RegExp('^' + article + ' ').test(sortValue)) {
                sortValue = trim(sortValue.slice(article.length + 1))
                    + ', ' + sortValue.slice(0, article.length);
                return false; // break
            }
        });
        // remove thousand separators and pad numbers
        sortValue = sortValue.replace(/(\d),(?=(\d{3}))/g, '$1')
            .replace(/\d+/g, function(match) {
                return match.padStart(64, '0')
            });
    }
    return sortValue;
};

const sortByKey = function(array, by) {
    return array.sort(function(a, b) {
        var aValue, bValue, index = 0, key, ret = 0;
        while (ret == 0 && index < by.length) {
            key = by[index].key;
            aValue = getSortValue(a[key])
            bValue = getSortValue(b[key])
            if ((aValue === null) != (bValue === null)) {
                ret = aValue === null ? 1 : -1;
            } else if (aValue < bValue) {
                ret = by[index].operator == '+' ? -1 : 1;
            } else if (aValue > bValue) {
                ret = by[index].operator == '+' ? 1 : -1;
            } else {
                index++;
            }
        }
        return ret;
    });
};

async function sortClips(edit, sort) {
    var key = sort.key, index;
    if (key == 'position') {
        key = 'in';
    }
    if ([
        'id', 'index', 'in', 'out', 'duration',
        'title', 'director', 'year', 'videoRatio'
    ].indexOf(key) > -1) {
        sortBy(sort);
        index = 0;
        edit.clips.forEach(function(clip) {
            clip.sort = index++;
            if (sort.operator == '-') {
                clip.sort = -clip.sort;
            }
        });
    } else {
        var response = await pandoraAPI('sortClips', {
            edit: edit.id,
            sort: [sort]
        })
        edit.clips.forEach(function(clip) {
            clip.sort = response.data.clips.indexOf(clip.id);
            if (sort.operator == '-') {
                clip.sort = -clip.sort;
            }
        });
        sortBy({
            key: 'sort',
            operator: '+'
        });
    }
    function sortBy(key) {
        edit.clips = sortByKey(edit.clips, [key]);
    }
}

async function loadEdit(id, args) {
    var data = window.data = {}
    data.id = id
    data.site = pandora.hostname

    var response = await pandoraAPI('getEdit', {
        id: data.id,
        keys: [
        ]
    })
    if (response.status.code != 200) {
        return {
            site: data.site,
            error: response.status
        }
    }
    data.edit = response['data']
    if (data.edit.status !== 'public') {
        return {
            site: data.site,
            error: {
                code: 403,
                text: 'permission denied'
            }
        }
    }
    data.layers = {}
    data.videos = []

    if (args.sort) {
        await sortClips(data.edit, args.sort)
    }

    data.edit.duration = 0;
    data.edit.clips.forEach(function(clip) {
        clip.position = data.edit.duration;
        data.edit.duration += clip.duration;
    });

    data.edit.clips.forEach(clip => {
        var start = clip['in'] || 0, end = clip.out, position = 0;
        clip.durations.forEach((duration, idx) => {
            if (!duration) {
                return
            }
            if (position + duration <= start || position > end) {
                // pass
            } else {
                var video = {}
                var oshash = clip.streams[idx]
                video.src = getVideoURL(clip.item, 480, idx+1, '', oshash)
                /*
                if (clip['in'] && clip.out) {
                    video.src += `#t=${clip['in']},${clip.out}`
                }
                */
                if (isNumber(clip.volume)) {
                    video.volume = clip.volume;
                }
                if (
                    position <= start
                    && position + duration > start
                ) {
                    video['in'] = start - position;
                }
                if (position + duration >= end) {
                    video.out = end - position;
                }
                if (video['in'] && video.out) {
                    video.duration = video.out - video['in']
                } else if (video.out) {
                    video.duration = video.out;
                } else if (!isUndefined(video['in'])) {
                    video.duration = duration - video['in'];
                    video.out = duration;
                } else {
                    video.duration = duration;
                    video['in'] = 0;
                    video.out = video.duration;
                }
                data.videos.push(video)
            }
            position += duration
        })
        Object.keys(clip.layers).forEach(layer => {
            clip.layers[layer].forEach(annotation => {
                if (args.users && !args.users.includes(annotation.user)) {
                    return
                }
                if (args.layers && !args.layers.includes(layer)) {
                    return
                }
                var a = {...annotation}
                a['id'] = clip['id'] + '/' + a['id'];
                a['in'] = Math.max(
                    clip['position'],
                    a['in'] - clip['in'] + clip['position']
                );
                a.out = Math.min(
                    clip['position'] + clip['duration'],
                    a.out - clip['in'] + clip['position']
                );
                data.layers[layer] = data.layers[layer] || []
                data.layers[layer].push(a)
            })
        })
    })
    var value = []
    pandora.layerKeys.forEach(layer => {
        if (!data.layers[layer]) {
            return
        }
        var html = []
        var layerData = getObjectById(pandora.site.layers, layer)
        html.push(`<h3>
            <span class="icon">${icon.down}</span>
            ${layerData.title}
        </h3>`)
        data.layers[layer].forEach(annotation => {
            html.push(`
                <div class="annotation ${layerData.type}" data-in="${annotation.in}" data-out="${annotation.out}">
                    ${annotation.value}
                </div>
            `)
        })
        value.push('<div class="layer">' + html.join('\n') + '</div>')
    })
    data.value = value.join('\n')

    data.title = data.edit.name
    data.byline = data.edit.description
    data.link = `${pandora.proto}://${data.site}/edits/${data.edit.id}`
    data.poster = data.videos[0].src.split('/48')[0] + `/480p${data.videos[0].in}.jpg`
    data.aspectratio = data.edit.clips[0].videoRatio
    data.duration = data.edit.duration
    return data

}
