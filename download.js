var matches = /[?&]course=(?:([^&#]*)|&|#|$)/.exec(document.location.search);

var videoNode = document.getElementById('video').getElementsByTagName('video')[0];
var videoSrc = videoNode.getAttribute('src');

try {
    videoNode.pause();
} catch (error) {
}

result = {
    course: matches[1],
    videoSrc: videoSrc
};

// Have result as the last variable so it gets returned
result;
