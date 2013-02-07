module.exports = (grunt) ->

    grunt.initConfig

        coffee:
            compile:
                expand: true
                cwd: 'src/'
                src: ['**/*.coffee']
                dest: ''
                ext: '.js'

        watch:
            files: 'src/**/*.coffee',
            tasks: ['coffee']

    grunt.loadNpmTasks 'grunt-contrib-coffee'
    grunt.loadNpmTasks 'grunt-contrib-watch'

    grunt.registerTask 'compile', ['coffee']
    grunt.registerTask 'default', ['compile', 'watch']
