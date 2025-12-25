// Admin client-side finance management
(function(){
    const txKey = 'site_transactions_v1';

    function getTransactions(){
        try{ return JSON.parse(localStorage.getItem(txKey)) || []; }catch(e){ return []; }
    }
    function saveTransactions(txs){ localStorage.setItem(txKey, JSON.stringify(txs)); }

    // users list from auth storage
    function getUsers(){
        try{ return JSON.parse(localStorage.getItem('site_users_v1')) || []; }catch(e){ return []; }
    }

    function formatRupiah(n){
        return 'Rp ' + n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    }

    function parseDefault(elId){
        const el = document.getElementById(elId);
        if(!el) return 0;
        const def = el.getAttribute('data-default');
        if(def) return Number(def)||0;
        // fallback: extract digits from text
        const txt = el.innerText || '';
        const num = Number(txt.replace(/[^0-9]/g,'')) || 0;
        return num;
    }

    function updateTotals(){
        const txs = getTransactions();
        const pemasukan = txs.filter(t=>t.type==='pemasukan').reduce((s,t)=>s+Number(t.amount||0),0);
        const pengeluaran = txs.filter(t=>t.type==='pengeluaran').reduce((s,t)=>s+Number(t.amount||0),0);
        const defaultPemasukan = parseDefault('total-pemasukan');
        const defaultPengeluaran = parseDefault('total-pengeluaran');
        const defaultSaldo = parseDefault('total-saldo-kas');

        const totalPemasukan = defaultPemasukan + pemasukan;
        const totalPengeluaran = defaultPengeluaran + pengeluaran;
        const saldo = defaultSaldo + pemasukan - pengeluaran;

        const elP = document.getElementById('total-pemasukan');
        const elPeng = document.getElementById('total-pengeluaran');
        const elSaldo = document.getElementById('total-saldo-kas');
        if(elP) elP.innerText = formatRupiah(totalPemasukan);
        if(elPeng) elPeng.innerText = formatRupiah(totalPengeluaran);
        if(elSaldo) elSaldo.innerText = formatRupiah(saldo);
    }

    function renderTransactions(){
        const container = document.getElementById('admin-transactions-list');
        if(!container) return;
        const txs = getTransactions().slice().reverse();
        if(!txs.length){ container.innerHTML = '<div class="p-3 bg-white rounded">Belum ada transaksi.</div>'; return; }
        container.innerHTML = txs.map(t=>{
            return `<div class="p-3 bg-white rounded border flex justify-between items-center">
                        <div>
                            <div class="text-sm text-slate-500">${new Date(t.date).toLocaleString()}</div>
                            <div class="font-bold">${t.note || (t.type==='pemasukan'? 'Pemasukan':'Pengeluaran')}</div>
                        </div>
                        <div class="text-right">
                            <div class="font-black ${t.type==='pemasukan' ? 'text-emerald-600' : 'text-rose-600'}">${formatRupiah(Number(t.amount))}</div>
                            <div class="text-xs text-slate-400">oleh ${t.createdBy || '-'}</div>
                            <div class="mt-2 flex gap-2 justify-end">
                                <button data-action="edit" data-id="${t.id}" class="px-3 py-1 text-sm border rounded">Edit</button>
                                <button data-action="delete" data-id="${t.id}" class="px-3 py-1 text-sm border rounded text-rose-600">Hapus</button>
                            </div>
                        </div>
                    </div>`;
        }).join('');

        // attach handlers
        container.querySelectorAll('button[data-action]').forEach(btn=>{
            const act = btn.getAttribute('data-action');
            const id = btn.getAttribute('data-id');
            if(act === 'edit') btn.addEventListener('click', ()=> startEditTransaction(id));
            if(act === 'delete') btn.addEventListener('click', ()=> deleteTransaction(id));
        });
    }

    function populateUsersSelect(){
        const sel = document.getElementById('txn-created-by');
        if(!sel) return;
        const users = getUsers();
        sel.innerHTML = '';
        if(!users.length){ sel.innerHTML = '<option value="admin">admin</option>'; return; }
        users.forEach(u=>{ const opt = document.createElement('option'); opt.value = u.username; opt.textContent = `${u.username} (${u.role})`; sel.appendChild(opt); });
    }

    let currentEditId = null;

    function startEditTransaction(id){
        const txs = getTransactions();
        const tx = txs.find(t=>String(t.id) === String(id));
        if(!tx) return alert('Transaksi tidak ditemukan');
        document.getElementById('txn-amount').value = tx.amount;
        document.getElementById('txn-type').value = tx.type;
        document.getElementById('txn-note').value = tx.note || '';
        document.getElementById('txn-created-by').value = tx.createdBy || '';
        currentEditId = tx.id;
        const mode = document.getElementById('txn-mode'); if(mode) mode.innerText = '(Mode: edit)';
    }

    function deleteTransaction(id){
        if(!confirm('Hapus transaksi ini?')) return;
        let txs = getTransactions();
        txs = txs.filter(t=>String(t.id) !== String(id));
        saveTransactions(txs);
        updateTotals();
        renderTransactions();
    }

    function init(){
        // Only activate admin UI if auth.isAdmin() true
        if(!(window.auth && window.auth.isAdmin && window.auth.isAdmin())) return;

        updateTotals();
        renderTransactions();

        const form = document.getElementById('admin-transaction-form');
        const clearBtn = document.getElementById('txn-clear');
        if(form){
            form.addEventListener('submit', function(e){
                e.preventDefault();
                const amount = Number(document.getElementById('txn-amount').value || 0);
                const type = document.getElementById('txn-type').value;
                const note = document.getElementById('txn-note').value.trim();
                const createdBy = document.getElementById('txn-created-by').value || ((window.auth && window.auth.getCurrent && window.auth.getCurrent() )?.username || 'admin');
                if(!amount || amount <= 0){ alert('Masukkan jumlah yang valid'); return; }
                const txs = getTransactions();
                if(currentEditId){
                    // update existing
                    const idx = txs.findIndex(t=>String(t.id) === String(currentEditId));
                    if(idx === -1){ alert('Transaksi tidak ditemukan'); return; }
                    txs[idx].amount = amount;
                    txs[idx].type = type;
                    txs[idx].note = note;
                    txs[idx].createdBy = createdBy;
                    txs[idx].date = new Date().toISOString();
                    saveTransactions(txs);
                    currentEditId = null;
                    const mode = document.getElementById('txn-mode'); if(mode) mode.innerText = '(Mode: baru)';
                }else{
                    // create new with unique id
                    const id = Date.now();
                    txs.push({ id, amount, type, note, date: new Date().toISOString(), createdBy });
                    saveTransactions(txs);
                }
                form.reset();
                populateUsersSelect();
                updateTotals();
                renderTransactions();
                alert('Transaksi berhasil disimpan');
            });
        }
        if(clearBtn){ clearBtn.addEventListener('click', ()=>{ document.getElementById('txn-amount').value=''; document.getElementById('txn-note').value=''; }); }

        // populate users select initially
        populateUsersSelect();

        // admin export and view users handled in inline script already
    }

    document.addEventListener('DOMContentLoaded', init);
})();
