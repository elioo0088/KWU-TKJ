/* ==========================================
   1. KONFIGURASI API DATABASE & KONSTANTA
   PETUNJUK EDIT: Ganti URL di bawah ini dengan 
   endpoint API backend / database Anda.
=========================================== */
const API_BASE_URL = "https://api.kwutkj-sekolah.sch.id/v1"; // Contoh Endpoint API

// Tarif Dasar untuk Percetakan (dalam Rupiah per Lembar)
const TARIF_KERTAS = {
    "70": 300,      // A4 70gr
    "80": 500,      // A4 80gr
    "photo": 3000   // Kertas Foto Glossy
};

const TARIF_WARNA = {
    "hitam": 1,     // Pengali Hitam Putih (1x)
    "warna": 2.5    // Pengali Full Color (2.5x)
};

/* ==========================================
   2. UTILITY / FUNGSI BANTUAN
=========================================== */
// Format Angka ke Rupiah (contoh: 50000 -> Rp 50.000)
function formatRupiah(angka) {
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0
    }).format(angka);
}

// Fungsi Helper untuk Request ke Database API
async function kirimDataAPI(endpoint, method = "POST", data = null) {
    try {
        const options = {
            method: method,
            headers: {
                "Content-Type": "application/json",
                // "Authorization": "Bearer TOKEN_ANDA" // Jika menggunakan Token Login
            }
        };
        if (data) options.body = JSON.stringify(data);

        // FITUR KONEKSI DATABASE:
        // Gantilah blok di bawah ini dengan `const response = await fetch(`${API_BASE_URL}${endpoint}`, options);`
        // Saat ini disimulasikan sukses (mock response):
        console.log(`[API MOCK] ${method} ke ${endpoint}:`, data);
        return { success: true, message: "Berhasil terhubung ke Database!" };
    } catch (error) {
        console.error("Gagal menghubungkan ke Database:", error);
        alert("Terjadi kesalahan jaringan/database.");
        return { success: false };
    }
}

