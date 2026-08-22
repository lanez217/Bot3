const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, downloadMediaMessage } = require('@whiskeysockets/baileys');
const COMMANDS = require('./commands');

const startTime = Date.now();
let isConnecting = false;

async function startBot(io = null, phoneNumber = null) {
    if (isConnecting) return;
    isConnecting = true;

    try {
        const { state, saveCreds } = await useMultiFileAuthState('auth_info_lanez');

        const sock = makeWASocket({
            auth: state,
            printQRInTerminal: false,
            keepAliveIntervalMs: 25000, // Sends ping every 25s to keep WebSocket open
            connectTimeoutMs: 60000,
            defaultQueryTimeoutMs: 0,
            syncFullHistory: false
        });

        sock.ev.on('creds.update', saveCreds);

        // Pairing Code Handler
        if (phoneNumber && !sock.authState.creds.registered) {
            setTimeout(async () => {
                try {
                    const cleanNum = phoneNumber.replace(/[^0-9]/g, '');
                    const code = await sock.requestPairingCode(cleanNum);
                    console.log(`🔑 Pairing Code generated: ${code}`);
                    if (io) io.emit('pairing_code', code);
                } catch (err) {
                    console.error('Error generating pairing code:', err);
                    if (io) io.emit('pairing_error', 'Failed to generate code.');
                }
            }, 3000);
        }

        // Connection State Manager
        sock.ev.on('connection.update', (update) => {
            const { connection, lastDisconnect } = update;

            if (connection === 'open') {
                isConnecting = false;
                console.log('✅ WhatsApp Bot Connected & Active!');
                if (io) io.emit('status', 'Connected');
            } else if (connection === 'close') {
                isConnecting = false;
                const statusCode = lastDisconnect?.error?.output?.statusCode;
                const isLoggedOut = statusCode === DisconnectReason.loggedOut;
                
                console.log(`⚠️ Connection closed (${statusCode}). Reconnecting...`);
                if (io) io.emit('status', 'Disconnected');

                // Auto-reconnect continuously unless unlinked manually
                if (!isLoggedOut) {
                    setTimeout(() => startBot(io, null), 3000);
                } else {
                    console.log('❌ Device logged out manually. Delete auth folder to reset.');
                }
            }
        });

        // Message Listener
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

                // Antilink Enforcement
                if (from.endsWith('@g.us') && body.includes('chat.whatsapp.com')) {
                    const config = COMMANDS.config;
                    if (config.antilink[from]) {
                        const sender = msg.key.participant;
                        await sock.sendMessage(from, { delete: msg.key });
                        await sock.groupParticipantsUpdate(from, [sender], 'remove');
                        return;
                    }
                }

                const prefix = '.';
                if (!body.startsWith(prefix)) return;

                const args = body.slice(prefix.length).trim().split(/ +/);
                const cmdName = args.shift().toLowerCase();

                const command = COMMANDS.commands.find(c => c.name === cmdName || (c.aliases && c.aliases.includes(cmdName)));
                if (!command) return;

                console.log(`🚀 Executing command: .${cmdName}`);

                const sender = msg.key.participant || msg.key.remoteJid;
                const isGroup = from.endsWith('@g.us');

                await command.exec({ 
                    sock, 
                    from, 
                    args, 
                    msg, 
                    sender, 
                    isGroup, 
                    startTime, 
                    downloadMediaMessage 
                });

            } catch (err) {
                console.error('❌ Command execution error:', err);
            }
        });

    } catch (err) {
        isConnecting = false;
        console.error('Fatal initialization error:', err);
        setTimeout(() => startBot(io, null), 5000);
    }
}

module.exports = { startBot };
                                                            
