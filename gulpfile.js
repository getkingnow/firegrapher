/**************/
/*  REQUIRES  */
/**************/
var gulp = require("gulp");
var streamqueue = require("streamqueue");
var karma = require("gulp-karma");
var concat = require("gulp-concat");
var jshint = require("gulp-jshint");
var uglify = require("gulp-uglify");

/****************/
/*  FILE PATHS  */
/****************/
var paths = {
  scripts: [
    "lib/FireGrapherParser.js",
    "lib/FireGrapherD3.js",
  ],

  tests: [
    "bower_components/firebase/firebase.js",
    "lib/*.js",
    "tests/FireGrapher.spec.js"
  ]
};

/***********/
/*  TASKS  */
/***********/
/* Lints, minifies, and concatenates the script files */
gulp.task("scripts", function() {
  // Concatenate all src files together
  var stream = streamqueue({ objectMode: true });
  stream.queue(gulp.src("lib/header.js"));
  stream.queue(gulp.src(paths.scripts));
  stream.queue(gulp.src("lib/footer.js"));

  // Output the final concatenated script file
  return stream.done()
    // Rename file
    .pipe(concat("FireGrapher.js"))

    // Lint
    .pipe(jshint())
    .pipe(jshint.reporter("jshint-stylish"))

    // Write un-minified version
    .pipe(gulp.dest("build"))

    // Minify
    .pipe(uglify())

    // Rename file
    .pipe(concat("FireGrapher.min.js"))

    // Write minified version
    .pipe(gulp.dest("build"));
});

/* Uses the Karma test runner to run the Jasmine tests */
gulp.task("test", function() {
  return gulp.src(paths.tests)
    .pipe(karma({
      configFile: "karma.conf.js",
      action: "run"
    }))
    .on("error", function(err) {
      throw err;
    });
});

/* Re-runs the "scripts" task every time a script file changes */
gulp.task("watch", function() {
  gulp.watch(paths.scripts, ["scripts"]);
});

/* Runs the "test" and "scripts" tasks by default */
gulp.task("default", ["test", "scripts"]);
