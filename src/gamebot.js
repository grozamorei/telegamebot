const config = require(process.env.CONFIG)
const Telegraf = require('telegraf')
const {Telegram, Extra, Markup} = Telegraf

const backlog = []
const app = new Telegraf(config.key, {username: config.username})
const chatDb = {}
const sandboxDb = {}
app.context.chatDb = {
    add: (key) => key in chatDb ? chatDb[key] += 1 : chatDb[key] = 0,
    retrieve: (key) => key in chatDb ? chatDb[key] : 0,
    setUserSandbox: (user, value) => sandboxDb[user] = value,
    getUserSandbox: user => user in sandboxDb ? sandboxDb[user] : process.env.NODE_ENV
}

const pingAnswers = ['понг', 'второй понг', 'я же сказал что работает', 'себе команду тереби, сука']

//
// middleware
app.use((ctx, next) => {
    const update = JSON.stringify(ctx.update)
    console.log(update)
    if (ctx.updateType === 'message' && ctx.update.message.text !== '/getUpdates') {
        backlog.push(update)
    }
    return next()
})

app.command('/ping', ctx =>  {
    const chat = ctx.update.message.chat.id
    const db = ctx.chatDb
    db.add(chat)
    const answer = db.retrieve(chat)
    if (answer < pingAnswers.length) {
        ctx.reply(pingAnswers[answer])
    }
})

app.command('/ifconfig', ctx => ctx.reply(require('./getip').do()))
app.command('/getUpdates', ctx => {
    ctx.reply(backlog.length > 0 ? backlog.shift() : 'updates empty')
})

const gameReply = (sandbox, ctx) => {
    ctx.chatDb.setUserSandbox(ctx.update.message.from.id, sandbox)
    ctx.replyWithGame('angry_frogs', Extra.markup(
        Markup.inlineKeyboard([
            Markup.gameButton('Play')
        ])
    ))
}
app.command('/play', ctx => gameReply(process.env.NODE_ENV, ctx))
app.command('/playLocal', ctx => gameReply('development', ctx))
app.command('/playProduction', ctx => gameReply('production', ctx))
app.gameQuery(ctx => {
    const query = ctx.update.callback_query
    const sb = ctx.chatDb.getUserSandbox(query.from.id)
    let gameAddr = 'https://' + config.host[sb] + ':' + config.games.angryFrog
    gameAddr += '?userId=' + query.from.id + '&userName=' + query.from.first_name + ' ' + query.from.last_name +
            '&chat=' + query.chat_instance + '&messageId=' + query.message.message_id
    console.log('redirecting to', encodeURI(gameAddr))
    ctx.answerGameQuery(encodeURI(gameAddr))
})

app.command('/poll', ctx => {
    return ctx.replyWithHTML('<b>One</b> or <i>Another</i>', Markup.inlineKeyboard(
        [
            Markup.callbackButton('One', 'One'),
            Markup.callbackButton('Another', 'Another'),
            Markup.callbackButton('Third', 'Third')
        ]
    ).extra())
})
app.action(/.+/, ctx => {
    if (ctx.match[0] === 'Third') {
        return ctx.answerCallbackQuery('oh, you think you smart')
    }
    return ctx.answerCallbackQuery('sure, ' + ctx.match[0] + ' is very nice')
})


app.command('/poll2', ctx => {
    return ctx.reply('Keyboard wrap', Extra.markup(
        Markup.keyboard(['one', 'two', 'three', 'four', 'five', 'six'], {
            wrap: (btn, index, currentRow) => currentRow.length >= (index + 1) / 2
        })
    ))
})
app.hears(['one', 'two', 'three', 'four', 'five', 'six'], (ctx, next) => {
    return ctx.reply('OUKEY', Markup.removeKeyboard(true).extra()).then(next)
})


app.on('group_chat_created', ctx => {
    const m = ctx.update.message
    const groupTitle = m.chat.title
    ctx.telegram.sendMessage(m.chat.id, "Thanks for invite to group " + groupTitle)
})
app.on('new_chat_member', ctx => {
    const m = ctx.update.message
    if (m.new_chat_member.username === ctx.me) {
        const groupTitle = m.chat.title
        ctx.telegram.sendMessage(m.chat.id, "I've been invited to group " + groupTitle)
    } else {
        const newMember = m.new_chat_member.first_name
        ctx.telegram.sendMessage(m.chat.id, "Welcome, " + newMember)
    }
})
app.on('left_chat_member', ctx => {
    const m = ctx.update.message
    if (m.left_chat_member.username === ctx.me) {
        ctx.telegram.sendMessage(m.chat.id, "So sorry to left your gruop")
    } else {
        const leftMember = m.left_chat_member.first_name
        ctx.telegram.sendMessage(m.chat.id, "Sorry to see you go, " + leftMember)
    }
})


let tlsOpts = {}
if (process.env.NODE_ENV === 'production') {
    const fs = require("fs");
     tlsOpts = {
        key: fs.readFileSync(config.tls.key),
        cert: fs.readFileSync(config.tls.cert)
    }
}
const scoreAccept = require('https').createServer(tlsOpts, (req, res) => {
    const {headers, method, url} = req
    console.log(headers, method, url)

    let body = []
    request.on('error', e => {
        console.error(e)
    }).on('data', chunk => {
        body.push(chunk)
    }).on('end', () => {
        body = Buffer.concat(body).toString()
        console.log('INCOMING POST DATA: ' + body)

        res.statusCode = 200
        res.setHeader("Access-Control-Allow-Origin", "*");
        res.setHeader("Access-Control-Allow-Origin", config.host[process.env.NODE_ENV]);
        res.setHeader("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
        res.write(JSON.stringify(body))
        res.end()
    })
}).listen(config.tls.port)

app.startPolling()