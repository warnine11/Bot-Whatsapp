# Bot-Whatsapp

# 🤖 WhatsApp Bot Gemini - Gen Z Edition

Bot WhatsApp asik, gaul, dan pinter yang ditenagai oleh Google Gemini (Gemini 2.5 Flash) dan diintegrasikan menggunakan Fonnte API . Cocok buat lo yang pengen punya asisten pribadi dengan gaya bahasa kekinian dan pastinya kenceng!

## 🌟 Fitur Unggulan
- 🧠 Brain by Google: Menggunakan model `gemini-2.5-flash` yang super cepat, pintar, dan responsif.
- 💬 Gen Z Persona: Gaya bahasa santai, gaul, dan to-the-point (anti kaku).
- 💤 Auto-Sleep Mode: Bot otomatis "tidur" jika tidak ada chat selama 5 menit untuk menghemat resource.
- 👨‍💻 Manual Handover: Bot otomatis mati (standby) jika admin/owner membalas chat langsung, dan akan aktif kembali otomatis setelah 5 menit sepi.
- 🛡️ Security Ready: Sudah dikonfigurasi untuk mengabaikan file sensitif (.env).

## 🛠️ Persiapan
Pastikan lo sudah punya:
- Node.js terinstal di laptop/VPS.
- Fonnte Token (Ambil di dashboard Fonnte).
- Gemini API Key (Ambil gratis di Google AI Studio).

## 🚀 Cara Install

1. Clone Repo: 
 ```bash
 git clone [https://github.com/warnine11/Bot-Whatsapp.git]
 cd nama-repo-lo
Install Library:

Bash
npm install
Setting Environment:
Buat file bernama .env di folder utama dan isi:

Code snippet
PORT=80
FONNTE_TOKEN=isi_token_fonnte_lo_di_sini
GEMINI_API_KEY=isi_api_key_gemini_lo_di_sini

Jalankan Bot:

Bash
node server.js
⚠️ Catatan Penting

Gunakan bantuan Ngrok atau Cloudflare Tunnel jika lo jalanin bot ini di localhost (komputer sendiri) agar URL webhook Fonnte bisa diakses.