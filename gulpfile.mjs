import gulp from "gulp";
import dartSass from "node-sass";
import gulpSass from "gulp-sass";
import concat from "gulp-concat";
import { rollup } from "rollup";

function compileSCSS() {
  return gulp
    .src("./styles/**/*.scss")
    .pipe(concat("prime-psionics.scss"))
    .pipe(sass().on("error", sass.logError))
    .pipe(gulp.dest("./"));
}

gulp.task("sass", compileSCSS);

async function compileJavascript() {
  const bundle = await rollup({
    input: "./prime-psionics.mjs",
    //   plugins: [nodeResolve()]
  });
  await bundle.write({
    file: "./prime-psionics-compiled.mjs",
    format: "es",
    sourcemap: true,
    sourcemapFile: "prime-psionics.mjs",
  });
}

gulp.task("mjs", compileJavascript);

gulp.task("buildAll", gulp.series(compileSCSS, compileJavascript));