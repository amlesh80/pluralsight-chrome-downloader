var currentDownloads = [];

// File download handler
function download(info) {
    if (info[0] !== undefined) {
        info = info[0];
    }
    if (info.videoSrc === undefined || info.videoSrc === '') {
        console.log('No video data received');
        console.log(info);
        return;
    }

    if (currentDownloads.indexOf(info.videoSrc) !== -1) {
        console.log('Skipping video url because it was already downloaded');
        return;
    }

    console.log('Got video url data');
    // var filename = (info.course+'-'+info.module+'-'+info.clip).replace(/[^a-z0-9]/gi, '_').toLowerCase()+'.mp4';

    var parts = info.videoSrc.split('/');
    var extension = parts.pop().split('.').pop();
    parts.pop();

    parts = parts.pop().split('-');
    var path = [
        parts.pop() + info.clip.replace(/[^a-z0-9]/gi, '_').toLowerCase() + '.' + extension,
        parts.pop() + info.module.replace(/[^a-z0-9]/gi, '_').toLowerCase(),
        parts.join('-')
    ];
    path = path.reverse().join('/');

    // https://developer.chrome.com/extensions/downloads#method-download
    currentDownloads.push(videoSrc);
}

// Setup listener
// https://developer.chrome.com/extensions/webRequest#event-onCompleted
chrome.webRequest.onCompleted.addListener(
    function (details) {
        console.log('Detected video url fetch response');
        chrome.tabs.executeScript(details.tabId, {file: "download.js"}, download);
    },
    {urls: [ '*://app.pluralsight.com/player/retrieve-url' ]}
);

//
// // https://developer.chrome.com/extensions/webNavigation#event-onCompleted
// chrome.webNavigation.onCompleted.addListener(
//     function (details) {
//         console.log(details);
//     },
//     { url: [{hostSuffix: 'app.pluralsight.com'}] }
// );
