 class MasjidApp {
            constructor() {
                // Initialize Services
                this.prayerService = new PrayerService();
                
                // Initialize UI Controller
                this.ui = new UIController(this.prayerService);
                // Store in global so location.js can access it
                window.uiController = this.ui;

        // Jalankan aplikasi saat halaman selesai dimuat
        window.addEventListener('load', () => {
            const app = new MasjidApp();
            app.run();
        });