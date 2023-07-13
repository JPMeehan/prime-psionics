'use strict';
var gulp = require('gulp');
var sass = require('gulp-sass')(require('node-sass'));
var concat = require('gulp-concat');
var {rollup} = require('rollup')
// var gulpIf = require('gulp-if')

function compileSCSS () {
   return gulp.src('./styles/**/*.scss')
   .pipe(concat('prime-psionics.scss'))
   .pipe(sass().on('error', sass.logError))
   .pipe(gulp.dest('./'));
}

gulp.task('sass', compileSCSS );

async function compileJavascript() {
   const bundle = await rollup({
     input: "./module/hooks.mjs",
   //   plugins: [nodeResolve()]
   });
   await bundle.write({
     file: "./prime-psionics.mjs",
     format: "es",
     sourcemap: true,
     sourcemapFile: "module/hooks.mjs"
   });
}

gulp.task('mjs', compileJavascript)

gulp.task('buildAll', gulp.series(compileSCSS, compileJavascript))  