/* ==========================================
   3. EVENT LISTENER SAAT HALAMAN DIMUAT
=========================================== */
document.addEventListener("DOMContentLoaded", () => {
    
    // --- A. LACAK STATUS SERVIS ---
    const formCekStatus = document.getElementById("formCekStatus");
    if (formCekStatus) {
        formCekStatus.addEventListener("submit", async (e) => {
            e.preventDefault();
            const kode = document.getElementById("inputKodeServis").value.trim();

            if (!kode) return alert("Masukkan Kode Nota atau Nomor HP Anda!");

            // AMBIL DATA SERVIS DARI DATABASE
            // const res = await fetch(`${API_BASE_URL}/servis/${kode}`);
            // const data = await res.json();
            
            // Simulasi Respon dari Database
            alert(`🔍 Memeriksa Database...\n\nStatus Servis Kode [${kode}]:\n- Status: Sedang Dikerjakan (Pergantian Sparepart)\n- Teknisi: Budi (Siswa Class XI TKJ 1)\n- Estimasi Selesai: Besok, 14:00 WIB`);
        });
    }

    // --- B. DIAGNOSIS SERVIS & KALKULASI ESTIMASI ---
    const jenisPerangkat = document.getElementById("jenisPerangkat");
    const gejalaKerusakan = document.getElementById("gejalaKerusakan");
    const layananJemput = document.getElementById("layananJemput");
    const hasilEstimasi = document.getElementById("hasilEstimasi");
    const biayaEstimasi = document.getElementById("biayaEstimasi");
    const waktuEstimasi = document.getElementById("waktuEstimasi");
    const formDiagnosis = document.getElementById("formDiagnosisServis");

    function hitungEstimasiServis() {
        const jenis = jenisPerangkat.value;
        const gejala = gejalaKerusakan.value;
        const jemput = layananJemput.checked;

        if (!jenis || !gejala) {
            hasilEstimasi.style.display = "none";
            return;
        }

        let biaya = 0;
        let waktu = "1 Hari";

        // Logic Penentuan Biaya Berdasarkan Gejala Kerusakan
        if (gejala === "layar") {
            biaya = jenis === "hp" ? 250000 : 650000;
            waktu = "1 - 2 Hari";
        } else if (gejala === "baterai") {
            biaya = jenis === "hp" ? 120000 : 350000;
            waktu = "3 - 5 Jam";
        } else if (gejala === "mati_total") {
            biaya = jenis === "hp" ? 300000 : 750000;
            waktu = "2 - 4 Hari";
        } else if (gejala === "os") {
            biaya = jenis === "hp" ? 50000 : 100000;
            waktu = "1 - 2 Jam";
        }

        // Biaya Tambahan Kurir Jemput-Antar
        if (jemput) {
            biaya += 15000; // Biaya jemput Rp 15.000
        }

        // Tampilkan Hasil
        biayaEstimasi.innerText = formatRupiah(biaya);
        waktuEstimasi.innerText = waktu;
        hasilEstimasi.style.display = "block";
    }

    // Event Trigger saat Pilihan Berubah
    if (jenisPerangkat && gejalaKerusakan) {
        jenisPerangkat.addEventListener("change", hitungEstimasiServis);
        gejalaKerusakan.addEventListener("change", hitungEstimasiServis);
        layananJemput.addEventListener("change", hitungEstimasiServis);
    }

    // Simpan Pendaftaran Servis ke Database
    if (formDiagnosis) {
        formDiagnosis.addEventListener("submit", async (e) => {
            e.preventDefault();
            const payload = {
                jenis: jenisPerangkat.value,
                gejala: gejalaKerusakan.value,
                jemput: layananJemput.checked,
                estimasiBiaya: biayaEstimasi.innerText,
                tanggal: new Date().toISOString()
            };

            const response = await kirimDataAPI("/servis/baru", "POST", payload);
            if (response.success) {
                alert("✅ Pendaftaran servis berhasil disimpan! Tim KWU TKJ akan menghubungi Anda via WhatsApp.");
                formDiagnosis.reset();
                hasilEstimasi.style.display = "none";
            }
        });
    }

    // --- C. KALKULASI CETAK DOKUMEN ---
    const jenisKertas = document.getElementById("jenisKertas");
    const tipeWarna = document.getElementById("tipeWarna");
    const jumlahHalaman = document.getElementById("jumlahHalaman");
    const totalBiayaCetak = document.getElementById("totalBiayaCetak");
    const btnBayarCetak = document.getElementById("btnBayarCetak");

    function hitungBiayaCetak() {
        const kertas = jenisKertas.value;
        const warna = tipeWarna.value;
        const lembar = parseInt(jumlahHalaman.value) || 0;

        const hargaPerLembar = (TARIF_KERTAS[kertas] || 300) * (TARIF_WARNA[warna] || 1);
        const total = hargaPerLembar * lembar;

        totalBiayaCetak.innerText = formatRupiah(total);
        return total;
    }

    if (jenisKertas && tipeWarna && jumlahHalaman) {
        jenisKertas.addEventListener("change", hitungBiayaCetak);
        tipeWarna.addEventListener("change", hitungBiayaCetak);
        jumlahHalaman.addEventListener("input", hitungBiayaCetak);
        hitungBiayaCetak(); // Inisialisasi awal
    }

    if (btnBayarCetak) {
        btnBayarCetak.addEventListener("click", async () => {
            const total = hitungBiayaCetak();
            if (total <= 0) return alert("Mohon tentukan jumlah lembar dokumen!");

            // Buka Modal QRIS Pembayaran
            bukaModalQris(total, "Cetak Dokumen Mandiri");
        });
    }

    // --- D. PEMBELIAN PRODUK TOKO & BEKAS ---
    const btnBeliList = document.querySelectorAll(".btn-beli");
    btnBeliList.forEach(button => {
        button.addEventListener("click", (e) => {
            const namaBarang = e.target.getAttribute("data-nama");
            const harga = parseInt(e.target.getAttribute("data-harga"));

            bukaModalQris(harga, `Pembelian: ${namaBarang}`);
        });
    });

    // --- E. KONTROL MODAL (POP-UP QRIS) ---
    const modalQris = document.getElementById("modalQris");
    const closeModal = document.querySelector(".close-modal");
    const nominalQris = document.getElementById("nominalQris");
    const imgQris = document.getElementById("imgQris");

    function bukaModalQris(nominal, itemInfo) {
        if (!modalQris) return;

        nominalQris.innerText = formatRupiah(nominal);
        
        // PETUNJUK EDIT: Ganti URL API QRIS generator di bawah jika menggunakan Payment Gateway asli (Midtrans/Xendit/OVO/DANA/QRIS)
        imgQris.src = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=QRIS_KWU_TKJ_${nominal}_${encodeURIComponent(itemInfo)}`;

        modalQris.style.display = "flex";

        // SIMULASI CEK PEMBAYARAN OTOMATIS KE DATABASE
        // Cek status pembayaran setiap 5 detik
        /*
        const timerCekBayar = setInterval(async () => {
            const res = await fetch(`${API_BASE_URL}/pembayaran/status`);
            if (res.paid) {
                alert("Pembayaran Berhasil Diterima!");
                modalQris.style.display = "none";
                clearInterval(timerCekBayar);
            }
        }, 5000);
        */
    }

    // Tutup Modal saat Klik 'X'
    if (closeModal) {
        closeModal.addEventListener("click", () => {
            modalQris.style.display = "none";
        });
    }

    // Tutup Modal saat Klik di Luar Jendela Modal
    window.addEventListener("click", (e) => {
        if (e.target === modalQris) {
            modalQris.style.display = "none";
        }
    });

});
