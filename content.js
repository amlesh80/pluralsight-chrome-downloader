chrome.runtime.connect();

// Listen to the initial state
chrome.runtime.onMessage.addListener(function (msg, sender, response) {
    if (!msg.hasOwnProperty('requestInfo')) {
        return;
    }
    var requestInfo = msg.requestInfo;

    if (msg.type === 'status') {
        Course.get(requestInfo.course, requestInfo.request.body, function(course) {
            response(course.status());
        });

        // Pause video
        try {
            Array.prototype.slice.call(document.getElementsByTagName('video'))
                .forEach(function(elt) { elt.pause(); });
        } catch (e) { }

        return true;
    }

    if (msg.type === 'download') {
        Course.get(requestInfo.course, requestInfo.request.body, function(course) {
            course.download(response, msg.hasOwnProperty('unwatched') && msg.unwatched);
        });

        return true;
    }

    if (msg.type === 'downloadXSPF') {
        Course.get(requestInfo.course, requestInfo.request.body, function(course) {
            chrome.runtime.sendMessage({
                type: 'downloadFile',
                url: 'data:application/xspf+xml;base64,' + Helper.base64(course.generateXSPF()),
                filename: course.name + '.xspf'
            });

            response();
        });

        return true;
    }

    if (msg.type === 'downloadM3U') {
        Course.get(requestInfo.course, requestInfo.request.body, function(course) {
            chrome.runtime.sendMessage({
                type: 'downloadFile',
                url: 'data:audio/mpegURL;base64,' + Helper.base64(course.generateM3U()),
                filename: course.name + '.m3u'
            });

            response();
        });

        return true;
    }
});

var PageInteraction = (function(document) {
    var injectJS = function(code) {
        // Inject js into the actual page
        var script = document.createElement('script');
        script.type = 'text/javascript';
        script.appendChild(document.createTextNode(code));
        document.body.appendChild(script);
    };

    var respondOnAttribute = function(attr, callback) {
        var waitForAttr = function() {
            if (!document.body.hasAttribute(attr)) {
                setTimeout(waitForAttr, 1000);
                return;
            }

            callback(JSON.parse(document.body.getAttribute(attr)));

            document.body.removeAttribute(attr);
        };
        waitForAttr();
    };

    var fetchUrl = function(request, callback) {
        var attr = 'data-' + (new Date()).getTime();
        injectJS(
            'fetch("/player/retrieve-url", { \
                    method: "post", \
                    credentials: "same-origin", \
                    headers: {"Content-Type": "application/json;charset=UTF-8"}, \
                    body: \'' + JSON.stringify(request) + '\' \
                }).then(function (e) { \
                    if (!e.ok) { \
                        document.body.setAttribute("'+attr+'", "null"); \
                        var t = new Error(e.statusText); \
                        t.status = e.status; \
                        throw t; \
                    } \
                    return e.json() \
                }).then(function (json) { \
                    document.body.setAttribute("'+attr+'", JSON.stringify(json)); \
                });'
        );

        respondOnAttribute(attr, callback);
    };

    var fetchInitialState = function(callback) {

        var attr = 'data-' + (new Date()).getTime();
        injectJS(
            '(function() {' +
            '  if (initialState !== undefined) {' +
            '     document.body.setAttribute("'+attr+'", JSON.stringify(initialState));' +
            '  }' +
            '})();'
        );

        respondOnAttribute(attr, callback);
    };

    var disableAnnoyingStuff = function () {
        injectJS(
            'try { ' +
            '  window.$YB.report = $YB.AjaxRequest.prototype.send = window.$YB.Communication.prototype.sendRequest = window.$YB.Api.prototype.handlePing = function(){}; ' +
            '} catch (e) { }'
        );
    };

    return {
        disableAnnoyingStuff: disableAnnoyingStuff,
        fetchUrl: fetchUrl,
        fetchInitialState: fetchInitialState
    };
})(document);

