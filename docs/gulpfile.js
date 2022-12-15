"use strict";
var gulp = require('gulp'),
    sass = require('gulp-ruby-sass'),
		autoprefixer = require('gulp-autoprefixer'),
		livereload = require('gulp-livereload');

// Sass Compile Task
gulp.task('sass', function() {
  gulp.src('sass/**/*.scss')
  .pipe(sass({
    style: 'compressed'
  }))
  .pipe(autoprefixer({
      browsers: ['last 3 versions'],
      cascade: false
    }))
  .pipe(gulp.dest('css'));
});

// Watch Task
gulp.task('default', function(){
  livereload.listen();
  gulp.watch('sass/**/*.scss', ['sass']);
  gulp.watch('**').on('change', livereload.changed);
  
});

