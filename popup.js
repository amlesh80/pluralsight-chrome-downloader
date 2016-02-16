var tabId;

// Get active tabId
chrome.tabs.query({active: true}, function(tabs) {
    tabId =  tabs[0].id;

    // Get course request data
    chrome.runtime.sendMessage({type: 'initialRequest', tabId: tabId}, function (requestInfo) {
        if (!requestInfo) {
            return;
        }

        // Check for the course download
        document.getElementById('dl-course').addEventListener('click', function () {
            // Tell content to download
            chrome.tabs.sendMessage(tabId, {type: 'download', requestInfo: requestInfo}, displayStatus);
        });

        // Check for the playlist download
        document.getElementById('dl-playlist').addEventListener('click', function () {
            chrome.tabs.sendMessage(tabId, {type: 'downloadPlaylist', requestInfo: requestInfo});
        });
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
