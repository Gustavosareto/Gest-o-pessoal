const $ = s => document.querySelector(s), K = 'caixa.v1';

// Categorias: id: [emoji, nome, palavras-chave separadas por |]
const C = {
  expense: {
    comida: ['🍔', 'Comida', 'mcdonald|burger king|kfc|subway|starbucks|costa|cafe|padaria|restaurante|restaurant|lanche|almoco|jantar|pizza|sushi|burger|kebab|ifood|uber eats|deliveroo|just eat|glovo|bar|pub|cerveja|sorvete|sanduiche|nando|five guys|domino|takeaway|delivery|brunch'],
    mercado: ['🛒', 'Mercado', 'mercado|supermercado|lidl|aldi|tesco|dunnes|supervalu|spar|centra|continente|pingo doce|mercadona|carrefour|auchan|feira|acougue|grocer'],
    transporte: ['🚕', 'Transporte', 'uber|bolt|freenow|free now|taxi|onibus|bus|luas|dart|metro|trem|train|irish rail|leap|gasolina|combustivel|posto|estacionamento|parking|pedagio|bike|scooter|carro|oficina'],
    moradia: ['🏠', 'Moradia', 'aluguel|rent|condominio|hipoteca|mortgage|ikea|moveis|reforma|senhorio|landlord'],
    contas: ['💡', 'Contas', 'luz|energia|eletricidade|electric|agua|gas|internet|wifi|vodafone|three|eir|virgin media|telemovel|celular|telefone|imposto|tax|multa|seguro|insurance|tarifa|anuidade|bill'],
    saude: ['💊', 'Saúde', 'farmacia|pharmacy|boots|remedio|medico|doctor|gp|hospital|dentista|dentist|consulta|exame|clinica|psicologo|terapia|academia|gym|ginasio|pilates|optica|oculos|suplemento|whey'],
    lazer: ['🎬', 'Lazer', 'cinema|teatro|show|concerto|concert|festival|balada|club|jogo|game|steam|playstation|xbox|nintendo|ingresso|museu|parque|passeio|bowling|karaoke|ticketmaster|eventbrite'],
    assinaturas: ['🔁', 'Assinaturas', 'netflix|spotify|disney|hbo|max|prime video|amazon prime|youtube premium|apple music|icloud|google one|chatgpt|openai|anthropic|github|notion|dropbox|adobe|canva|figma|microsoft 365|assinatura|subscription|mensalidade|sky|vercel|supabase|dominio|hosting|namecheap|cloudflare'],
    compras: ['🛍️', 'Compras', 'amazon|zara|primark|penneys|shein|aliexpress|temu|ebay|roupa|sapato|tenis|camisa|calca|vestido|eletronico|presente|gift'],
    educacao: ['📚', 'Educação', 'curso|udemy|coursera|faculdade|universidade|college|matricula|livro|book|escola|school|aula|workshop|mentoria|tuition|propina|alura|duolingo'],
    viagem: ['✈️', 'Viagem', 'ryanair|aer lingus|easyjet|tap|latam|airline|aviao|voo|flight|hotel|hostel|airbnb|booking|hospedagem|viagem|trip|passaporte|visto|visa|bagagem|turismo|tour'],
    outros: ['📦', 'Outros', '']
  },
  income: {
    salario: ['💼', 'Salário', 'salario|salary|payroll|ordenado|holerite|contracheque|paycheck|wage|bonus|ferias'],
    freelance: ['🧑‍💻', 'Freelance', 'freelance|freela|cliente|client|projeto|project|landing|site|invoice|fatura|consultoria|servico'],
    vendas: ['🏷️', 'Vendas', 'venda|vendi|sold|sale|vinted|olx|donedeal|depop|ebay'],
    reembolso: ['↩️', 'Reembolso', 'reembolso|refund|estorno|devolucao|cashback|reimbursement'],
    rendimentos: ['📈', 'Rendimentos', 'rendimento|juros|interest|dividendo|dividend|investimento|investment'],
    presente: ['🎁', 'Presente', 'presente|gift|aniversario|mesada|doacao'],
    outras: ['💶', 'Outras entradas', '']
  }
};

const db = JSON.parse(localStorage.getItem(K) || '{"tx":[],"learned":{}}');
const save = () => localStorage.setItem(K, JSON.stringify(db));
const todayStr = () => new Date(Date.now() - new Date().getTimezoneOffset() * 6e4).toISOString().slice(0, 10);
const state = { type: 'expense', cat: null, editing: null, month: todayStr().slice(0, 7) };

