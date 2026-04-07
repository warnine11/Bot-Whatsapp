require('dotenv').config();
const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const axios = require('axios');
const { exec } = require('child_process');
const app = express();

app.use(express.json()); 
app.use(express.urlencoded({ extended: true }));

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const SYSTEM_PROMPT = `
- Aturan paling penting: JAWABAN HARUS SINGKAT, PADAT, DAN JELAS. Jangan bertele-tele, to the point .
- Maksimal 3 paragraf pendek
- ketika sender mengrim pesan pertama seperti sapaan dijawab dengan salam lalu perkenalkan diri bahwa anda adalah sebuah asisten virtual
- dan buat permohonan maaf bahwa user akan segera membalas pesan dan jika terburu buru silahkan langsung hubungi admin 
- Tanyakan usia dan gender agar bisa menyesukan gaya bahasa dan ada perlu apa
- Jika menggunakan poin, WAJIB memakai tanda "-" (dash)
- DILARANG menggunakan simbol "*", "**", "•", atau format markdown apa pun
- jika ada pertanyaan dari pengirim menggunakan bahasa formal maka dijawab dengan bahasa formal dan jika ada pertanyaan dari user maka biarkan pesan tersebut hingga owner menjawab langsung
- Usia owner adalah 23 tahun dan tergolong gen z jadi sesuikan juga antar generasi
- Akhiri jawaban dengan satu kalimat ajakan bertanya dan emoticon 🙂 saja`;

const modeManusia = new Set(); 
const modeTidur = new Set(); 
let timers = {}; // Timer untuk AI tidur
let timersAdmin = {}; // Timer untuk AI nyala kembali dari mode manual

async function kirimKeWhatsApp(target, teksPesan) {
    try {
        await axios({
            method: 'POST',
            url: 'https://api.fonnte.com/send',
            headers: { 'Authorization': process.env.FONNTE_TOKEN },
            data: { target: target, message: teksPesan }
        });
    } catch (error) {
        console.error(`❌ Gagal kirim pesan ke ${target}:`, error.message);
    }
}

// =================================================================
// LOGIC AUTO-ON (5 MENIT SETELAH ADMIN SELESAI CHAT)
// =================================================================
function aturTimerAdmin(sender) {
    if (timersAdmin[sender]) {
        clearTimeout(timersAdmin[sender]);
    }

    timersAdmin[sender] = setTimeout(async () => {
        if (modeManusia.has(sender)) {
            modeManusia.delete(sender); // Hapus mode manusia
            console.log(`🔄 Bot aktif kembali untuk ${sender} karena admin tidak membalas 5 menit.`);
            await kirimKeWhatsApp(sender, "Bip bop! 🤖 Admin udah pergi nih, gue (Bot) balik lagi. Ada yang mau ditanyain lagi ngab?");
            aturTimerTidur(sender); // Mulai timer tidur AI lagi
        }
    }, 5 * 60 * 1000); // 5 Menit
}

// =================================================================
// LOGIC AUTO-SLEEP AI (5 MENIT)
// =================================================================
function aturTimerTidur(sender) {
    if (timers[sender]) clearTimeout(timers[sender]);

    timers[sender] = setTimeout(async () => {
        if (!modeManusia.has(sender) && !modeTidur.has(sender)) {
            modeTidur.add(sender);
            const pesanTidur = "Zzz... 😴 Karena nggak ada chat masuk selama 5 menit, gue izin tidur dulu ya biar hemat energi. Kalau butuh gue lagi, chat aja 'halo' atau 'bangun'!";
            console.log(`💤 Bot otomatis tidur untuk user: ${sender}`);
            await kirimKeWhatsApp(sender, pesanTidur);
        }
    }, 5 * 60 * 1000); 
}

app.post('/webhook', async (req, res) => {
    const { sender, message, target } = req.body;
    
    // 0. DETEKSI JIKA OWNER MEMBALAS LANGSUNG (Jika webhook Fonnte membaca outgoing chat)
    const isOwnerMembalas = req.body.fromMe === true || (process.env.NOMOR_OWNER && sender === process.env.NOMOR_OWNER);
    
    if (isOwnerMembalas) {
        const customer = target || sender; 
        modeManusia.add(customer); // Paksa masuk mode manusia
        if (timers[customer]) clearTimeout(timers[customer]); // Matikan timer tidur AI
        aturTimerAdmin(customer); // Jalankan timer auto-nyala 5 menit
        
        console.log(`👤 Owner membalas langsung! Bot dimatikan sementara untuk ${customer}`);
        return res.status(200).send('Owner mengambil alih');
    }

    if (!sender || !message) return res.status(200).send('Invalid');
    res.status(200).send('Diterima!');
    const teks = message.toLowerCase();

    // 1. CEK MODE MANUSIA (ADMIN)
    if (modeManusia.has(sender)) {
        if (teks === 'nyalain bot') {
            modeManusia.delete(sender);
            if (timersAdmin[sender]) clearTimeout(timersAdmin[sender]);
            await kirimKeWhatsApp(sender, "Bip bop! 🤖 Gue bangun! Ada yang bisa dibantu?");
            aturTimerTidur(sender);
            return;
        }
        
        // Reset timer 5 menit nyala otomatis karena customer masih membalas admin
        aturTimerAdmin(sender);
        return;
    }

    // 2. CEK MODE TIDUR (WAKE UP LOGIC)
    if (modeTidur.has(sender)) {
        modeTidur.delete(sender);
        console.log(`⏰ User ${sender} bangunin bot.`);
    }

    // 3. TRIGGER PANGGIL ADMIN
    if (teks.includes('admin') || teks.includes('manusia')) {
        modeManusia.add(sender);
        if (timers[sender]) clearTimeout(timers[sender]); 
        aturTimerAdmin(sender); // Mulai hitung waktu 5 menit
        await kirimKeWhatsApp(sender, "Oke! Gue panggilin admin dulu ya. (Bot akan otomatis menyala jika tidak ada chat selama 5 menit). 🫡");
        return;
    }

    // RESET TIMER TIDUR SETIAP ADA CHAT MASUK DI MODE AI
    aturTimerTidur(sender);

    // 4. PROSES GEMINI
    try {
        const model = genAI.getGenerativeModel({ 
            model: "gemini-2.5-flash",
            systemInstruction: SYSTEM_PROMPT 
        });
        
        const result = await model.generateContent(message);
        const geminiReply = result.response.text();
        
        await kirimKeWhatsApp(sender, geminiReply);
    } catch (error) {
        console.error("🚨 Error API:", error.message);
    }
});

const PORT = process.env.PORT || 80;
app.listen(PORT, () => console.log(`🚀 Server jalan di port ${PORT} ngab!`));