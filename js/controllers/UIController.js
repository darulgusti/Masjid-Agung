class UIController {
    constructor(prayerService){
        this.prayerService = prayerService;
        this.countdownInterval = null;
        this.currentSchedule = [];
    }

    // Called by location.js to set new schedule from API
    setPrayerTimes(times){
        console.log('UIController.setPrayerTimes called with:', times);
        this.currentSchedule = times || [];
        this.renderSchedule();
        this.setupNextPrayer();
    }

    init(){
        console.log('UIController.init() called');
        // Load initial schedule (fallback or cached)
        this.currentSchedule = (this.prayerService && this.prayerService.getSchedule) ? this.prayerService.getSchedule() : [];
        console.log('Initial currentSchedule:', this.currentSchedule);
        
        // Small delay to ensure DOM is ready
        setTimeout(()=>{
            this.renderDate();
            this.renderSchedule();
            this.setupNextPrayer();
        }, 100);
        
        // refresh schedule every minute in case times cross
        setInterval(()=>{ this.renderSchedule(); this.setupNextPrayer(); }, 60*1000);
    }

    renderDate(){
        const el = document.getElementById('tanggal-sekarang');
        if(!el){ console.warn('Element #tanggal-sekarang not found'); return; }
        if(window.DateFormatter && DateFormatter.getFullDateID){
            el.textContent = DateFormatter.getFullDateID();
        }else{
            el.textContent = new Date().toLocaleDateString('id-ID');
        }
        console.log('Date rendered:', el.textContent);
    }

    renderSchedule(){
        const container = document.getElementById('prayer-container');
        if(!container){ console.warn('Element #prayer-container not found'); return; }
        
        const schedule = this.currentSchedule && this.currentSchedule.length > 0 ? this.currentSchedule : 
                         ((this.prayerService && this.prayerService.getSchedule) ? this.prayerService.getSchedule() : []);
        
        console.log('renderSchedule - schedule:', schedule);
        
        if(!schedule || !schedule.length){ 
            container.innerHTML = '<div class="p-6 bg-slate-50 rounded">Jadwal tidak tersedia. Pilih lokasi Anda.</div>'; 
            return; 
        }

        // build cards
        container.innerHTML = schedule.map(s=>{
            return `
                <div class="bg-white/5 backdrop-blur-xl border border-white/10 p-6 rounded-2xl text-center text-white">
                    <p class="text-xs font-bold text-emerald-400 uppercase tracking-widest mb-1">${s.name}</p>
                    <div class="text-2xl font-bold">${s.time}</div>
                </div>
            `;
        }).join('');
        console.log('Schedule rendered with', schedule.length, 'items');
    }

    setupNextPrayer(){
        const schedule = this.currentSchedule && this.currentSchedule.length > 0 ? this.currentSchedule : 
                         ((this.prayerService && this.prayerService.getSchedule) ? this.prayerService.getSchedule() : []);
        if(!schedule || !schedule.length){ 
            console.warn('setupNextPrayer: no schedule');
            return; 
        }

        const next = this.computeNextPrayer(schedule);
        console.log('Next prayer:', next);
        
        const nameEl = document.getElementById('nama-salat-next');
        if(nameEl) nameEl.textContent = next.name;

        // start countdown
        this.startCountdown(next.date);
    }

    computeNextPrayer(schedule){
        const now = new Date();
        // parse schedule times into Date objects for today
        const todayTimes = schedule.map(s=>{
            // handle both "HH:MM" and time formats
            let timeStr = s.time;
            if(timeStr.includes(' ')) timeStr = timeStr.split(' ')[0]; // strip AM/PM if present
            const parts = timeStr.split(':');
            const d = new Date(now.getFullYear(), now.getMonth(), now.getDate(), Number(parts[0]), Number(parts[1]), 0);
            return { name: s.name, date: d };
        });

        // find first with date > now
        for(const t of todayTimes){ if(t.date.getTime() > now.getTime()) return t; }

        // otherwise take first prayer next day
        const first = todayTimes[0];
        const nextDate = new Date(first.date.getTime() + 24*60*60*1000);
        return { name: first.name, date: nextDate };
    }

    startCountdown(targetDate){
        const timerEl = document.getElementById('timer');
        if(!timerEl){ console.warn('Element #timer not found'); return; }
        if(this.countdownInterval) clearInterval(this.countdownInterval);

        const update = ()=>{
            const now = new Date();
            let diff = Math.floor((new Date(targetDate).getTime() - now.getTime())/1000);
            if(diff < 0) diff = 0;
            const h = Math.floor(diff/3600); const m = Math.floor((diff%3600)/60); const s = diff%60;
            timerEl.textContent = `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
        };

        update();
        this.countdownInterval = setInterval(()=>{
            update();
        }, 1000);
    }
}
