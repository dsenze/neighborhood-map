module.exports = function(grunt) {
    require('load-grunt-tasks', 'grunt-contrib-cssmin', 'grunt-contrib-uglify', 'grunt-contrib-htmlmin')(grunt);
    var config = grunt.file.readYAML('Gruntconfig.yml');
    grunt.initConfig({
        // if jshint finds error. stop build process and fix.
        jshint: {
            all: ['src/js/app.js']
        },
        cssmin: {
            target: {
                files: [{
                    expand: true,
                    cwd: config.cssSrcDir,
                    src: ['*.css', '!*min.css'],
                    dest: config.cssDistDir,
                    ext: '.css'
                }]
            }
        },
        uglify: {
            build: {
                files: {
                    'dist/js/app.min.js': 'src/js/app.js',
                    'dist/js/jquery-3.2.1.min.js': 'src/js/jquery-3.2.1.js',
                    'dist/js/knockout-3.4.2.min.js': 'src/js/knockout-3.4.2.js',
                }
            }
        },
        htmlmin: { // Task
            dist: { // Target
                options: { // Target options
                    removeComments: true,
                    collapseWhitespace: true
                },
                files: { // Dictionary of files
                    'dist/index.html': 'src/index.html', // 'destination': 'source'
                }
            }
        }
    });

    grunt.registerTask('default', [
        'jshint',
        'cssmin',
        'uglify',
        'htmlmin'

    ]);
};