const norm = s => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/['’`]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
const has = (t, k) => new RegExp('(^| )' + k + (k.length < 4 ? '( |$)' : '')).test(t);
const esc = s => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const eur = c => (c / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'EUR' });

// Detecta a categoria pela descrição: o que você já corrigiu antes vence; depois, a palavra-chave mais específica
function detect(text, type) {
  const t = norm(text);
  if (!t) return null;
  let best = null, score = 0;
  for (const [k, c] of Object.entries(db.learned)) {
    const i = k.indexOf(':'), ty = k.slice(0, i), key = k.slice(i + 1);
    if (ty === type && has(t, key) && 1000 + key.length > score) { best = c; score = 1000 + key.length; }
  }
  for (const [id, [, , kw]] of Object.entries(C[type]))
    for (const w of kw.split('|')) if (w && w.length > score && has(t, w)) { best = id; score = w.length; }
  return best;
}

let tt;
function toast(msg, undo) {
  const el = $('#toast');
  el.innerHTML = `<span>${msg}</span>` + (undo ? '<button>Desfazer</button>' : '');
  if (undo) el.querySelector('button').onclick = () => { undo(); el.classList.remove('on'); };
  el.classList.add('on');
  clearTimeout(tt);
  tt = setTimeout(() => el.classList.remove('on'), 5000);
}

function renderCats() {
  const sel = state.cat || detect($('#desc').value, state.type);
  $('#cats').innerHTML = Object.entries(C[state.type]).map(([id, [e, n]]) =>
    `<button type="button" class="chip" data-id="${id}" aria-pressed="${id === sel}">${e} ${n}</button>`).join('');
  $('#autoNote').textContent = state.cat ? '(escolhida por você)' : sel ? '(automática)' : '(preenchida pela descrição)';
}

function dayLabel(d) {
  const y = new Date(Date.now() - 864e5 - new Date().getTimezoneOffset() * 6e4).toISOString().slice(0, 10);
  if (d === todayStr()) return 'Hoje';
  if (d === y) return 'Ontem';
  return new Date(d + 'T12:00').toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short' });
}

function render() {
  const [y, m] = state.month.split('-');
  const monthName = new Date(+y, +m - 1, 1).toLocaleDateString('pt-BR', { month: 'long' });
  $('#monthLabel').textContent = `${monthName} de ${y}`;
  const sum = (a, ty) => a.filter(t => t.type === ty).reduce((s, t) => s + t.cents, 0);
  const mt = db.tx.filter(t => t.date.startsWith(state.month)).sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id);
  const inc = sum(mt, 'income'), exp = sum(mt, 'expense'), net = inc - exp, total = sum(db.tx, 'income') - sum(db.tx, 'expense');

  $('#total').textContent = eur(total);
  $('#total').classList.toggle('neg', total < 0);
  $('#inc').textContent = eur(inc);
  $('#exp').textContent = eur(exp);
  $('#net').textContent = (net > 0 ? '+ ' : net < 0 ? '− ' : '') + eur(Math.abs(net));
  $('#net').className = net > 0 ? 'pos' : net < 0 ? 'neg' : '';

  const pct = inc ? Math.round(exp / inc * 100) : null;
  $('#ratioBar').style.width = (pct === null ? (exp ? 100 : 0) : Math.min(pct, 100)) + '%';
  $('#ratioBar').classList.toggle('over', pct === null ? exp > 0 : pct > 100);
  $('#ratioText').textContent = pct !== null ? `Você gastou ${pct}% do que recebeu em ${monthName}.`
    : exp ? `Você ainda não registrou entradas em ${monthName}.` : `Nada registrado em ${monthName} ainda.`;

  const by = {};
  mt.filter(t => t.type === 'expense').forEach(t => by[t.cat] = (by[t.cat] || 0) + t.cents);
  const rows = Object.entries(by).sort((a, b) => b[1] - a[1]);
  $('#breakdown').innerHTML = rows.length ? rows.map(([id, v]) => {
    const [e, n] = C.expense[id] || C.expense.outros;
    return `<div class="row"><span>${e} ${n}</span><span class="track"><i style="width:${v / rows[0][1] * 100}%"></i></span><span class="num">${eur(v)}<small>${Math.round(v / exp * 100)}%</small></span></div>`;
  }).join('') : '<p class="empty">Seus gastos por categoria aparecem aqui.</p>';

  let last = '', h = '';
  for (const t of mt) {
    if (t.date !== last) { last = t.date; h += `<h3>${dayLabel(t.date)}</h3>`; }
    const [e, n] = C[t.type][t.cat] || ['📦', 'Outros'], inc = t.type === 'income';
    h += `<div class="tx${t.id === state.editing ? ' editing' : ''}"><span class="ico">${e}</span><span class="what"><b>${esc(t.desc)}</b><small>${n}</small></span><span class="num ${inc ? 'pos' : ''}">${inc ? '+' : '−'} ${eur(t.cents)}</span><span class="acts"><button class="edit" data-id="${t.id}" aria-label="Editar ${esc(t.desc)}">✎</button><button class="del" data-id="${t.id}" aria-label="Excluir ${esc(t.desc)}">✕</button></span></div>`;
  }
  $('#list').innerHTML = h || `<p class="empty">Nenhum lançamento em ${monthName}. Registre o primeiro no formulário.</p>`;
}

