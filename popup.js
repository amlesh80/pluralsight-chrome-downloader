// Get active tabId
chrome.tabs.query({active: true}, function(tabs) {
    var tabId =  tabs[0].id;

    // Get course request data
    chrome.runtime.sendMessage({type: 'initialRequest', tabId: tabId}, function (requestInfo) {
        if (!requestInfo) {
            return;
        }

        // Tell content to download
        chrome.tabs.sendMessage(tabId, {type: 'download', requestInfo: requestInfo}, displayStatus);
    });

});

function displayStatus(info) {
    var progress = document.getElementById('course-progress');
    progress.setAttribute('max', info.downloads.total);
    progress.setAttribute('value', info.downloads.downloaded);

    var endTime = new Date();
    endTime.setTime(info.downloads.end);
    document.getElementById('end-time').appendChild(document.createTextNode(endTime.toTimeString()));
}
