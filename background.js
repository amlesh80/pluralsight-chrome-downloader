var tabs = {};

// Setup listener to show/hide the page actions
// https://developer.chrome.com/extensions/pageAction
chrome.webNavigation.onCommitted.addListener(
    function (details) {
        var matches = /[?&]course=(?:([^&#]*)|&|#|$)/.exec(details.url);
        if (matches) {
            console.debug('Detected course ' + matches[1]);

            tabs[details.tabId] = {
                course:  matches[1]
            };

            chrome.tabs.executeScript(details.tabId, {file: "content.js", runAt: "document_end"});
        }

        chrome.pageAction.hide(details.tabId);
    },
    {urls: [ '*://app.pluralsight.com/player?*' ]}
);

// Listen to the url used to get the video url
// https://developer.chrome.com/extensions/webRequest#event-onBeforeRequest
chrome.webRequest.onBeforeRequest.addListener(
    function (details) {
        if (!tabs.hasOwnProperty(details.tabId)) {
            console.debug('Tab is not linked to a course');
            return;
        }
        if (tabs[details.tabId].hasOwnProperty('request')) {
            return;
        }

        var postData = String.fromCharCode.apply(null, Array.apply(null, new Uint8Array(details.requestBody.raw[0].bytes)));
        var postJson = JSON.parse(postData);

        tabs[details.tabId].request = {
            method: details.method,
            body: postJson
        };

        chrome.pageAction.show(details.tabId);
    },
    {urls: [ '*://app.pluralsight.com/player/retrieve-url' ]},
    ['requestBody']
);

// Listen for the popup to request information
// https://developer.chrome.com/extensions/runtime#event-onMessage
chrome.runtime.onMessage.addListener(function (msg, sender, response) {
    if (msg.type === 'initialRequest') {
        response(tabs[msg.tabId]);
    }
    if (msg.type === 'downloadFile') {
        console.log('Download ' + msg.url);
        // https://developer.chrome.com/extensions/downloads#method-download
    }
});
