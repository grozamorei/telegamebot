const gulp = require('gulp')
const nodemon = require('gulp-nodemon')

gulp.task('launch-bot', () => {
    nodemon({
        cwd: './src/',
        script: 'gamebot.js',
        ext: 'js json',
        env: {NODE_ENV: 'development', CONFIG: './config.json'}
    })
})

gulp.task('default', ['launch-bot'])