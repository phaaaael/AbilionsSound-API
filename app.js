
const entradaUrlServidor = document.getElementById('serverUrl');
const botaoConectar = document.getElementById('connectBtn');
const elementoStatus = document.getElementById('status');
const listaMusicasEl = document.getElementById('songList');
const audioEl = document.getElementById('audio');
const tocandoAgoraEl = document.getElementById('nowPlaying');
const playPauseBtn = document.getElementById('playPauseBtn');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const rewindBtn = document.getElementById('rewindBtn');
const forwardBtn = document.getElementById('forwardBtn');
const progressBar = document.getElementById('progressBar');
const currentTimeEl = document.getElementById('currentTime');
const totalTimeEl = document.getElementById('totalTime');
const volumeRange = document.getElementById('volumeRange');
const toggleThemeBtn = document.getElementById('toggleTheme');

let musicasDisponiveis = [];
let musicaAtualIndex = -1;
let isPlaying = false;

const menuToggle = document.getElementById('menuToggle');
const sideMenu = document.getElementById('sideMenu');
const closeMenu = document.getElementById('closeMenu');
menuToggle.onclick = () => { sideMenu.classList.add('open'); menuToggle.setAttribute('aria-expanded','true'); };
closeMenu.onclick = () => { sideMenu.classList.remove('open'); menuToggle.setAttribute('aria-expanded','false'); };


const urlSalva = localStorage.getItem('urlServidor') ?? localStorage.getItem('serverUrl');
if (urlSalva) entradaUrlServidor.value = urlSalva;

function juntarUrl(base, relativo) {
  try {
    return new URL(relativo, base).href;
  } catch {
    return base.replace(/\/+$/, '') + '/' + relativo.replace(/^\/+/, '');
  }
}

async function buscarJSON(url) {
  const resposta = await fetch(url);
  if (!resposta.ok) throw new Error(`HTTP ${resposta.status}`);
  return resposta.json();
}

function definirStatus(mensagem) {
  elementoStatus.textContent = mensagem;
}

botaoConectar.addEventListener('click', async () => {
  const base = entradaUrlServidor.value.trim().replace(/\/$/, '');
  if (!base) { definirStatus('Informe a URL do servidor.'); return; }

  localStorage.setItem('urlServidor', base);
  localStorage.setItem('serverUrl', base);

  definirStatus('Conectando…');
  try {
    const saude = await buscarJSON(juntarUrl(base, '/api/saude'));
    definirStatus(`Conectado. ${saude.count} músicas disponíveis.`);
    const musicas = await buscarJSON(juntarUrl(base, '/api/musicas'));
    renderizarMusicas(base, musicas);
  } catch (erro) {
    definirStatus('Falha ao conectar. Verifique a URL e a rede.');
    console.error(erro);
  }
});

function renderizarMusicas(base, musicas) {
  musicasDisponiveis = musicas;
  listaMusicasEl.innerHTML = '';
  if (!musicas.length) {
    listaMusicasEl.innerHTML = '<li>Nenhuma música encontrada no servidor.</li>';
    return;
  }

  musicas.forEach((musica, index) => {
    const li = document.createElement('li');

    const blocoMeta = document.createElement('div');
    blocoMeta.className = 'meta';

    const tituloEl = document.createElement('div');
    tituloEl.className = 'title';
    tituloEl.textContent = musica.title || '(Sem título)';

    const artistaEl = document.createElement('div');
    artistaEl.className = 'artist';
    artistaEl.textContent = musica.artist || 'Desconhecido';

    blocoMeta.appendChild(tituloEl);
    blocoMeta.appendChild(artistaEl);

    const botaoTocar = document.createElement('button');
    botaoTocar.textContent = 'Tocar';
    botaoTocar.addEventListener('click', () => {
      musicaAtualIndex = index;
      tocarMusica(base, musica);
    });

    li.appendChild(blocoMeta);
    li.appendChild(botaoTocar);
    listaMusicasEl.appendChild(li);
  });
}

function tocarMusica(base, musica) {
  const url = musica.url?.startsWith('http') ? musica.url : juntarUrl(base, musica.url);
  audioEl.src = url;
  audioEl.play().catch(console.error);
  tocandoAgoraEl.textContent = `Tocando: ${musica.title} — ${musica.artist}`;
}

function formatarTempo(segundos) {
  const minutos = Math.floor(segundos / 60);
  const segs = Math.floor(segundos % 60);
  return `${minutos}:${segs.toString().padStart(2, '0')}`;
}

