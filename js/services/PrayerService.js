class PrayerService {
            constructor() {
                this.prayers = [
                    { name: "Subuh", time: "04:22" },
                    { name: "Dzuhur", time: "11:54" },
                    { name: "Ashar", time: "15:20" },
                    { name: "Maghrib", time: "18:05" },
                    { name: "Isya", time: "19:15" }
                ];
            }

            getSchedule() {
                return this.prayers;
            }

            getNextPrayer() {
                // Dalam aplikasi nyata, ini akan membandingkan dengan waktu sekarang
                return this.prayers[2]; // Mockup: Ashar
            }
        }