
module.exports = (config, onChannelLive, onChannelLeaves) => {
    const request = require('request')
    let channels = {}
    const work = () => {
        request.get({
            url: `https://api.twitch.tv/extensions/${config.tw.client_id}/live_activated_channels`,
            headers: {
                'Client-ID': config.tw.client_id
            }
        }, (err, _, body) => {
            try {
                const json = JSON.parse(body)
                if (json['channels']) {
                    if (json['channels'].length > Object.keys(channels).length) {
                        // console.log('new channel online! ')
                        // channels = json['channels']
                        let newChannels = []
                        json['channels'].forEach(ch => {
                            if (ch.id in channels) return
                            channels[ch.id] = {
                                link: 'https://twitch.tv/' + ch.username,
                                game: ch.game,
                                view_count: ch.view_count
                            }
                            newChannels.push(channels[ch.id])
                        })
                        newChannels.forEach(onChannelLive)
                    }
                    if (json['channels'].length < Object.keys(channels).length) {
                        const oldChannels = Object.assign({}, channels)
                        json['channels'].forEach(ch => {
                            if (ch.id in oldChannels) {
                                delete oldChannels[ch.id]
                            }
                        })
                        Object.keys(oldChannels).forEach(key => {
                            onChannelLeaves(oldChannels[key])
                            delete channels[key]
                        })
                    }
                }
                setTimeout(work, 10000)
            } catch (e) {
                console.log('wrong json: ', body)
                setTimeout(work, 10000)
                return
            }

        })
    }
    work()

    return {
        get channels() { return channels }
    }
}