function atualizarProgresso() {
  if (audioEl.duration) {
    const progresso = (audioEl.currentTime / audioEl.duration) * 100;
    progressBar.value = progresso;
    currentTimeEl.textContent = formatarTempo(audioEl.currentTime);
    totalTimeEl.textContent = formatarTempo(audioEl.duration);
  }
}

function tocarPausar() {
  if (isPlaying) {
    audioEl.pause();
    playPauseBtn.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24"><path fill="currentColor" d="M8 5v14l11-7z"/></svg>';
    isPlaying = false;
  } else {
    audioEl.play().catch(console.error);
    playPauseBtn.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24"><path fill="currentColor" d="M6 19h4V5H6m8 14h4V5h-4Z"/></svg>';
    isPlaying = true;
  }
}

function musicaAnterior() {
  if (musicaAtualIndex > 0) {
    musicaAtualIndex--;
    const base = localStorage.getItem('urlServidor');
    tocarMusica(base, musicasDisponiveis[musicaAtualIndex]);
  }
}

function proximaMusica() {
  if (musicaAtualIndex < musicasDisponiveis.length - 1) {
    musicaAtualIndex++;
    const base = localStorage.getItem('urlServidor');
    tocarMusica(base, musicasDisponiveis[musicaAtualIndex]);
  }
}

function retroceder() { audioEl.currentTime = Math.max(0, audioEl.currentTime - 10); }
function avancar() { audioEl.currentTime = Math.min(audioEl.duration || 0, audioEl.currentTime + 10); }
function alterarProgresso() {
  if (audioEl.duration) {
    const novoTempo = (progressBar.value / 100) * audioEl.duration;
    audioEl.currentTime = novoTempo;
  }
}
function alterarVolume() { audioEl.volume = volumeRange.value; }

playPauseBtn.addEventListener('click', tocarPausar);
prevBtn.addEventListener('click', musicaAnterior);
nextBtn.addEventListener('click', proximaMusica);
rewindBtn.addEventListener('click', retroceder);
forwardBtn.addEventListener('click', avancar);
progressBar.addEventListener('input', alterarProgresso);
volumeRange.addEventListener('input', alterarVolume);

audioEl.addEventListener('timeupdate', atualizarProgresso);
audioEl.addEventListener('loadedmetadata', () => {
  totalTimeEl.textContent = formatarTempo(audioEl.duration);
});
audioEl.addEventListener('play', () => {
  playPauseBtn.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24"><path fill="currentColor" d="M6 19h4V5H6m8 14h4V5h-4Z"/></svg>';
  isPlaying = true;
});
audioEl.addEventListener('pause', () => {
  playPauseBtn.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24"><path fill="currentColor" d="M8 5v14l11-7z"/></svg>';
  isPlaying = false;
});
audioEl.addEventListener('ended', proximaMusica);


function aplicarTema(modo /* 'dark' | 'light' */) {
  const isLight = modo === 'light';
  document.body.classList.remove('dark-mode'); // legado
  document.documentElement.setAttribute('data-theme', isLight ? 'light' : 'dark');
  if (isLight) {
    document.body.classList.add('light-mode');
    toggleThemeBtn.querySelector('.theme-icon').textContent = '🌙';
    toggleThemeBtn.setAttribute('aria-label','Alternar para modo escuro');
  } else {
    document.body.classList.remove('light-mode');
    toggleThemeBtn.querySelector('.theme-icon').textContent = '☀️';
    toggleThemeBtn.setAttribute('aria-label','Alternar para modo claro');
  }
  localStorage.setItem('tema', modo);
  toggleThemeBtn.setAttribute('aria-pressed', String(isLight));
}

function alternarTema() {
  const atual = localStorage.getItem('tema') || 'dark';
  const proximo = atual === 'light' ? 'dark' : 'light';
  aplicarTema(proximo);
}

(function initTema(){
  let tema = localStorage.getItem('tema');
  if (!tema) {
    const prefereLight = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches;
    tema = prefereLight ? 'light' : 'dark';
  }
  aplicarTema(tema);
  if (window.matchMedia && !localStorage.getItem('tema')) {
    const mq = window.matchMedia('(prefers-color-scheme: light)');
    try { mq.addEventListener('change', e => aplicarTema(e.matches ? 'light' : 'dark')); } catch {}
  }
})();

toggleThemeBtn.addEventListener('click', alternarTema);
