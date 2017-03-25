var gulp = require('gulp')
var less = require('gulp-less')
var rename = require('gulp-rename')
var postcss = require('gulp-postcss')
var autoprefixer = require('autoprefixer')
var conf = require('./conf.json')
var del = require('del')
var rev = require('gulp-rev')
var revCollector = require('gulp-rev-collector')
var replace = require('gulp-replace')
var qiniu = require('gulp-qiniu')
var eslint = require('gulp-eslint')
var gulpIf = require('gulp-if')
var runSequence = require('run-sequence');
var clean = require('gulp-clean');

gulp.task('watch', () => {
    gulp.watch('src/**', function(callback) {
        runSequence('build:images', 'static:img', 'build:lesstocss', 'build:csstowxss', 'build:views', 'build:else', 'qiniu')
    })
})

gulp.task('clean:tmp', function () {
  return gulp.src('tmp/*', {read: false})
    .pipe(clean());
});

gulp.task('build:style', () => {
    gulp.src(['tmp/rev/**/*.json', 'src/**/*.less'], {base: 'src'})
        .pipe(replace(/\/dist\/(images)/g, `${conf.qiniu_url}$1`))
        .pipe(revCollector({
            replaceReved: true
        }))
        .pipe(less())
        .pipe(postcss([autoprefixer(['iOS >= 8', 'Android >= 4.1'])]))
        .pipe(rename((path) => {
            path.extname = '.wxss'
        }))
        .pipe(gulp.dest('dist'))
})

gulp.task('build:lesstocss', () => {
    gulp.src(['src/**/*.less', '!src/common/**/*.less'])
        .pipe(less())
        .pipe(gulp.dest('tmp'))
})

gulp.task('build:csstowxss', ['build:lesstocss'], () => {
    gulp.src(['tmp/rev/**/*.json', 'tmp/**/*.css'])
        .pipe(replace(/\/dist\/(images)/g, `${conf.qiniu_url}$1`))
        .pipe(revCollector({
            replaceReved: true
        }))
        .pipe(postcss([autoprefixer(['iOS >= 8', 'Android >= 4.1'])]))
        .pipe(rename((path) => {
            path.extname = '.wxss'
        }))
        .pipe(gulp.dest('dist'))
})

gulp.task('build:views', () => {
    gulp.src(['tmp/rev/**/*.json', 'src/**/*.html'], {base: 'src'})
        .pipe(replace(/\/dist\/(images)/g, `${conf.qiniu_url}$1`))
        .pipe(revCollector({
            replaceReved: true
        }))
        .pipe(rename((path) => {
            path.extname = '.wxml'
        }))
        .pipe(gulp.dest('dist'))
})

gulp.task('build:images', () => {
    gulp.src(['images/**/*'])
        .pipe(gulp.dest('tmp/images/'))
        .pipe(rev())
        .pipe(gulp.dest('tmp/images/'))
        .pipe(rev.manifest())
        .pipe(gulp.dest('tmp/rev/images/'))
})

// 将静态文件直接挪到dist目录里面
gulp.task('static:img', () => {
    gulp.src(['src/images/*'], {base: 'src'})
        .pipe(gulp.dest('dist'))
})

gulp.task('build:else', () => {
    gulp.src(['tmp/rev/**/*.json', 'src/app.js', 'src/**/*.json', 'src/**/*.js'], {base: 'src'})
        .pipe(replace(/\/dist\/(images)/g, `${conf.qiniu_url}$1`))
        .pipe(revCollector({
            replaceReved: true
        }))
        .pipe(gulp.dest('dist'))
})

function isFixed (file) {
    // Has ESLint fixed the file contents?
    return file.eslint != null && file.eslint.fixed
}

gulp.task('eslint:fix', () => {
    gulp.src(['src/**/*.js'], {base: 'src'})
        .pipe(eslint({
    fix: true,
    configFile: '.eslintrc.json'
}))
        .pipe(eslint.format())
        .pipe(gulpIf(isFixed, gulp.dest('src')))
})

// 将dist文件下的文件上传到cdn，views除外
gulp.task('qiniu', () => gulp.src(['./tmp/**/*'])
        .pipe(qiniu({
    accessKey: conf.qiniu_ak,
    secretKey: conf.qiniu_sk,
    bucket: conf.qiniu_bucket,
    private: false
}, {
    dir: conf.qiniu_prefix
})))

gulp.task('del:tmp', (cb) => {
    del(['tmp/**/*'], cb)
})

gulp.task('default', function(callback) {
    runSequence('watch', 'build:images', 'static:img', 'build:lesstocss', 'build:csstowxss', 'build:views', 'build:else', 'qiniu')
})
