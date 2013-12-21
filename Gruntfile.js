/* jshint node:true */
'use strict';

module.exports = function( grunt ) {

	// auto load grunt tasks
	require( 'load-grunt-tasks' )( grunt );

	var pluginConfig = {

		// gets the package vars
		pkg: grunt.file.readJSON( 'package.json' ),

		// plugin directories
		dirs: {
			admin: {
				js: 'admin/assets/js',
				css: 'admin/assets/css',
				sass: 'admin/assets/sass',
				images: 'admin/assets/images',
				fonts: 'admin/assets/fonts'
			},
			front: {
				js: 'public/assets/js',
				css: 'public/assets/css',
				sass: 'public/assets/sass',
				images: 'public/assets/images',
				fonts: 'public/assets/fonts'
			},
			bower: 'bower_components'
		},

		// svn settings
		svn_settings: {
			path: '../../../../wp_plugins/<%= pkg.name %>',
			tag: '<%= svn_settings.path %>/tags/<%= pkg.version %>',
			trunk: '<%= svn_settings.path %>/trunk',
			exclude: [
				'.git/',
				'.sass-cache/',
				'admin/assets/sass/',
				'admin/assets/js/admin.js',
				'admin/assets/js/fix.person.fields.admin.js',
				'admin/assets/js/write-panels.js',
				'admin/assets/js/write-panels.old.js',
				'bower_components/',
				'node_modules/',
				'public/assets/js/address.autocomplete.js',
				'public/assets/js/checkout.masks.js',
				'public/assets/js/fix.checkout.fields.js',
				'public/assets/js/fix.person.fields.js',
				'public/assets/js/mailcheck.js',
				'.editorconfig',
				'.gitignore',
				'.jshintrc',
				'Gruntfile.js',
				'README.md',
				'bower.json',
				'package.json',
				'*.zip'
			]
		},

		// javascript linting with jshint
		jshint: {
			options: {
				jshintrc: '.jshintrc'
			},
			all: [
				'Gruntfile.js',
				'<%= dirs.admin.js %>/*.js',
				'!<%= dirs.admin.js %>/*.min.js',
				'<%= dirs.front.js %>/*.js',
				'!<%= dirs.front.js %>/*.min.js'
			]
		},

		// uglify to concat and minify
		uglify: {
			dist: {
				files: {
					// admin
					'<%= dirs.admin.js %>/admin.min.js': [
						'<%= dirs.admin.js %>/admin.js'
					],
					'<%= dirs.admin.js %>/shop-order.old.min.js': [
						'<%= dirs.admin.js %>/fix.person.fields.admin.js',
						'<%= dirs.admin.js %>/write-panels.old.js'
					],
					'<%= dirs.admin.js %>/shop-order.min.js': [
						'<%= dirs.admin.js %>/fix.person.fields.admin.js',
						'<%= dirs.admin.js %>/write-panels.js'
					],
					// front
					'<%= dirs.front.js %>/public.min.js': [
						'<%= dirs.bower %>/jquery.maskedinput/jquery.maskedinput.js',
						'<%= dirs.bower %>/mailcheck/src/mailcheck.js',
						'<%= dirs.front.js %>/address.autocomplete.js',
						'<%= dirs.front.js %>/checkout.masks.js',
						'<%= dirs.front.js %>/fix.checkout.fields.js',
						'<%= dirs.front.js %>/fix.person.fields.js',
						'<%= dirs.front.js %>/mailcheck.js'
					]
				}
			}
		},

		// compass and scss
		compass: {
			options: {
				httpPath: '',
				environment: 'production',
				relativeAssets: true,
				noLineComments: true,
				outputStyle: 'compressed'
			},
			admin: {
				options: {
					sassDir: '<%= dirs.admin.sass %>',
					cssDir: '<%= dirs.admin.css %>',
					imagesDir: '<%= dirs.admin.images %>',
					javascriptsDir: '<%= dirs.admin.js %>',
					fontsDir: '<%= dirs.admin.fonts %>'
				}
			}
		},

		// watch for changes and trigger compass, jshint and uglify
		watch: {
			compass: {
				files: [
					'<%= compass.admin.options.sassDir %>/**'
				],
				tasks: ['compass:admin']
			},
			js: {
				files: [
					'<%= jshint.all %>'
				],
				tasks: ['jshint', 'uglify']
			}
		},

		// image optimization
		imagemin: {
			dist: {
				options: {
					optimizationLevel: 7,
					progressive: true
				},
				files: [
					{
						expand: true,
						cwd: '<%= dirs.admin.images %>/',
						src: '**/*.{png,jpg,gif}',
						dest: '<%= dirs.admin.images %>/'
					},
					{
						expand: true,
						cwd: '<%= dirs.front.images %>/',
						src: '**/*.{png,jpg,gif}',
						dest: '<%= dirs.front.images %>/'
					},
					{
						expand: true,
						cwd: './',
						src: 'screenshot-*.png',
						dest: './'
					}
				]
			}
		},

		// rsync commands used to take the files to svn repository
		rsync: {
			options: {
				args: ['--verbose'],
				exclude: '<%= svn_settings.exclude %>',
				syncDest: true,
				recursive: true
			},
			tag: {
				options: {
					src: './',
					dest: '<%= svn_settings.tag %>'
				}
			},
			trunk: {
				options: {
				src: './',
				dest: '<%= svn_settings.trunk %>'
				}
			}
		},

		// shell command to commit the new version of the plugin
		shell: {
			// Remove delete files.
			svn_remove: {
				command: 'svn st | grep \'^!\' | awk \'{print $2}\' | xargs svn --force delete',
				options: {
					stdout: true,
					stderr: true,
					execOptions: {
						cwd: '<%= svn_settings.path %>'
					}
				}
			},
			// Add new files.
			svn_add: {
				command: 'svn add --force * --auto-props --parents --depth infinity -q',
				options: {
					stdout: true,
					stderr: true,
					execOptions: {
						cwd: '<%= svn_settings.path %>'
					}
				}
			},
			// Commit the changes.
			svn_commit: {
				command: 'svn commit -m "updated the plugin version to <%= pkg.version %>"',
				options: {
					stdout: true,
					stderr: true,
					execOptions: {
						cwd: '<%= svn_settings.path %>'
					}
				}
			}
		}
	};

	// initialize grunt config
	// --------------------------
	grunt.initConfig( pluginConfig );

	// register tasks
	// --------------------------

	// default task
	grunt.registerTask( 'default', [
		'jshint',
		'compass',
		'uglify'
	] );

	// deploy task
	grunt.registerTask( 'deploy', [
		'default',
		'rsync:tag',
		'rsync:trunk',
		'shell:svn_remove',
		'shell:svn_add',
		'shell:svn_commit'
	] );
};
