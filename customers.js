const SUPABASE_URL='https://mosexjnulqhlulnliazv.supabase.co';
const SUPABASE_KEY='sb_publishable_eoxClJS-KpkzHZMudL_eBQ_IGrlLbj-';
const db=supabase.createClient(SUPABASE_URL,SUPABASE_KEY);
const $=s=>document.querySelector(s);
let customers=[];

const els={
  id:$('#customerId'),name:$('#customerName'),phone:$('#customerPhone'),email:$('#customerEmail'),
  address:$('#customerAddress'),vehicle:$('#vehicleNumber'),notes:$('#customerNotes'),details:$('#customerDetails'),
  search:$('#customerSearch'),list:$('#customersList'),status:$('#customerStatus'),history:$('#customerHistory'),memos:$('#customerMemos'),title:$('#formTitle')
};

function setStatus(message,type='ok'){els.status.textContent=message;els.status.className='status '+type}
function escapeHtml(value=''){return String(value).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}
function payload(){return{name:els.name.value.trim(),phone:els.phone.value.trim(),email:els.email.value.trim(),address:els.address.value.trim(),vehicle_number:els.vehicle.value.trim(),notes:els.notes.value.trim(),details:els.details.value.trim(),updated_at:new Date().toISOString()}}

async function loadCustomers(){
  const {data,error}=await db.from('customers').select('*').eq('active',true).order('name');
  if(error){setStatus('יש להריץ את supabase-migration-v2.sql ב-Supabase','error');return}
  customers=data||[];renderCustomers();
}

function renderCustomers(){
  const q=els.search.value.trim().toLowerCase();
  els.list.innerHTML='';
  customers.filter(c=>[c.name,c.phone,c.email,c.vehicle_number,c.address].join(' ').toLowerCase().includes(q)).forEach(c=>{
    const card=document.createElement('div');card.className='record';
    card.innerHTML=`<strong>${escapeHtml(c.name)}</strong><small>${escapeHtml(c.phone||'')} ${c.vehicle_number?'· רכב '+escapeHtml(c.vehicle_number):''}</small>`;
    card.onclick=()=>openCustomer(c);els.list.append(card);
  });
  if(!els.list.children.length)els.list.innerHTML='<div class="empty-state">לא נמצאו לקוחות</div>';
}

async function openCustomer(c){
  els.id.value=c.id;els.name.value=c.name||'';els.phone.value=c.phone||'';els.email.value=c.email||'';els.address.value=c.address||'';
  els.vehicle.value=c.vehicle_number||'';els.notes.value=c.notes||'';els.details.value=c.details||'';els.title.textContent='עריכת לקוח';
  await loadCustomerMemos(c);scrollTo({top:0,behavior:'smooth'});
}

async function loadCustomerMemos(customer){
  const {data,error}=await db.from('memos').select('id,memo_number,serial_number,inspection_date,result,customer,customer_id').or(`customer_id.eq.${customer.id},customer.eq.${customer.name}`).order('created_at',{ascending:false});
  els.history.hidden=false;els.memos.innerHTML='';
  if(error){els.memos.innerHTML='<div class="empty-state">לא ניתן לטעון היסטוריה</div>';return}
  (data||[]).forEach(m=>{
    const a=document.createElement('a');a.className='record';a.href=`index.html?id=${m.id}`;
    a.innerHTML=`<strong>תסקיר ${escapeHtml(m.memo_number||m.serial_number||m.id)}</strong><small>${escapeHtml(m.inspection_date||'')} ${m.result?'· '+escapeHtml(m.result):''}</small>`;els.memos.append(a);
  });
  if(!els.memos.children.length)els.memos.innerHTML='<div class="empty-state">אין תסקירים ללקוח זה</div>';
}

async function saveCustomer(){
  const data=payload();if(!data.name)return setStatus('חובה להזין שם לקוח','error');
  const id=Number(els.id.value);const query=id?db.from('customers').update(data).eq('id',id).select().single():db.from('customers').insert(data).select().single();
  const {data:saved,error}=await query;if(error)return setStatus(error.message,'error');
  setStatus('פרטי הלקוח נשמרו');await loadCustomers();if(saved)openCustomer(saved);
}

function resetForm(){
  els.id.value='';[els.name,els.phone,els.email,els.address,els.vehicle,els.notes,els.details].forEach(x=>x.value='');
  els.title.textContent='לקוח חדש';els.history.hidden=true;els.memos.innerHTML='';setStatus('');
}

$('#saveCustomerBtn').onclick=saveCustomer;$('#newCustomerBtn').onclick=resetForm;els.search.oninput=renderCustomers;
loadCustomers();
