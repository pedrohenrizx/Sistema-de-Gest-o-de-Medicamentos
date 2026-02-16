// SPA State
let currentUser = null;
let currentPage = "dashboard";

// Utilitário para alternar tema
function setTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('theme', theme);
  // Alterna ícones
  document.getElementById('sun').classList.toggle('hidden', theme !== 'light');
  document.getElementById('moon').classList.toggle('hidden', theme === 'light');
}

// Alternância de tema
document.getElementById('theme-toggle').onclick = function () {
  const newTheme = document.documentElement.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
  setTheme(newTheme);
  if (currentUser) updateUserTheme(newTheme);
};

function updateUserTheme(theme) {
  fetch('/api/profile', { credentials: 'include' })
    .then(res => res.json())
    .then(user => {
      fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ theme })
      });
    });
}

// Navbar SPA
function loadPage(page) {
  currentPage = page;
  if (!currentUser && page !== 'login') {
    showAuthModal('login');
    return;
  }

  // Destaque na navbar
  document.querySelectorAll('#navbar-menu li a').forEach(a => {
    a.classList.toggle('active', a.dataset.page === page);
  });

  // Conteúdo dinâmico
  const appContent = document.getElementById('app-content');
  switch (page) {
    case 'dashboard':
      appContent.innerHTML = `<section class="p-4 w-full max-w-xl">
        <h2 class="font-bold text-2xl mb-2">Bem-vindo, ${currentUser ? currentUser.username : ''}</h2>
        <p>Aqui está o seu resumo de adesão e próximos lembretes de medicação.</p>
        <div class="mt-4"><canvas id="progressoChart"></canvas></div>
      </section>`;
      if (currentUser) renderProgressoChart();
      break;
    case 'medicamentos':
      appContent.innerHTML = `<section class="p-4 w-full max-w-xl">
        <h2 class="font-bold text-xl mb-2">Seus Medicamentos</h2>
        <div id="medicamentos-list"></div>
        <button class="btn btn-primary mt-4" id="adicionar-medicamento">Adicionar Medicamento</button>
      </section>`;
      loadMedicamentos();
      break;
    case 'calendario':
      appContent.innerHTML = `<section class="p-4 w-full max-w-xl">
        <h2 class="font-bold text-xl mb-2">Calendário de Administração</h2>
        <div id="calendario-grid"></div>
      </section>`;
      loadCalendario();
      break;
    case 'relatorios':
      appContent.innerHTML = `<section class="p-4 w-full max-w-xl">
        <h2 class="font-bold text-xl mb-2">Relatórios</h2>
        <button class="btn btn-outline btn-success mb-2" id="baixar-relatorio">Baixar Relatório (PDF)</button>
        <div id="relatorio-content"></div>
      </section>`;
      bindBaixarRelatorio();
      break;
    case 'perfil':
      appContent.innerHTML = `<section class="p-4 w-full max-w-xl">
        <h2 class="font-bold text-xl mb-2">Perfil</h2>
        <div><b>Usuário:</b> ${currentUser.username}</div>
        <div class="mt-4">
          <button class="btn btn-outline btn-error" id="logout-btn-2">Sair</button>
        </div>
      </section>`;
      document.getElementById('logout-btn-2').onclick = logout;
      break;
    default:
      appContent.innerHTML = `<div class="p-4">Página não encontrada</div>`;
  }
}

function showAuthModal(mode) {
  document.getElementById('auth-modal').classList.add('modal-open');
  document.getElementById('form-title').innerText = mode === 'login' ? 'Entrar' : 'Cadastrar';
  document.querySelector('#auth-form button[type=submit]').innerText = mode === 'login' ? 'Entrar' : 'Cadastrar';
  document.getElementById('toggle-auth').innerText = mode === 'login' ? 'Cadastrar' : 'Entrar';
  document.getElementById('auth-error').innerText = '';
  document.getElementById('register-extra').classList.toggle('hidden', mode === 'login');
  document.getElementById('auth-form').dataset.mode = mode;
  document.getElementById('auth-form').reset();
}

function hideAuthModal() {
  document.getElementById('auth-modal').classList.remove('modal-open');
}

function checkAuth() {
  fetch('/api/profile', { credentials: 'include' })
    .then(r => r.ok ? r.json() : Promise.reject())
    .then(user => {
      currentUser = user;
      setTheme(user.theme || localStorage.getItem('theme') || 'light');
      document.getElementById('logout-btn').classList.remove('hidden');
      hideAuthModal();
      loadPage(currentPage);
    })
    .catch(() => {
      currentUser = null;
      document.getElementById('logout-btn').classList.add('hidden');
      showAuthModal('login');
    });
}

