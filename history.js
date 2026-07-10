const SUPABASE_URL='https://mosexjnulqhlulnliazv.supabase.co';
const SUPABASE_KEY='sb_publishable_eoxClJS-KpkzHZMudL_eBQ_IGrlLbj-';
const db=supabase.createClient(SUPABASE_URL,SUPABASE_KEY);
const $=s=>document.querySelector(s);
let allRecords=[];

function esc(v=''){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]))}
function formatDate(v){if(!v)return '';const [y,m,d]=v.split('-');return `${d}/${m}/${y}`}

async function loadArchive(){
  const {data,error}=await db.from('memos').select('*').order('inspection_date',{ascending:false}).order('created_at',{ascending:false});
  if(error){$('#historyList').innerHTML=`<p class="error">${esc(error.message)}</p>`;return}
  allRecords=data||[];
  const customers=[...new Set(allRecords.map(r=>r.customer).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'he'));
  $('#customerFilter').innerHTML='<option value="">כל הלקוחות</option>'+customers.map(c=>`<option value="${esc(c)}">${esc(c)}</option>`).join('');
  renderArchive();
}

function renderArchive(){
  const q=$('#historySearch').value.trim().toLowerCase();
  const customer=$('#customerFilter').value;
  const filtered=allRecords.filter(r=>{
    const text=[r.customer,r.serial_number,r.summary,r.inspection_type,r.result].join(' ').toLowerCase();
    return (!q||text.includes(q))&&(!customer||r.customer===customer);
  });
  $('#historyCount').textContent=`נמצאו ${filtered.length} תסקירים`;
  $('#historyList').innerHTML=filtered.length?filtered.map(r=>`
    <article class="history-card" data-id="${r.id}">
      <div class="history-card-main">
        <strong>${esc(r.serial_number||'ללא מספר סידורי')}</strong>
        <span>${esc(r.customer||'ללא לקוח')}</span>
        <small>${formatDate(r.inspection_date)} · ${esc(r.inspection_type||'')} · ${esc(r.result||'')}</small>
      </div>
      <button class="outline open-details" data-id="${r.id}">פתח</button>
    </article>`).join(''):'<p class="empty-state">לא נמצאו תסקירים מתאימים.</p>';
  document.querySelectorAll('.open-details').forEach(b=>b.onclick=()=>openDetails(Number(b.dataset.id)));
}

function sectionTable(title,headers,rows){
  if(!rows?.length)return '';
  return `<section class="detail-section"><h3>${title}</h3><div class="table-wrap"><table><thead><tr>${headers.map(h=>`<th>${h}</th>`).join('')}</tr></thead><tbody>${rows.join('')}</tbody></table></div></section>`;
}

function openDetails(id){
  const r=allRecords.find(x=>x.id===id);if(!r)return;
  $('#detailTitle').textContent=`תסקיר ${r.serial_number||''}`;
  const items=(r.items||[]).map((x,i)=>`<tr><td>${i+1}</td><td>${esc(x.description)}</td><td>${esc(x.manufacturer)}</td><td>${esc(x.serial_number)}</td><td>${esc(x.load)}</td><td>${esc(x.angle)}</td><td>${esc(x.price)}</td></tr>`);
  const defects=(r.defects||[]).map((x,i)=>`<tr><td>${i+1}</td><td>${esc(x.description)}</td><td>${esc(x.internal_number)}</td><td>${formatDate(x.due_date)}</td></tr>`);
  $('#detailsContent').innerHTML=`
    <div class="detail-grid">
      <div><b>לקוח</b><span>${esc(r.customer||'')}</span></div>
      <div><b>מספר סידורי</b><span>${esc(r.serial_number||'')}</span></div>
      <div><b>תאריך בדיקה</b><span>${formatDate(r.inspection_date)}</span></div>
      <div><b>בדיקה הבאה</b><span>${formatDate(r.next_inspection_date)}</span></div>
      <div><b>סוג בדיקה</b><span>${esc(r.inspection_type||'')}</span></div>
      <div><b>תוצאה</b><span>${esc(r.result||'')}</span></div>
    </div>
    <section class="detail-section"><h3>תיאור כללי</h3><p>${esc(r.summary||'')}</p></section>
    ${sectionTable('אביזרי הרמה',['#','תיאור','יצרן','מספר סידורי','עומס','זווית','מחיר'],items)}
    ${sectionTable('ליקויים ואמצעים לתיקון',['#','תיאור','מספר פנימי','תאריך אחרון'],defects)}
    <div class="dialog-actions"><a class="nav-button" href="index.html?id=${r.id}">פתח לעריכה</a></div>`;
  $('#detailsDialog').showModal();
}

$('#historySearch').oninput=renderArchive;
$('#customerFilter').onchange=renderArchive;
$('#closeDialog').onclick=()=>$('#detailsDialog').close();
$('#detailsDialog').addEventListener('click',e=>{if(e.target===$('#detailsDialog'))$('#detailsDialog').close()});
loadArchive();