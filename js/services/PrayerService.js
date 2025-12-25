class PrayerService {
    constructor() {
        // Default prayer times for Malang (data tetap)
        // Updated: Using data for Malang, East Java (-7.9797, 112.6304)
        this.prayers = [
            { name: "Subuh", time: "04:32" },
            { name: "Dzuhur", time: "12:14" },
            { name: "Ashar", time: "15:38" },
            { name: "Maghrib", time: "18:19" },
            { name: "Isya", time: "19:32" }
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