var Helper = (function(){
    var padLeft = function(nr, n){
        return (new Array(n-String(nr).length+1)).join('0')+nr;
    };

    var base64EncodeUnicode = function(str) {
        return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, function(match, p1) {
            return String.fromCharCode('0x' + p1);
        }));
    };

    var charMap = {
        '>': '&gt;'
        , '<': '&lt;'
        , "'": '&apos;'
        , '"': '&quot;'
        , '&': '&amp;'
    };
    var escapeXML = function(string) {
        if (string === null || string === undefined) return;
        return string.replace(/([&"<>'])/g, function(str, item) {
            return charMap[item];
        })
    };

    return {
        padLeft: padLeft,
        base64: base64EncodeUnicode,
        escapeXML: escapeXML
    };
})();

var Course = function(initialState, requestBody) {
    // Extract clip download information
    var data = [];
    var moduleNumber = 0;
    initialState.course.modules.forEach(
        function (module) {
            moduleNumber++;
            module.clips.forEach(function(clip) {
                var clipNumber = (clip.index+1);

                data.push({
                    request: {
                        author: module.author,
                        clipIndex: clip.index,
                        courseName: initialState.course.name,
                        moduleName: module.name,
                        includeCaptions: requestBody.includeCaptions,
                        locale: requestBody.locale,
                        mediaType: requestBody.mediaType,
                        quality: requestBody.quality
                    },

                    watched: clip.watched,
                    duration: clip.duration,
                    title: module.title + ' - ' + clip.title,
                    filename: initialState.course.name + '/' + [
                        Helper.padLeft(moduleNumber, 2),
                        Helper.padLeft(clipNumber, 2),
                        (module.title + '-' + clip.title).replace(/[^a-z0-9-\._]/gi, '_').toLowerCase()
                    ].join('-') + '.' + requestBody.mediaType
                });
            });
        }
    );
    this.name = initialState.course.name;
    this.title = initialState.course.title;
    this.clips = data;

    this.isDownloading = false;
    this.downloads = {
        total: this.clips.length,
        downloaded: 0,
        start: null,
        end: null
    };
};

Course.get = (function() {
    var courses = {};

    return function(courseName, requestBody, callback) {
        if (courses.hasOwnProperty(courseName)) {
            return callback(courses[courseName]);
        }

        PageInteraction.fetchInitialState(function(initialState) {
            courses[courseName] = new Course(initialState, requestBody);
            callback(courses[courseName]);
        });
    };
})();

Course.prototype.status = function () {
    return {
        isDownloading: this.isDownloading,
        downloads: this.downloads
    };
};

Course.prototype.download = function(callback, unwatched)
{
    unwatched = !!unwatched;
    if (this.isDownloading) {
        callback(this.status());
        return;
    }

    this.isDownloading = true;

    var self = this;
    var start = 0;
    var total = 0;
    this.clips.forEach(function(clip){
        if (unwatched && clip.watched) {
            return;
        }
        total++;

        setTimeout(
            function () {
                PageInteraction.fetchUrl(clip.request, function(info) {
                    var url;
                    if (info.hasOwnProperty('url')) {
                        url = info.url;
                    } else {
                        url = info.urls[0].url;
                    }

                    self.downloads.downloaded++;
                    chrome.runtime.sendMessage({ type: 'downloadFile', url: url, filename: clip.filename });
                });
            },
            start
        );

        start = Math.floor(Math.random() * (90000 - 10000) + 10000 + start);
    });

    this.downloads.start = (new Date()).getTime();
    this.downloads.total = total;
    this.downloads.end = (new Date()).getTime() + start;

    callback(this.status());
};

Course.prototype.generateXSPF = function () {
    var xml = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<playlist version="1" xmlns="http://xspf.org/ns/0/">',
        '<trackList>'
    ];

    this.clips.forEach(function(clip) {
        xml.push('<track>');
        xml.push('<title>', Helper.escapeXML(clip.title), '</title>');
        xml.push('<location>', Helper.escapeXML(clip.filename), '</location>');
        xml.push('</track>');

    });

    xml.push('</trackList>', '</playlist>');

    return xml.join('');
};

Course.prototype.generateM3U = function () {
    var m3u = [
        '#EXTM3U',
        '#EXT-X-MEDIA:TYPE=VIDEO,NAME="'+this.title+'"'
    ];

    this.clips.forEach(function(clip) {
        m3u.push('#EXTINF:'+clip.duration+','+clip.title);
        m3u.push(clip.filename);
    });

    return m3u.join("\n");
};

// Disable reporting
PageInteraction.disableAnnoyingStuff();
