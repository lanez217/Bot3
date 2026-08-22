const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');
const COMMANDS = require('./commands');

const startTime = Date.now();
let sockInstance = null;

async function startBot(io = null, phoneNumber = null) {
    try {
        const { state, saveCreds } = await useMultiFileAuthState('auth_info_lanez');
        const { version } = await fetchLatestBaileysVersion();

        const sock = makeWASocket({
            version,
            auth: state,
            printQRInTerminal: false,
            keepAliveIntervalMs: 25000,
            connectTimeoutMs: 60000,
            defaultQueryTimeoutMs: 0,
            syncFullHistory: false
        });

        sockInstance = sock;
        sock.ev.on('creds.update', saveCreds);

        if (phoneNumber && !sock.authState.creds.registered) {
            setTimeout(async () => {
                try {
                    const cleanNum = phoneNumber.replace(/[^0-9]/g, '');
                    const code = await sock.requestPairingCode(cleanNum);
                    console.log(`🔑 Generated Pairing Code: ${code}`);
                    if (io) io.emit('pairing_code', code);
                } catch (err) {
                    console.error('Pairing error:', err);
                    if (io) io.emit('pairing_error', 'Failed to generate code.');
                }
            }, 2000);
        }

        sock.ev.on('connection.update', (update) => {
            const { connection, lastDisconnect } = update;
            if (connection === 'open') {
                console.log('✅ Connected to WhatsApp!');
                if (io) io.emit('status', 'Connected');
            } else if (connection === 'close') {
                const statusCode = lastDisconnect?.error?.output?.statusCode;
                const isLoggedOut = statusCode === DisconnectReason.loggedOut;
                console.log(`⚠️ Disconnected (${statusCode}). Reconnecting...`);
                if (io) io.emit('status', 'Disconnected');
                if (!isLoggedOut) {
                    setTimeout(() => startBot(io, null), 3000);
                }
            }
        });

        sock.ev.on('messages.upsert', async (m) => {
            try {
                const msg = m.messages[0];
                if (!msg || !msg.message) return;

                const from = msg.key.remoteJid;
                const body = (
                    msg.message.conversation ||
                    msg.message.extendedTextMessage?.text ||
                    msg.message.imageMessage?.caption ||
                    msg.message.videoMessage?.caption ||
                    ''
                ).trim();

                const prefix = '.';
                if (!body.startsWith(prefix)) return;

                console.log(`📩 Command received: ${body} from ${from}`);

                const args = body.slice(prefix.length).trim().split(/ +/);
                const cmdName = args.shift().toLowerCase();

                const command = COMMANDS.commands.find(c => c.name === cmdName || (c.aliases && c.aliases.includes(cmdName)));
                if (!command) return;

                const sender = msg.key.participant || msg.key.remoteJid;
                const isGroup = from.endsWith('@g.us');

                await command.exec({ 
                    sock, 
                    from, 
                    args, 
                    msg, 
                    sender, 
                    isGroup, 
                    startTime 
                });

            } catch (err) {
                console.error('Message handler error:', err.message);
            }
        });

    } catch (err) {
        console.error('Bot init error:', err);
    }
}

module.exports = { startBot };
