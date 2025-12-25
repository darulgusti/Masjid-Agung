// Location & Prayer API integration
(function(){
    const locKey = 'site_prayer_location_v1';

    function getLocation(){
        try{ return JSON.parse(localStorage.getItem(locKey)) || null; }catch(e){ return null; }
    }
    function setLocation(loc){ localStorage.setItem(locKey, JSON.stringify(loc)); }

    function updateLocationDisplay(city, country){
        const el = document.getElementById('location-display');
        if(el) el.textContent = `Lokasi: ${city}${country ? ', ' + country : ''}`;
    }

    async function geocodeCity(cityName){
        // Use Open-Meteo Geocoding API (free, no key needed)
        try{
            const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cityName)}&count=1&language=en&format=json`);
            const data = await res.json();
            if(!data.results || !data.results.length) throw new Error('Kota tidak ditemukan');
            const r = data.results[0];
            return { lat: r.latitude, lng: r.longitude, city: r.name, country: r.country };
        }catch(e){
            console.error('Geocode error:', e);
            throw e;
        }
    }

    async function getLocationByGeolocation(){
        return new Promise((resolve, reject)=>{
            if(!navigator.geolocation){ reject(new Error('Geolocation tidak didukung')); return; }
            navigator.geolocation.getCurrentPosition(
                pos=>{ resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }); },
                err=>{ reject(err); }
            );
        });
    }

    async function fetchPrayerTimesFromAladhan(lat, lng){
        try{
            const now = new Date();
            const timestamp = Math.floor(now.getTime()/1000);
            console.log('Fetching Aladhan API for lat:', lat, 'lng:', lng);
            // Aladhan API: method 11 = Karachi/University of Islamic Sciences
            const res = await fetch(`https://api.aladhan.com/v1/timings/${timestamp}?latitude=${lat}&longitude=${lng}&method=11`);
            const data = await res.json();
            console.log('Aladhan response:', data);
            if(data.code !== 200) throw new Error('Gagal fetch jadwal');
            const t = data.data.timings;
            const times = [
                { name: 'Subuh', time: t.Fajr },
                { name: 'Dzuhur', time: t.Dhuhr },
                { name: 'Ashar', time: t.Asr },
                { name: 'Maghrib', time: t.Maghrib },
                { name: 'Isya', time: t.Isha }
            ];
            console.log('Prayer times:', times);
            return times;
        }catch(e){
            console.error('Aladhan API error:', e);
            throw e;
        }
    }

    async function loadPrayerSchedule(lat, lng, city='', country=''){
        try{
            const times = await fetchPrayerTimesFromAladhan(lat, lng);
            // store location
            setLocation({ lat, lng, city, country, timestamp: new Date().toISOString() });
            // update display
            if(city) updateLocationDisplay(city, country);
            // notify UIController to refresh
            if(window.uiController && window.uiController.setPrayerTimes){
                console.log('Calling setPrayerTimes...');
                window.uiController.setPrayerTimes(times);
            }else{
                console.warn('window.uiController not available yet');
            }
            return times;
        }catch(e){
            alert('Gagal memuat jadwal: ' + e.message);
            console.error(e);
            throw e;
        }
    }

    function init(){
        console.log('location.js init() starting');
        const cityInput = document.getElementById('location-city');
        const searchBtn = document.getElementById('location-search');
        const autoBtn = document.getElementById('location-auto');

        // Try to restore saved location
        const saved = getLocation();
        console.log('Saved location:', saved);
        if(saved && saved.city){
            updateLocationDisplay(saved.city, saved.country);
            // Optionally reload schedule from saved location
            if(window.uiController && window.uiController.setPrayerTimes){
                console.log('Loading saved location schedule...');
                fetchPrayerTimesFromAladhan(saved.lat, saved.lng)
                    .then(times=>{ window.uiController.setPrayerTimes(times); })
                    .catch(e=>{ console.error('Failed to load saved location:', e); });
            }else{
                console.log('Waiting for uiController to be ready before loading saved location');
            }
        }

        // Search by city
        if(searchBtn){
            searchBtn.addEventListener('click', async function(){
                const city = (cityInput && cityInput.value.trim()) || '';
                if(!city){ alert('Masukkan nama kota'); return; }
                try{
                    searchBtn.disabled = true;
                    searchBtn.textContent = 'Memuat...';
                    const loc = await geocodeCity(city);
                    await loadPrayerSchedule(loc.lat, loc.lng, loc.city, loc.country);
                    searchBtn.disabled = false;
                    searchBtn.textContent = 'Cari';
                }catch(e){
                    searchBtn.disabled = false;
                    searchBtn.textContent = 'Cari';
                }
            });
        }

        // Geolocation
        if(autoBtn){
            autoBtn.addEventListener('click', async function(){
                try{
                    autoBtn.disabled = true;
                    autoBtn.textContent = 'Detecting...';
                    const pos = await getLocationByGeolocation();
                    // Reverse geocode to get city name (optional, using Open-Meteo)
                    try{
                        const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?latitude=${pos.lat}&longitude=${pos.lng}&count=1&language=en&format=json`);
                        const data = await res.json();
                        const r = data.results?.[0];
                        const city = r?.name || 'Lokasi';
                        const country = r?.country || '';
                        await loadPrayerSchedule(pos.lat, pos.lng, city, country);
                    }catch(e){
                        // fallback: just use coordinates
                        await loadPrayerSchedule(pos.lat, pos.lng, `(${pos.lat.toFixed(2)}, ${pos.lng.toFixed(2)})`, '');
                    }
                    autoBtn.disabled = false;
                    autoBtn.textContent = '📍 Lokasi Saya';
                }catch(e){
                    alert('Gagal: ' + e.message);
                    autoBtn.disabled = false;
                    autoBtn.textContent = '📍 Lokasi Saya';
                }
            });
        }

        // Enter key in input
        if(cityInput){
            cityInput.addEventListener('keydown', function(e){
                if(e.key === 'Enter') searchBtn && searchBtn.click();
            });
        }
    }

    document.addEventListener('DOMContentLoaded', ()=>{ 
        console.log('location.js DOMContentLoaded'); 
        init(); 
    });
})();
