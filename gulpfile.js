'use strict';
var gulp = require('gulp');
var sass = require('gulp-sass')(require('node-sass'));
var concat = require('gulp-concat');

gulp.task('sass', function () {
   return gulp.src('./styles/**/*.scss')
   .pipe(concat('prime-psionics.scss'))
   .pipe(sass().on('error', sass.logError))
   .pipe(gulp.dest('./'));
});