module.exports = function(grunt) {

	// Project configuration. 
	grunt.initConfig({
		compass: {
            dist: {                   // Target 
              options: {              // Target options 
                sassDir: 'scss',
                cssDir: 'css',
                environment: 'production'
              }
            },
            dev: {                    // Another target 
              options: {
                sassDir: 'scss',
                cssDir: 'css'
              }
            }
        },
		watch: {
			compass: {
                files: ['scss/**/*.{scss,sass}'],
                tasks: ['compass:dev']
            },
		}
	});

	grunt.loadNpmTasks('grunt-contrib-compass');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.registerTask(
		'default', [
            'compass:dist',
			'watch'
		]);

};