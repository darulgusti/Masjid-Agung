 class MasjidApp {
            constructor() {
                // Initialize Services
                this.prayerService = new PrayerService();
                
                // Initialize UI Controller
                this.ui = new UIController(this.prayerService);
                
                // Initialize Components
                this.timer = new TimerComponent('timer', 2, 45, 10);
            }

            run() {
                this.ui.init();
                this.timer.start();
                console.log("Masjid Agung App is running...");
            }
        }

        // Jalankan aplikasi saat halaman selesai dimuat
        window.addEventListener('load', () => {
            const app = new MasjidApp();
            app.run();
        });