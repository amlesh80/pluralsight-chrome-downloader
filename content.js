chrome.runtime.connect();

var isDownloading = false;
var clipDownloads = {
    downloaded: 0,
    total: 0
};

// Inject js into the actual page
function injectJS(code) {
    var script = document.createElement('script');
    script.type = 'text/javascript';
    script.appendChild(document.createTextNode(code));
    document.body.appendChild(script);
}

function respondOnAttribute(attr, callback) {
    var waitForAttr = function() {
        if (!document.body.hasAttribute(attr)) {
            setTimeout(waitForAttr, 1000);
            return;
        }

        callback(JSON.parse(document.body.getAttribute(attr)));

        document.body.removeAttribute(attr);
    };
    waitForAttr();
}

function fetchUrl(request, filename) {
    console.debug('Request url file for ' + filename);

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

    respondOnAttribute(attr, function downloadUrl(info) {
        console.debug('Downloading ' + filename);
        clipDownloads.downloaded++;
        chrome.runtime.sendMessage({ type: 'downloadFile', url: info.url, filename: filename });
    });
}

// Padding left
function padLeft(nr, n){
    return (new Array(n-String(nr).length+1)).join('0')+nr;
}

// Listen to the initial state
chrome.runtime.onMessage.addListener(function (msg, sender, response) {
    var attr = 'data-' + (new Date()).getTime();

    if (msg.type !== 'download') {
        return;
    }

    if (isDownloading) {
        response({
            isDownloading: isDownloading,
            downloads: clipDownloads
        });
        return;
    }

    isDownloading = true;

    console.debug('Start downloading');
    injectJS(
        '(function() {' +
        '  if (initialState !== undefined) {' +
        '     document.body.setAttribute("'+attr+'", JSON.stringify(initialState));' +
        '  }' +
        '})();'
    );

    respondOnAttribute(attr, function (initialState) {
        var clips = extractClips(initialState, msg.requestInfo.request.body);

        var start = 0;
        clips.forEach(function(clip){
            console.log('Start in ' + start + ' milliseconds');
            setTimeout(
                function () { fetchUrl(clip.request, clip.filename); },
                start
            );

            start = Math.floor(Math.random() * (90000 - 10000) + 10000 + start);
        });

        clipDownloads.total = clips.length;
        clipDownloads.start = (new Date()).getTime();
        clipDownloads.end = (new Date()).getTime() + start;

        response({
            isDownloading: true,
            downloads: clipDownloads
        });
    });

    // Pause video
    try {
        Array.prototype.slice.call(document.getElementsByTagName('video'))
            .forEach(function(elt) { elt.pause(); });
    } catch (e) {
    }

    return true;
});

// Extract clip download information
function extractClips(initialState, requestBody) {
    var data = [];
    var moduleNumber = 0;
    initialState.course.modules.forEach(
        function (module) {
            moduleNumber++;
            module.clips.forEach(function(clip) {
                var clipNumber = (clip.index+1);

                data.push({
                    request: {
                        a: module.author,
                        cn: clip.index.toString(),
                        course: initialState.course.name,
                        m: module.name,
                        cap: requestBody.cap,
                        lc: requestBody.lc,
                        mt: requestBody.mt,
                        q: requestBody.q
                    },

                    filename: initialState.course.name + '/' + [
                        padLeft(moduleNumber, 2),
                        padLeft(clipNumber, 2),
                        (module.title + '-' + clip.title).replace(/[^a-z0-9-\._]/gi, '_').toLowerCase()
                    ].join('-') + '.' + requestBody.mt
                });
            });
        }
    );

    return data;
}

// Disable reporting
injectJS('try { window.$YB.report = window.$YB.AjaxRequest.send = window.$YB.Communication.sendRequest = function(){}; } catch (e) { }');
