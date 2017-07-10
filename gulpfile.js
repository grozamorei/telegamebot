const gulp = require('gulp')
const nodemon = require('gulp-nodemon')

gulp.task('launch-bot', () => {
    nodemon({
        cwd: './src/',
        script: 'index.js',
        ext: 'js',
        env: {NODE_ENV: 'development', CONFIG: './config.json'}
    })
})

gulp.task('default', ['launch-bot'])