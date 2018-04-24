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

app.command('/ping', ctx => ctx.reply('pong'))
app.command('/ifconfig', ctx => ctx.reply(require('./getip').do()))

// const gameReply = (sandbox, ctx) => {
//     ctx.chatDb.setUserSandbox(ctx.update.message.from.id, sandbox)
//     ctx.replyWithGame('angry_frogs', Extra.markup(
//         Markup.inlineKeyboard([
//             Markup.gameButton('Play')
//         ])
//     ))
// }
// app.command('/play', ctx => gameReply(process.env.NODE_ENV, ctx))
// app.command('/playLocal', ctx => gameReply('development', ctx))
// app.command('/playProduction', ctx => gameReply('production', ctx))
// app.gameQuery(ctx => {
//     const query = ctx.update.callback_query
//     const sandbox = ctx.chatDb.getUserSandbox(query.from.id)
//     let gameAddr = config.protocol[sandbox] + '://' + config.host[sandbox] + ':' + config.games.angryFrog
//     gameAddr += '?userId=' + query.from.id
//     gameAddr += '&userName=' + query.from.first_name + ' ' + query.from.last_name
//     if ('message' in query) {
//         gameAddr += '&messageId=' + query.message.message_id
//         gameAddr += '&chatId=' + query.message.chat.id
//     } else {
//         gameAddr += '&inlineMessageId=' + query.inline_message_id
//     }
//     console.log('redirecting to', encodeURI(gameAddr))
//     ctx.answerGameQuery(encodeURI(gameAddr))
// })

// app.on('group_chat_created', ctx => {
//     const m = ctx.update.message
//     const groupTitle = m.chat.title
//     ctx.telegram.sendMessage(m.chat.id, "Thanks for invite to group " + groupTitle)
// })
// app.on('new_chat_member', ctx => {
//     const m = ctx.update.message
//     if (m.new_chat_member.username === ctx.me) {
//         const groupTitle = m.chat.title
//         ctx.telegram.sendMessage(m.chat.id, "I've been invited to group " + groupTitle)
//     } else {
//         const newMember = m.new_chat_member.first_name
//         ctx.telegram.sendMessage(m.chat.id, "Welcome, " + newMember)
//     }
// })
// app.on('left_chat_member', ctx => {
//     const m = ctx.update.message
//     if (m.left_chat_member.username === ctx.me) {
//         ctx.telegram.sendMessage(m.chat.id, "So sorry to left your gruop")
//     } else {
//         const leftMember = m.left_chat_member.first_name
//         ctx.telegram.sendMessage(m.chat.id, "Sorry to see you go, " + leftMember)
//     }
// })

// require('./scores')(process.env.NODE_ENV, config, app)
const notifier = require('./notifier')(
    config,
    channel => {
        app.telegram.sendMessage(config.tw.myself, `CHANNEL ONLINE\n${channel.link}\n${channel.game}\n${channel.view_count}`)
    },
    channel => {
        app.telegram.sendMessage(config.tw.myself, `CHANNEL OFFLINE\n${channel.link}`)
    })
app.command('/channelList', ctx => {
    // console.log(notifier.channels)
    if (Object.keys(notifier.channels).length === 0) ctx.reply('No channels active :(')
    Object.keys(notifier.channels).forEach(key => {
        const ch = notifier.channels[key]
        ctx.reply(`${ch.link}\n${ch.game}\n${ch.view_count}`)
    })
})

app.startPolling()