// Valor formatado enquanto digita (digitação em centavos: 1 → 0,01 · 150 → 1,50)
$('#amount').oninput = e => {
  const d = e.target.value.replace(/\D/g, '').slice(0, 9);
  e.target.value = d ? (+d / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '';
};
$('#desc').oninput = renderCats;
$('#cats').onclick = e => {
  const b = e.target.closest('.chip');
  if (!b) return;
  state.cat = state.cat === b.dataset.id ? null : b.dataset.id;
  renderCats();
};
function updateForm() {
  const ed = state.editing !== null;
  document.querySelectorAll('.seg button').forEach(x => x.setAttribute('aria-checked', x.dataset.type === state.type));
  $('#submit').textContent = ed ? 'Salvar alterações' : state.type === 'income' ? 'Adicionar entrada' : 'Adicionar gasto';
  $('#formTitle').textContent = ed ? 'Editar lançamento' : 'Novo lançamento';
  $('#cancel').hidden = !ed;
  renderCats();
}
document.querySelectorAll('.seg button').forEach(b => b.onclick = () => { state.type = b.dataset.type; state.cat = null; updateForm(); });

function resetForm(keepDate) {
  state.editing = null; state.cat = null;
  $('#amount').value = ''; $('#desc').value = '';
  if (!keepDate) $('#date').value = todayStr();
  updateForm();
}

function startEdit(id) {
  const t = db.tx.find(x => x.id === id);
  if (!t) return;
  state.editing = id; state.type = t.type;
  state.cat = detect(t.desc, t.type) === t.cat ? null : t.cat; // se foi escolhida à mão, mantém; senão volta a ser automática
  $('#amount').value = (t.cents / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 });
  $('#desc').value = t.desc; $('#date').value = t.date;
  updateForm(); render();
  $('#form').scrollIntoView({ block: 'nearest' });
  $('#desc').focus();
}

$('#form').onsubmit = e => {
  e.preventDefault();
  const cents = +$('#amount').value.replace(/\D/g, ''), desc = $('#desc').value.trim(), date = $('#date').value;
  if (!cents || !desc || !date) return;
  const auto = detect(desc, state.type);
  const cat = state.cat || auto || (state.type === 'income' ? 'outras' : 'outros');
  if (state.cat && state.cat !== auto) db.learned[state.type + ':' + norm(desc)] = state.cat; // aprende com a correção
  const t = db.tx.find(x => x.id === state.editing), wasEdit = !!t;
  if (t) Object.assign(t, { type: state.type, cents, desc, cat, date });
  else db.tx.push({ id: Date.now(), type: state.type, cents, desc, cat, date });
  save();
  state.month = date.slice(0, 7);
  resetForm(!wasEdit); render();
  toast(wasEdit ? 'Lançamento atualizado' : `${state.type === 'income' ? 'Entrada' : 'Gasto'} adicionado em ${C[state.type][cat][1]}`);
  $('#amount').focus();
};

$('#list').onclick = e => {
  const ed = e.target.closest('.edit'), b = e.target.closest('.del');
  if (ed) return startEdit(+ed.dataset.id);
  if (!b) return;
  const i = db.tx.findIndex(t => t.id === +b.dataset.id), [t] = db.tx.splice(i, 1);
  if (state.editing === t.id) resetForm();
  save(); render();
  toast('Lançamento excluído', () => { db.tx.splice(i, 0, t); save(); render(); });
};

const shift = n => { const [y, m] = state.month.split('-'); const d = new Date(+y, +m - 1 + n, 1); state.month = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0'); render(); };
$('#prev').onclick = () => shift(-1);
$('#next').onclick = () => shift(1);

$('#cancel').onclick = () => { resetForm(); render(); };
$('#form').onkeydown = e => { if (e.key === 'Escape' && state.editing !== null) { resetForm(); render(); } };
$('#date').value = todayStr();
render(); renderCats();
