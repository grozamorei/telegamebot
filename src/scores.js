
module.exports = (env, config, app) => {

    const reqestHandler = (req, res) => {
        const {headers, method, url} = req
        // console.log(headers, method, url)

        let body = []
        req.on('error', e => {
            console.error(e)
        }).on('data', chunk => {
            body.push(chunk)
        }).on('end', () => {
            body = JSON.parse(Buffer.concat(body).toString())
            console.log('INCOMING POST DATA: ' + JSON.stringify(body))

            if ('inlineMessageId' in body) {
                app.telegram.setGameScore(body.userId, body.score, body.inlineMessageId, undefined, undefined, true)
            } else {
                app.telegram.setGameScore(body.userId, body.score, undefined, body.chatId, body.messageId, true)
            }

            res.statusCode = 200
            res.setHeader("Access-Control-Allow-Origin", "*");
            res.setHeader("Access-Control-Allow-Origin", config.protocol[env] + '://' + config.host[env] + ':' + config.games.angryFrog);
            res.setHeader("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
            res.write(JSON.stringify(body))
            res.end()
        })
    }

    if (env === 'production') {
        const fs = require("fs");
        const tlsOpts = {
            key: fs.readFileSync(config.tls.key),
            cert: fs.readFileSync(config.tls.cert)
        }
        console.log('creating tls server')
        require('https').createServer(tlsOpts, reqestHandler).listen(config.tls.port)
    } else {
        console.log('creating http server')
        require('http').createServer(reqestHandler).listen(config.tls.port)
    }
}