function login(username, password) {
  fetch('/api/login', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  })
    .then(r => r.json().then(data => ({ ok: r.ok, data })))
    .then(({ ok, data }) => {
      if (ok) {
        currentUser = data.user;
        setTheme(currentUser.theme || 'light');
        hideAuthModal();
        document.getElementById('logout-btn').classList.remove('hidden');
        loadPage('dashboard');
      } else
// ... (continua o restante do código original)

// Função para carregar medicamentos do usuário e montar lista
function loadMedicamentos() {
  fetch('/api/medicamentos', { credentials: 'include' })
    .then(r => r.json())
    .then(meds => {
      const list = document.getElementById('medicamentos-list');
      if (!meds.length) {
        list.innerHTML = `<div class="text-gray-500">Nenhum medicamento cadastrado.</div>`;
      } else {
        list.innerHTML = meds.map(m => `
          <div class="card shadow p-4 flex flex-col md:flex-row items-center justify-between my-2">
            <div>
              <div class="font-bold">${m.nome}</div>
              <div class="text-sm">${m.dosagem} &middot; ${m.frequencia}</div>
            </div>
            <button class="btn btn-error btn-xs ml-2" data-remove="${m.id}">Remover</button>
          </div>
        `).join('');
        // Bind remover
        list.querySelectorAll('[data-remove]').forEach(btn => {
          btn.onclick = () => {
            fetch(`/api/medicamentos/${btn.dataset.remove}`, {
              method: 'DELETE',
              credentials: 'include'
            }).then(() => loadMedicamentos());
          };
        });
      }
      document.getElementById('adicionar-medicamento').onclick = showAddMedicamentoModal;
    });
}

// Modal para adicionar medicamento
function showAddMedicamentoModal() {
  let modal = document.createElement('div');
  modal.className = "modal modal-open";
  modal.innerHTML = `
    <div class="modal-box">
      <form id="add-medicamento-form" class="space-y-4">
        <h3 class="font-bold text-lg">Adicionar Medicamento</h3>
        <input name="nome" required class="input input-bordered w-full" placeholder="Nome do medicamento">
        <input name="dosagem" required class="input input-bordered w-full" placeholder="Dosagem (ex: 500mg)">
        <input name="frequencia" required class="input input-bordered w-full" placeholder="Frequência (ex: 2x ao dia)">
        <div class="flex justify-end gap-2">
          <button type="submit" class="btn btn-primary">Salvar</button>
          <button type="button" class="btn btn-ghost" id="close-modal">Cancelar</button>
        </div>
        <div class="text-error text-sm mt-2" id="add-medicamento-error"></div>
      </form>
    </div>
  `;
  document.body.appendChild(modal);
  modal.querySelector('#close-modal').onclick = () => modal.remove();
  modal.querySelector('#add-medicamento-form').onsubmit = function(e) {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(this));
    fetch('/api/medicamentos', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    .then(r => r.ok ? r.json() : r.json().then(err => Promise.reject(err)))
    .then(() => {
      modal.remove();
      loadMedicamentos();
    })
    .catch(err => {
      modal.querySelector('#add-medicamento-error').innerText = err.error || 'Erro ao adicionar medicamento';
    });
  };
}

// Calendário de administração (simples, só exibe medicamentos e botão para marcar dose)
function loadCalendario() {
  fetch('/api/medicamentos', { credentials: 'include' })
    .then(r => r.json())
    .then(meds => {
      const grid = document.getElementById('calendario-grid');
      if (!meds.length) {
        grid.innerHTML = `<div class="text-gray-500">Nenhum medicamento cadastrado.</div>`;
        return;
      }
      grid.innerHTML = meds.map(m => `
        <div class="card shadow p-3 my-2">
          <div class="flex items-center justify-between">
            <div>
              <div class="font-bold">${m.nome} (${m.dosagem})</div>
              <div class="text-sm text-gray-500">${m.frequencia}</div>
            </div>
            <button class="btn btn-success btn-xs" data-tomar="${m.id}">Tomar Dose</button>
          </div>
          <div class="text-xs mt-2" id="historico-${m.id}"></div>
        </div>
      `).join('');
      // Bind tomar dose
      grid.querySelectorAll('[data-tomar]').forEach(btn => {
        btn.onclick = () => {
          const medId = btn.dataset.tomar;
          const now = new Date();
          const data_hora = now.toLocaleString();
          fetch('/api/administracoes', {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ medicamento_id: medId, data_hora, dose: "1" })
          }).then(() => loadCalendario());
        };
      });
      // Carregar histórico de doses
      meds.forEach(m => {
        fetch(`/api/administracoes/${m.id}`, { credentials: 'include' })
          .then(r => r.json())
          .then(adms => {
            const hist = document.getElementById(`historico-${m.id}`);
            if (!adms.length) {
              hist.innerHTML = '<span class="text-gray-400">Nenhuma dose registrada.</span>';
            } else {
              hist.innerHTML = 'Doses tomadas:<br>' + adms.map(a => `<span class="badge badge-sm badge-success mx-1 my-1">${a.data_hora}</span>`).join(' ');
            }
          });
      });
    });
}

// Relatórios
function bindBaixarRelatorio() {
  document.getElementById('baixar-relatorio').onclick = function() {
    fetch('/api/relatorio', { credentials: 'include' })
      .then(r => r.blob())
      .then(blob => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = "relatorio.pdf";
        document.body.appendChild(a);
        a.click();
        a.remove();
      });
  };
}