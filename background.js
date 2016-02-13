var courses = {};
var currentDownloads = [];

if (!chrome.runtime) {
    // Chrome 20-21
    chrome.runtime = chrome.extension;
} else if(!chrome.runtime.onMessage) {
    // Chrome 22-25
    chrome.runtime.sendMessage = chrome.extension.sendMessage;
}

// Setup listener to get the course information
// https://developer.chrome.com/extensions/webNavigation#event-onDOMContentLoaded
chrome.webNavigation.onDOMContentLoaded.addListener(
    function (details) {
        var matches = /[?&]course=(?:([^&#]*)|&|#|$)/.exec(details.url);
        if (!matches || courses.hasOwnProperty(matches[1])) {
            return;
        }

        console.log('Detected course ' + matches[1]);

        chrome.tabs.executeScript(details.tabId, {file: "course.js"}, courseInfo);
    },
    {urls: [ '*://app.pluralsight.com/player?*' ]}
);

// Listen to the url used to get the video url
// https://developer.chrome.com/extensions/webRequest#event-onCompleted
chrome.webRequest.onCompleted.addListener(
    function (details) {
        console.log('Detected video url fetch response');

        chrome.tabs.executeScript(details.tabId, {file: "download.js"}, download);
    },
    {urls: [ '*://app.pluralsight.com/player/retrieve-url' ]}
);

// Course information
function courseInfo(info) {
    if (info[0] !== undefined) {
        info = info[0];
    }
    if (!info) {
        console.log('course undefined');
        return;
    }

    console.log(info.__course__);
    courses[info.__course__] = info;
}

// File download handler
function download(info) {
    if (info[0] !== undefined) {
        info = info[0];
    }
    if (info.videoSrc === undefined || info.videoSrc === '') {
        console.log('Skipping: No video url received');
        console.log(info);
        return;
    }

    if (currentDownloads.indexOf(info.videoSrc) !== -1) {
        console.log('Skipping: Video url was already downloaded');
        return;
    }
    if (!courses.hasOwnProperty(info.course)) {
        console.log('Skipping: Unknown course ' + info.course);
        return;
    }

    var parts = info.videoSrc.split('/');
    parts.pop();
    parts.pop();
    var name = parts.pop();
    if (!courses[info.course].hasOwnProperty(name)) {
        console.log('Skipping: Unknown clip ' + name);
        return;
    }

    var filename = courses[info.course][name].filename;

    // https://developer.chrome.com/extensions/downloads#method-download
    currentDownloads.push(videoSrc);
}
