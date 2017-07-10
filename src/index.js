const config = require(process.env.CONFIG)
const Telegraf = require('telegraf')
const {Telegram, Extra, Markup} = Telegraf

const app = new Telegraf(config.key, {username: config.username})
const chatDb = {}
app.context.chatDb = {
    add: (key) => key in chatDb ? chatDb[key] += 1 : chatDb[key] = 0,
    retrieve: (key) => key in chatDb ? chatDb[key] : 0
}

const pingAnswers = ['pong', 'pong', 'я же сказал что работает', 'себе команду тереби, сука']

//
// middleware
app.use((ctx, next) => {
    console.log(ctx.updateType, ctx.updateSubTypes)
    return next()
})

app.command('/ping', ctx =>  {
    console.log('incoming ping')
    const chat = ctx.update.message.chat.id
    const db = ctx.chatDb
    db.add(chat)
    const answer = db.retrieve(chat)
    if (answer < pingAnswers.length) {
        ctx.reply(pingAnswers[answer])
    }
})

app.command('/play', ({reply}) => reply('not implemented'))

app.command('/setshit', ctx => {
    ctx.reply('', Markup.keyboard(['lol', 'twah', 'third']).resize().extra())
})
app.command('/unsetshit', ctx => {
    ctx.reply('what?')
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

app.on('message', ctx => {
    // ctx.reply(ctx.from.first_name + ', you said "' + ctx.message.text + '"')
})
app.on('inline_query', ctx => {
    // ctx.telegram.answerInlineQuery(ctx.inlineQuery.id, ['inline query detected'])
    // ctx.reply('inline query detected')
})

app.startPolling()