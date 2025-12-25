// Client-side auth with SHA-256 password hashing stored in localStorage
(function(){
    const usersKey = 'site_users_v1';
    const currentKey = 'site_current_user_v1';

    function getUsers(){
        try{ return JSON.parse(localStorage.getItem(usersKey)) || []; }catch(e){ return []; }
    }
    function saveUsers(u){ localStorage.setItem(usersKey, JSON.stringify(u)); }
    function getCurrent(){ try{ return JSON.parse(localStorage.getItem(currentKey)); }catch(e){return null;} }
    function setCurrent(u){ localStorage.setItem(currentKey, JSON.stringify(u)); }
    function clearCurrent(){ localStorage.removeItem(currentKey); }

    async function hashPassword(password){
        const enc = new TextEncoder().encode(password);
        const buf = await crypto.subtle.digest('SHA-256', enc);
        const hashArray = Array.from(new Uint8Array(buf));
        return hashArray.map(b=>b.toString(16).padStart(2,'0')).join('');
    }

    // Migrate any plaintext-stored passwords to hashed values
    async function migrateStoredUsers(){
        const users = getUsers();
        let changed = false;
        for(const u of users){
            if(typeof u.password === 'string' && !/^[0-9a-f]{64}$/.test(u.password)){
                u.password = await hashPassword(u.password);
                changed = true;
            }
        }
        if(changed) saveUsers(users);
    }

    async function init(){
        await migrateStoredUsers();

        // UI elements
        const authBtn = document.getElementById('auth-btn');
        const authArea = document.getElementById('auth-area');
        const modal = document.getElementById('auth-modal');
        const authClose = document.getElementById('auth-close');
        const loginForm = document.getElementById('login-form');
        const registerForm = document.getElementById('register-form');
        const showRegister = document.getElementById('show-register');
        const showLogin = document.getElementById('show-login');
        const authTitle = document.getElementById('auth-title');

        function openModal(mode){
            if(mode === 'login'){
                loginForm.classList.remove('hidden');
                registerForm.classList.add('hidden');
                authTitle.textContent = 'Login';
            }else{
                registerForm.classList.remove('hidden');
                loginForm.classList.add('hidden');
                authTitle.textContent = 'Register';
            }
            modal.classList.remove('hidden');
            modal.classList.add('flex');
        }
        function closeModal(){ modal.classList.add('hidden'); modal.classList.remove('flex'); }

        function renderAuthArea(){
            const user = getCurrent();
            if(!authArea) return;
            if(user){
                authArea.innerHTML = `
                    <div class="relative inline-block text-left">
                        <button id="auth-user-btn" class="bg-white text-emerald-900 px-4 py-2 rounded-full font-bold text-sm border border-slate-200 hover:bg-slate-50 transition">${escapeHtml(user.username)}</button>
                        <div id="auth-user-menu" class="absolute right-0 mt-2 w-48 bg-white rounded shadow-lg hidden">
                            <div class="py-2">
                                <div class="px-4 py-2 text-sm text-slate-700">Role: ${escapeHtml(user.role)}</div>
                                <button id="logout-btn" class="w-full text-left px-4 py-2 text-sm hover:bg-slate-100">Logout</button>
                            </div>
                        </div>
                    </div>
                `;
                const btn = document.getElementById('auth-user-btn');
                const menu = document.getElementById('auth-user-menu');
                const logout = document.getElementById('logout-btn');
                btn && btn.addEventListener('click', ()=> menu.classList.toggle('hidden'));
                logout && logout.addEventListener('click', ()=>{ clearCurrent(); renderAuthArea(); location.reload(); });
            }else{
                authArea.innerHTML = `<button id="auth-btn" class="bg-white text-emerald-900 px-4 py-2 rounded-full font-bold text-sm border border-slate-200 hover:bg-slate-50 transition">Login</button>`;
                const btn = document.getElementById('auth-btn');
                btn && btn.addEventListener('click', ()=> openModal('login'));
            }
        }

        // initial render
        renderAuthArea();

        // handlers
        if(authBtn){ authBtn.addEventListener('click', ()=> openModal('login')); }
        if(authClose){ authClose.addEventListener('click', closeModal); }
        if(showRegister){ showRegister.addEventListener('click', ()=> openModal('register')); }
        if(showLogin){ showLogin.addEventListener('click', ()=> openModal('login')); }

        loginForm && loginForm.addEventListener('submit', async function(e){
            e.preventDefault();
            const username = document.getElementById('login-username').value.trim();
            const password = document.getElementById('login-password').value;
            const hashed = await hashPassword(password);
            const users = getUsers();
            const found = users.find(u=>u.username === username && u.password === hashed);
            if(found){
                setCurrent({username: found.username, role: found.role});
                renderAuthArea();
                closeModal();
                location.reload();
            }else{
                alert('Login gagal: periksa username/password');
            }
        });

        registerForm && registerForm.addEventListener('submit', async function(e){
            e.preventDefault();
            const username = document.getElementById('reg-username').value.trim();
            const password = document.getElementById('reg-password').value;
            const role = document.getElementById('reg-role').value;
            if(!username || !password){ alert('Isikan username dan password'); return; }
            const users = getUsers();
            if(users.find(u=>u.username===username)){ alert('Username sudah digunakan'); return; }
            const hashed = await hashPassword(password);
            users.push({username, password: hashed, role});
            saveUsers(users);
            setCurrent({username, role});
            renderAuthArea();
            closeModal();
            location.reload();
        });

        // close modal on bg click
        modal && modal.addEventListener('click', function(e){ if(e.target === modal) closeModal(); });
    }

    function escapeHtml(s){ return String(s).replace(/[&<>"']/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }

    // expose helper for pages
    window.auth = {
        getCurrent: function(){ return getCurrent(); },
        isAdmin: function(){ const u = getCurrent(); return u && u.role === 'admin'; }
    };

    document.addEventListener('DOMContentLoaded', function(){ init().catch(err=>{ console.error('auth init error', err); }); });
})();
