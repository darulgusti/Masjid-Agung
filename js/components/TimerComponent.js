class TimerComponent {
            constructor(elementId, initialHours, initialMinutes, initialSeconds) {
                this.timerEl = document.getElementById(elementId);
                this.h = initialHours;
                this.m = initialMinutes;
                this.s = initialSeconds;
            }

            start() {
                if (!this.timerEl) return;
                
                setInterval(() => {
                    this.s--;
                    if (this.s < 0) { this.s = 59; this.m--; }
                    if (this.m < 0) { this.m = 59; this.h--; }
                    
                    this.timerEl.innerText = `${String(this.h).padStart(2, '0')}:${String(this.m).padStart(2, '0')}:${String(this.s).padStart(2, '0')}`;
                }, 1000);
            }
        }