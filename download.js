var course = document.getElementById('course-title').textContent;

var moduleNode = document.getElementsByClassName('modules')[0].getElementsByClassName('active')[0];
var moduleTitle = moduleNode.getElementsByTagName('h2')[0].textContent;
var moduleSection = moduleNode.parentNode;

var clipTitle = moduleSection.getElementsByClassName('selected')[0].getElementsByClassName('title')[0].textContent;

var videoNode = document.getElementById('video').getElementsByTagName('video')[0];
var videoSrc = videoNode.getAttribute('src');

try {
    videoNode.pause();
} catch (error) {
}

result = {
    course: course,
    module: moduleTitle,
    clip: clipTitle,
    videoSrc: videoSrc
};

// Have result as the last variable so it gets returned
result;
