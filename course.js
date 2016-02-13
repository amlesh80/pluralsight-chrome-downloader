function loadCourses(initialState) {
    var metadata = {
        __course__: initialState.course.name
    };

    var course = initialState.course;
    var modules = initialState.course.modules;
    var moduleNumber = 0;
    modules.forEach(
        function (module) {
            moduleNumber++;

            module.clips.forEach(function(clip) {
                var clipNumber = (clip.index+1);
                var nameParts = clip.name.split('-');

                metadata[clip.name] = {
                    title: module.title + ' - ' + clip.title,
                    author: module.author,
                    album:  course.title,
                    comment: course.title + ' - ' + module.title + ' - ' + clip.title,
                    track: clipNumber +'/'+ module.clips.length,

                    season: moduleNumber,
                    episode_id: clipNumber,

                    filename: [
                        nameParts[nameParts.length-2],
                        nameParts[nameParts.length-1],
                        (module.title + '-' + clip.title).replace(/[^a-z0-9-\._]/gi, '_').toLowerCase()
                    ].join('-') + '.mp4'
                };
            });
        }
    );

    return metadata;
}

var attr = 'data-' + (new Date()).getTime();

var scriptContent = '(function() { if (initialState !== undefined) { document.body.setAttribute("'+attr+'", JSON.stringify(initialState)); } })();';

var script = document.createElement('script');
script.type = 'text/javascript';
script.appendChild(document.createTextNode(scriptContent));
document.body.appendChild(script);

var initialState = JSON.parse(document.body.getAttribute(attr));

loadCourses(initialState);
