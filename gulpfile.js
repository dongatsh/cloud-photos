var gulp = require('gulp');
var less = require('gulp-less');
var rename = require('gulp-rename');
var postcss = require('gulp-postcss');
var autoprefixer = require('autoprefixer');
var conf = require('./conf.json');
var del = require('del');
var rev = require('gulp-rev');
var revCollector = require('gulp-rev-collector');
var replace = require('gulp-replace');
var qiniu = require('gulp-qiniu');

gulp.task('watch', function(){
    gulp.watch('src/**', ['build:images','static:img', 'build:style', 'build:views',  'build:else', 'qiniu']);
});
gulp.task('build:style', function(){
    gulp.src(['tmp/rev/**/*.json', 'src/**/*.less'], {base: "src"})
		.pipe(replace(/\/dist\/(images)/g, conf.qiniu_url + '$1'))
        .pipe(revCollector({
            replaceReved: true
        }))
        .pipe(less())
        .pipe(postcss([autoprefixer(['iOS >= 8', 'Android >= 4.1'])]))
        .pipe(rename(function(path){
            path.extname = '.wxss';
        }))
        .pipe(gulp.dest('dist'));
});

gulp.task('build:views', function(){
	gulp.src(['tmp/rev/**/*.json', 'src/**/*.html'],{base: "src"})
		.pipe(replace(/\/dist\/(images)/g, conf.qiniu_url + '$1'))
        .pipe(revCollector({
            replaceReved: true
        }))
		.pipe(rename(function(path){
			path.extname = '.wxml';
		}))
		.pipe(gulp.dest('dist'));
});

gulp.task('build:images', function(){
	gulp.src(['images/**/*'])
		.pipe(gulp.dest('tmp/images/'))
		.pipe(rev())
		.pipe(gulp.dest('tmp/images/'))
		.pipe(rev.manifest())
		.pipe(gulp.dest('tmp/rev/images/'))
});

//将静态文件直接挪到dist目录里面
gulp.task('static:img',function() {
    gulp.src(['src/images/*'], {base: "src"})
        .pipe(gulp.dest('dist')); 
});

gulp.task('build:else', function(){
    gulp.src(['tmp/rev/**/*.json', 'src/app.js', 'src/app.json', 'src/**/*.js'], {base: "src"})
		.pipe(replace(/\/dist\/(images)/g, conf.qiniu_url + '$1'))
		.pipe(revCollector({
            replaceReved: true
        }))
        .pipe(gulp.dest('dist'));
});

//将dist文件下的文件上传到cdn，views除外
gulp.task('qiniu', function() {

    return gulp.src(['./tmp/**/*'])
        .pipe(qiniu({
            accessKey: conf.qiniu_ak,
            secretKey: conf.qiniu_sk,
            bucket: conf.qiniu_bucket,
            private: false
        }, {
            dir: conf.qiniu_prefix
        }));
});

gulp.task('del:tmp', function(cb){
	del(['tmp'], cb);	
});

gulp.task('default', ['watch', 'build:images', 'static:img','build:style', 'build:views', 'build:else', 'qiniu']);
