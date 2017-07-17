const config = require(process.env.CONFIG)
const Telegraf = require('telegraf')
const {Telegram, Extra, Markup} = Telegraf

const app = new Telegraf(config.key, {username: config.username})
const chatDb = {}
app.context.chatDb = {
    add: (key) => key in chatDb ? chatDb[key] += 1 : chatDb[key] = 0,
    retrieve: (key) => key in chatDb ? chatDb[key] : 0
}

const pingAnswers = ['понг', 'второй понг', 'я же сказал что работает', 'себе команду тереби, сука']

//
// middleware
app.use((ctx, next) => {
    console.log('META MIDDLE: ', ctx.updateType, ctx.updateSubTypes)
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

let redirectAddr
const gameReply = (addr, ctx) => {
    redirectAddr = addr
    ctx.replyWithGame('angry_frogs', Extra.markup(
        Markup.inlineKeyboard([
            Markup.gameButton('Play')
        ])
    ))
}
app.command('/play', ctx => gameReply(config.urls.angryFrog[process.env.NODE_ENV], ctx))
app.command('/playLocal', ctx => gameReply(config.urls.angryFrog['development'], ctx))
app.command('/playProduction', ctx => gameReply(config.urls.angryFrog['production'], ctx))
app.gameQuery(ctx => {
    console.log('redirecting to', redirectAddr)
    ctx.answerGameQuery(redirectAddr)
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

app.startPolling()