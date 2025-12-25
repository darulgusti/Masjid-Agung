 class DateFormatter {
            static getFullDateID() {
                const now = new Date();
                const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
                return now.toLocaleDateString('id-ID', options);
            }
        }