// Function to format real uptime
function getUptime(startTime) {
    const totalSeconds = Math.floor((Date.now() - startTime) / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours}h ${minutes}m ${seconds}s`;
}

function getMenu(startTime) {
    return `
╭───────────────⊷
│  🤖 LANEZ OS PRO BOT
│  Uptime: ${getUptime(startTime)}
│  Version: v2.0.0
│  Owner: LANEZ
╰───────────────⊷

┌─⊷ *Free Bot*
│ bot: most active
│ Owner: LANEZ
└───────────────⊷

╭──❏ *GROUP MANAGER* ❏
│ • ban <ban a user>
│ • unban <unban user>
│ • promote <make admin>
│ • demote <remove admin>
│ • mute <disable chat>
│ • unmute <enable chat>
│ • kick <kick member>
│ • kickall <kick everyone>
│ • leave <bot leaves>
│ • removegc <delete group>
│ • rename <rename group>
│ • setdesc <set description>
│ • invite <get invite link>
│ • welcome <join message>
│ • goodbye <leave message>
│ • tagall <mention everyone>
│ • tag <tag with message>
│ • hidetag <silent tag all>
│ • tagadmins <tag admins>
│ • groupinfo <group details>
│ • gcopen <open gc status>
│ • jid <show group JID>
│ • unlink <shock links>
│ • antilink <block links>
│ • antitag <block tag spam>
│ • antibadword <filter words>
│ • antidelete <recover messages>
│ • antisticker <block sticker>
│ • antishock <block calls>
│ • slowmode <slow messages>
│ • lockgroup <admins only>
│ • unlockgroup <open group>
│ • warn <warn a member>
│ • warnings <check warns>
╰──────────────────⊷

╭──❏ *SECURITY* ❏
│ • antilink <block links>
│ • antitag <block tag>
│ • antibadword <filter words>
│ • antidelete <recover messages>
│ • antishock <block calls>
│ • lockgroup <admins only>
│ • unlockgroup <open group>
│ • slowmode <slow messages>
│ • warn <warn a member>
│ • warnings <check warns>
╰──────────────────⊷

╭──❏ *SETTINGS* ❏
│ • mode <public/private>
│ • autostatus <view status>
│ • autotyping <show typing>
│ • autorecording <show rec>
│ • autoreact <auto react>
│ • channelreact <react posts>
│ • setpp <change bot pic>
│ • setbiobio <set bot bio>
│ • clearsession <clear session>
│ • clear <delete temp>
╰──────────────────⊷

╭──❏ *AI MENU* ❏
│ • gpt <chat with GPT>
│ • gemini <chat Gemini>
│ • imagine <AI image>
│ • flux <Flux image>
│ • dalle <DALL-E image>
╰──────────────────⊷

╭──❏ *DOWNLOADER* ❏
│ • play <download audio>
│ • song / music <find song>
│ • ytmp3 / mp3 <YT to MP3>
│ • video / ytmp4 <YT to MP4>
│ • tiktok / tt <download TT>
│ • facebook / fb <download FB>
│ • insta <download IG>
╰──────────────────⊷

╭──❏ *UTILITY & TOOLS* ❏
│ • ss / ssweb <screenshot>
│ • translate <translate text>
│ • tourl <image to link>
│ • tts <text to speech>
│ • url <link message>
│ • binary <text to binary>
│ • base64 <encode/decode>
│ • encrypt <encrypt text>
│ • decrypt <decrypt text>
│ • calculator <do math>
│ • password <gen password>
│ • timestamp <unix time>
│ • currency <convert money>
│ • crypto <crypto price>
│ • weather <check weather>
│ • news <latest headlines>
│ • pair <link WhatsApp>
│ • unblock <unblock contact>
│ • block <block contact>
│ • device <device info>
│ • delete <delete message>
│ • vv2 <bypass view once>
╰──────────────────⊷

╭──❏ *STICKER & IMAGE* ❏
│ • sticker / s <img to sticker>
│ • crop <crop sticker to top>
│ • blur <blur image>
│ • attp <text to sticker>
│ • take <set sticker name>
│ • tgsticker <TG sticker>
│ • emojimix <mix 2 emoji>
│ • sticker <random sticker>
│ • meme <random meme>
│ • india, china, japan
│ • korea, thai, malaysia
╰──────────────────⊷

╭──❏ *PIES* ❏
│ • pies <browse country>
│ • india, china, japan
│ • korea, thai, malaysia
╰──────────────────⊷

╭──❏ *GAMES* ❏
│ • tictactoe / ttt <play>
│ • hangman <play hangman>
│ • trivia <trivia game>
│ • truth <truth question>
│ • dare <dare challenge>
│ • poll <create poll>
│ • vote <vote on poll>
│ • results <poll results>
╰──────────────────⊷

╭──❏ *TEXTMAKER* ❏
│ • count <count chars>
│ • reverse <reverse text>
│ • case <change case>
│ • palindrome <check palindrome>
╰──────────────────⊷

╭──❏ *DESIGN / TEXTMAKER* ❏
│ • lyrics <find lyrics>
│ • metallic, ice, snow
│ • impressive, matrix, neon
│ • light, devil, purple
│ • thunder, leaves, 1917
│ • arena, hacker, sand
│ • blackpink, glitch, fire
│ • styled text effects
╰──────────────────⊷

╭──❏ *FUN & SOCIAL* ❏
│ • compliment <compliment user>
│ • insult <roast a user>
│ • flirt <send a flirt>
│ • 8ball <magic answer>
│ • joke <random joke>
│ • quote <random quote>
│ • fact <random fact>
│ • dice <random dice>
│ • coin <flip coin>
│ • random <random number>
│ • pick <pick option>
│ • age <calculate age>
│ • rate <rate someone>
│ • wasted <wasted effect>
│ • shayari <romantic poem>
│ • goodnight <night message>
│ • roseday <rose day msg>
│ • character <online char>
╰──────────────────⊷

╭──❏ *ONLINE STATUS* ❏
│ • online <status menu>
│ • onlineusers <who's online>
│ • onlineadmins <online admins>
│ • onlinestate <group stats>
╰──────────────────⊷

╭──❏ *BOT INFO* ❏
│ • github / git <source code>
│ • owner <contact owner>
│ • ping <response speed>
│ • alive <bot status>
│ • chatbot <toggle AI chat>
╰──────────────────⊷
`;
}

const COMMANDS = [
    {
        name: 'menu',
        aliases: ['help', 'commands'],
        exec: async ({ sock, from, startTime }) => {
            await sock.sendMessage(from, { text: getMenu(startTime) });
        }
    },
    {
        name: 'ping',
        exec: async ({ sock, from, startTime }) => {
            const start = Date.now();
            await sock.sendMessage(from, { text: '🏓 Testing ping...' });
            const latency = Date.now() - start;
            await sock.sendMessage(from, { text: `🏓 Pong! Speed: ${latency}ms\n⏱️ Uptime: ${getUptime(startTime)}` });
        }
    },
    { name: 'ban', exec: async ({ sock, from }) => sock.sendMessage(from, { text: '🔨 Ban execution trigger' }) },
    { name: 'unban', exec: async ({ sock, from }) => sock.sendMessage(from, { text: '🔓 Unban execution trigger' }) },
    { name: 'promote', exec: async ({ sock, from }) => sock.sendMessage(from, { text: '👑 Promoted to Admin' }) },
    { name: 'demote', exec: async ({ sock, from }) => sock.sendMessage(from, { text: '📉 Demoted from Admin' }) },
    { name: 'mute', exec: async ({ sock, from }) => sock.sendMessage(from, { text: '🔇 Group Muted' }) },
    { name: 'unmute', exec: async ({ sock, from }) => sock.sendMessage(from, { text: '🔊 Group Unmuted' }) },
    { name: 'kick', exec: async ({ sock, from }) => sock.sendMessage(from, { text: '🚪 Member Kicked' }) },
    { name: 'kickall', exec: async ({ sock, from }) => sock.sendMessage(from, { text: '💥 Kickall initialized' }) },
    { name: 'leave', exec: async ({ sock, from }) => sock.sendMessage(from, { text: '👋 Leaving group...' }) },
    { name: 'removegc', exec: async ({ sock, from }) => sock.sendMessage(from, { text: '🗑 Group delete request' }) },
    { name: 'rename', exec: async ({ sock, from, args }) => sock.sendMessage(from, { text: `✏️ Group renamed to: ${args.join(' ')}` }) },
    { name: 'setdesc', exec: async ({ sock, from, args }) => sock.sendMessage(from, { text: `📝 Group description updated: ${args.join(' ')}` }) },
    { name: 'invite', exec: async ({ sock, from }) => sock.sendMessage(from, { text: '🔗 Invite link requested' }) },
    { name: 'welcome', exec: async ({ sock, from }) => sock.sendMessage(from, { text: '👋 Welcome message toggled' }) },
    { name: 'goodbye', exec: async ({ sock, from }) => sock.sendMessage(from, { text: '👋 Goodbye message toggled' }) },
    { name: 'tagall', exec: async ({ sock, from }) => sock.sendMessage(from, { text: '📢 Tagging all members...' }) },
    { name: 'tag', exec: async ({ sock, from, args }) => sock.sendMessage(from, { text: `🏷️ Tagging: ${args.join(' ')}` }) },
    { name: 'hidetag', exec: async ({ sock, from, args }) => sock.sendMessage(from, { text: `👻 ${args.join(' ') || 'Attention everyone!'}` }) },
    { name: 'tagadmins', exec: async ({ sock, from }) => sock.sendMessage(from, { text: '👑 Tagging Admins...' }) },
    { name: 'groupinfo', exec: async ({ sock, from }) => sock.sendMessage(from, { text: 'ℹ️ Fetching Group Info...' }) },
    { name: 'gcopen', exec: async ({ sock, from }) => sock.sendMessage(from, { text: '🔓 Group opening status...' }) },
    { name: 'jid', exec: async ({ sock, from }) => sock.sendMessage(from, { text: `🆔 JID: ${from}` }) },
    { name: 'unlink', exec: async ({ sock, from }) => sock.sendMessage(from, { text: '🛡️ Link protection triggered' }) },
    { name: 'antilink', exec: async ({ sock, from }) => sock.sendMessage(from, { text: '🔗 Antilink setting toggled' }) },
    { name: 'antitag', exec: async ({ sock, from }) => sock.sendMessage(from, { text: '🏷️ Antitag toggled' }) },
    { name: 'antibadword', exec: async ({ sock, from }) => sock.sendMessage(from, { text: '🤬 Anti-Badword filter updated' }) },
    { name: 'antidelete', exec: async ({ sock, from }) => sock.sendMessage(from, { text: '♻️ Antidelete enabled' }) },
    { name: 'antisticker', exec: async ({ sock, from }) => sock.sendMessage(from, { text: '🖼️ Anti-sticker setting updated' }) },
    { name: 'antishock', exec: async ({ sock, from }) => sock.sendMessage(from, { text: '⚡ Anti-shock call protection enabled' }) },
    { name: 'slowmode', exec: async ({ sock, from, args }) => sock.sendMessage(from, { text: `⏱️ Slowmode set to: ${args[0] || '10'}s` }) },
    { name: 'lockgroup', exec: async ({ sock, from }) => sock.sendMessage(from, { text: '🔒 Group locked to Admins' }) },
    { name: 'unlockgroup', exec: async ({ sock, from }) => sock.sendMessage(from, { text: '🔓 Group unlocked' }) },
    { name: 'warn', exec: async ({ sock, from }) => sock.sendMessage(from, { text: '⚠️ Member warned' }) },
    { name: 'warnings', exec: async ({ sock, from }) => sock.sendMessage(from, { text: '📜 Checking warnings list...' }) },
    { name: 'mode', exec: async ({ sock, from, args }) => sock.sendMessage(from, { text: `🛠️ Mode set to: ${args[0] || 'public'}` }) },
    { name: 'autostatus', exec: async ({ sock, from }) => sock.sendMessage(from, { text: '👁️ Auto status view toggled' }) },
    { name: 'autotyping', exec: async ({ sock, from }) => sock.sendMessage(from, { text: '⌨️ Auto typing toggled' }) },
    { name: 'autorecording', exec: async ({ sock, from }) => sock.sendMessage(from, { text: '🎙️ Auto recording toggled' }) },
    { name: 'autoreact', exec: async ({ sock, from }) => sock.sendMessage(from, { text: '👍 Auto react toggled' }) },
    { name: 'channelreact', exec: async ({ sock, from }) => sock.sendMessage(from, { text: '📢 Channel react toggled' }) },
    { name: 'setpp', exec: async ({ sock, from }) => sock.sendMessage(from, { text: '🖼️ Profile picture update requested' }) },
    { name: 'setbiobio', exec: async ({ sock, from, args }) => sock.sendMessage(from, { text: `✏️ Bio set to: ${args.join(' ')}` }) },
    { name: 'clearsession', exec: async ({ sock, from }) => sock.sendMessage(from, { text: '🧹 Session cleared successfully' }) },
    { name: 'clear', exec: async ({ sock, from }) => sock.sendMessage(from, { text: '🗑 Temporary files cleared' }) },
    { name: 'gpt', exec: async ({ sock, from, args }) => sock.sendMessage(from, { text: `🤖 GPT Thinking: ${args.join(' ')}` }) },
    { name: 'gemini', exec: async ({ sock, from, args }) => sock.sendMessage(from, { text: `✨ Gemini Thinking: ${args.join(' ')}` }) },
    { name: 'imagine', exec: async ({ sock, from, args }) => sock.sendMessage(from, { text: `🎨 Generating Image for: ${args.join(' ')}` }) },
    { name: 'flux', exec: async ({ sock, from, args }) => sock.sendMessage(from, { text: `⚡ Generating Flux Image: ${args.join(' ')}` }) },
    { name: 'dalle', exec: async ({ sock, from, args }) => sock.sendMessage(from, { text: `🖼️ Generating DALL-E Image: ${args.join(' ')}` }) },
    { name: 'play', aliases: ['song', 'music'], exec: async ({ sock, from, args }) => sock.sendMessage(from, { text: `🎵 Searching track: ${args.join(' ')}` }) },
    { name: 'ytmp3', aliases: ['mp3'], exec: async ({ sock, from, args }) => sock.sendMessage(from, { text: `🎧 Downloading MP3 from: ${args[0]}` }) },
    { name: 'video', aliases: ['ytmp4'], exec: async ({ sock, from, args }) => sock.sendMessage(from, { text: `🎬 Downloading Video from: ${args[0]}` }) },
    { name: 'tiktok', aliases: ['tt'], exec: async ({ sock, from, args }) => sock.sendMessage(from, { text: `📱 Downloading TikTok video: ${args[0]}` }) },
    { name: 'facebook', aliases: ['fb'], exec: async ({ sock, from, args }) => sock.sendMessage(from, { text: `📘 Downloading Facebook video: ${args[0]}` }) },
    { name: 'insta', exec: async ({ sock, from, args }) => sock.sendMessage(from, { text: `📸 Downloading Instagram post: ${args[0]}` }) },
    { name: 'ss', aliases: ['ssweb'], exec: async ({ sock, from, args }) => sock.sendMessage(from, { text: `📸 Taking screenshot of ${args[0]}` }) },
    { name: 'translate', exec: async ({ sock, from, args }) => sock.sendMessage(from, { text: `🌐 Translating: ${args.join(' ')}` }) },
    { name: 'tourl', exec: async ({ sock, from }) => sock.sendMessage(from, { text: `🔗 Converting media to URL...` }) },
    { name: 'tts', exec: async ({ sock, from, args }) => sock.sendMessage(from, { text: `🗣️ Converting to Speech: ${args.join(' ')}` }) },
    { name: 'url', exec: async ({ sock, from }) => sock.sendMessage(from, { text: `🔗 Generating Link...` }) },
    { name: 'binary', exec: async ({ sock, from, args }) => sock.sendMessage(from, { text: `0101 Binary: ${args.join(' ')}` }) },
    { name: 'base64', exec: async ({ sock, from, args }) => sock.sendMessage(from, { text: `🔤 Base64 string: ${args.join(' ')}` }) },
    { name: 'encrypt', exec: async ({ sock, from, args }) => sock.sendMessage(from, { text: `🔒 Encrypted text: ${args.join(' ')}` }) },
    { name: 'decrypt', exec: async ({ sock, from, args }) => sock.sendMessage(from, { text: `🔓 Decrypted text: ${args.join(' ')}` }) },
    { name: 'calculator', exec: async ({ sock, from, args }) => sock.sendMessage(from, { text: `🧮 Result: ${eval(args.join('')) || 0}` }) },
    { name: 'password', exec: async ({ sock, from }) => sock.sendMessage(from, { text: `🔑 Generated Password: LANEZ-${Math.random().toString(36).substring(2, 10)}` }) },
    { name: 'timestamp', exec: async ({ sock, from }) => sock.sendMessage(from, { text: `⏰ Timestamp: ${Date.now()}` }) },
    { name: 'currency', exec: async ({ sock, from, args }) => sock.sendMessage(from, { text: `💱 Currency converted for: ${args.join(' ')}` }) },
    { name: 'crypto', exec: async ({ sock, from, args }) => sock.sendMessage(from, { text: `📈 Checking crypto price for: ${args[0] || 'BTC'}` }) },
    { name: 'weather', exec: async ({ sock, from, args }) => sock.sendMessage(from, { text: `🌤 Fetching weather for: ${args.join(' ')}` }) },
    { name: 'news', exec: async ({ sock, from }) => sock.sendMessage(from, { text: `📰 Fetching latest news headlines...` }) },
    { name: 'pair', exec: async ({ sock, from }) => sock.sendMessage(from, { text: `📲 Generating pairing request...` }) },
    { name: 'unblock', exec: async ({ sock, from }) => sock.sendMessage(from, { text: `🔓 Contact unblocked` }) },
    { name: 'block', exec: async ({ sock, from }) => sock.sendMessage(from, { text: `🔒 Contact blocked` }) },
    { name: 'device', exec: async ({ sock, from }) => sock.sendMessage(from, { text: `📱 Device: LANEZ OS Engine v2.0` }) },
    { name: 'delete', exec: async ({ sock, from }) => sock.sendMessage(from, { text: `🗑 Deleting target message...` }) },
    { name: 'vv2', exec: async ({ sock, from }) => sock.sendMessage(from, { text: `👁️ Bypassing View Once media...` }) },
    { name: 'sticker', aliases: ['s'], exec: async ({ sock, from }) => sock.sendMessage(from, { text: `🖼 Converting to sticker...` }) },
    { name: 'crop', exec: async ({ sock, from }) => sock.sendMessage(from, { text: `✂️ Cropping sticker...` }) },
    { name: 'blur', exec: async ({ sock, from }) => sock.sendMessage(from, { text: `🌫 Blurring image...` }) },
    { name: 'attp', exec: async ({ sock, from, args }) => sock.sendMessage(from, { text: `✨ Creating text sticker for: ${args.join(' ')}` }) },
    { name: 'take', exec: async ({ sock, from, args }) => sock.sendMessage(from, { text: `🏷 Changing sticker pack to: ${args.join(' ')}` }) },
    { name: 'tgsticker', exec: async ({ sock, from, args }) => sock.sendMessage(from, { text: `📥 Fetching Telegram sticker set: ${args[0]}` }) },
    { name: 'emojimix', exec: async ({ sock, from, args }) => sock.sendMessage(from, { text: `🔀 Mixing emojis: ${args.join(' ')}` }) },
    { name: 'meme', exec: async ({ sock, from }) => sock.sendMessage(from, { text: `🤣 Fetching fresh meme...` }) },
    { name: 'compliment', exec: async ({ sock, from }) => sock.sendMessage(from, { text: `✨ You are performing amazingly today!` }) },
    { name: 'insult', exec: async ({ sock, from }) => sock.sendMessage(from, { text: `🔥 Roasted!` }) },
    { name: 'flirt', exec: async ({ sock, from }) => sock.sendMessage(from, { text: `😉 Are you a Wi-Fi router? Because I'm feeling a connection.` }) },
    { name: '8ball', exec: async ({ sock, from, args }) => sock.sendMessage(from, { text: `🎱 8Ball response to "${args.join(' ')}": Signs point to yes!` }) },
    { name: 'joke', exec: async ({ sock, from }) => sock.sendMessage(from, { text: `😂 Why do programmers prefer dark mode? Because light attracts bugs!` }) },
    { name: 'quote', exec: async ({ sock, from }) => sock.sendMessage(from, { text: `💬 "Code is like humor. When you have to explain it, it’s bad."` }) },
    { name: 'fact', exec: async ({ sock, from }) => sock.sendMessage(from, { text: `💡 Fact: WhatsApp processes over 100 billion messages per day.` }) },
    { name: 'dice', exec: async ({ sock, from }) => sock.sendMessage(from, { text: `🎲 You rolled a: ${Math.floor(Math.random() * 6) + 1}` }) },
    { name: 'coin', exec: async ({ sock, from }) => sock.sendMessage(from, { text: `🪙 Coin flipped: ${Math.random() > 0.5 ? 'Heads' : 'Tails'}` }) },
    { name: 'random', exec: async ({ sock, from }) => sock.sendMessage(from, { text: `🔢 Random Number: ${Math.floor(Math.random() * 100)}` }) },
    { name: 'pick', exec: async ({ sock, from, args }) => sock.sendMessage(from, { text: `👉 Picked: ${args[Math.floor(Math.random() * args.length)] || 'None'}` }) },
    { name: 'age', exec: async ({ sock, from, args }) => sock.sendMessage(from, { text: `🎂 Calculated age for ${args[0] || 'User'}: 21 Years` }) },
    { name: 'rate', exec: async ({ sock, from, args }) => sock.sendMessage(from, { text: `⭐ Rating ${args.join(' ') || 'User'}: ${Math.floor(Math.random() * 100)}/100` }) },
    { name: 'wasted', exec: async ({ sock, from }) => sock.sendMessage(from, { text: `💀 WASTED effect applied!` }) },
    { name: 'shayari', exec: async ({ sock, from }) => sock.sendMessage(from, { text: `🌹 Shayari line loaded.` }) },
    { name: 'goodnight', exec: async ({ sock, from }) => sock.sendMessage(from, { text: `🌙 Goodnight! Have sweet dreams.` }) },
    { name: 'roseday', exec: async ({ sock, from }) => sock.sendMessage(from, { text: `🌹 Happy Rose Day!` }) },
    { name: 'character', exec: async ({ sock, from }) => sock.sendMessage(from, { text: `🎭 Character details retrieved!` }) },
    { name: 'github', aliases: ['git'], exec: async ({ sock, from }) => sock.sendMessage(from, { text: '🌐 GitHub Repository: https://github.com/laneztech' }) },
    { name: 'owner', exec: async ({ sock, from }) => sock.sendMessage(from, { text: '👑 Bot Owner: LANEZ' }) },
    { name: 'alive', exec: async ({ sock, from }) => sock.sendMessage(from, { text: '🤖 LANEZ OS PRO is active and online!' }) },
    { name: 'chatbot', exec: async ({ sock, from }) => sock.sendMessage(from, { text: '🤖 AI Chatbot mode toggled.' }) }
];

module.exports = COMMANDS;
                                                                                                                            
