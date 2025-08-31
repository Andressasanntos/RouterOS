
/**
 * Router Admin UI (Front‑End Demo)
 * - Login (default: admin / admin)
 * - Status, WAN, LAN/DHCP, Wireless, Port Forwarding, Firewall, Logs
 * - Admin (trocar senha), Backup/Restore (JSON), Reboot (simulado)
 * - Armazena configurações no localStorage
 * Obs.: Apenas simulação client-side, sem back-end.
 */

const $ = sel => document.querySelector(sel);
const $$ = sel => Array.from(document.querySelectorAll(sel));
const storeKey = "router_demo_config_v1";
const userKey  = "router_demo_user_v1";
const logKey   = "router_demo_logs_v1";

const defaults = {
  wan: { mode: "dhcp", ip: "", mask: "", gw: "", dns1: "1.1.1.1", dns2: "8.8.8.8", macClone: "" },
  lan: { ip: "192.168.1.1", mask: "255.255.255.0", dhcp: true, dhcpRange: "192.168.1.100-192.168.1.199", lease: 86400 },
  wifi24: { ssid: "MinhaRede_2G", password: "12345678", channel: "auto", band: "20/40MHz", hidden: false, enabled: true },
  wifi5: { ssid: "MinhaRede_5G", password: "12345678", channel: "auto", band: "80MHz", hidden: false, enabled: true },
  firewall: { spi: true, upnp: false, remoteMgmt: false, remotePort: 8080, dmz: "", parental: false },
  forwarding: [],
  qos: { enabled: false, up: 10, down: 100 },
  system: { hostname: "RouterOS", timeZone: "America/Maceio", ntp: true },
};
const defaultUser = { username: "admin", password: "admin" };

function loadConfig(){
  const c = localStorage.getItem(storeKey);
  return c ? JSON.parse(c) : structuredClone(defaults);
}
function saveConfig(cfg){
  localStorage.setItem(storeKey, JSON.stringify(cfg));
}
function loadUser(){
  const u = localStorage.getItem(userKey);
  return u ? JSON.parse(u) : structuredClone(defaultUser);
}
function saveUser(u){
  localStorage.setItem(userKey, JSON.stringify(u));
}
function pushLog(entry){
  const logs = JSON.parse(localStorage.getItem(logKey) || "[]");
  logs.unshift({ ts: new Date().toISOString(), entry });
  localStorage.setItem(logKey, JSON.stringify(logs.slice(0, 500)));
}
function getLogs(){
  return JSON.parse(localStorage.getItem(logKey) || "[]");
}
function toast(msg){
  const el = $(".toast");
  el.textContent = msg;
  el.classList.add("show");
  setTimeout(()=>el.classList.remove("show"), 2400);
}

// ROUTER
let state = { user: loadUser(), cfg: loadConfig(), page: "status" };

function setHash(page){
  location.hash = page;
}

function mount(root){
  root.innerHTML = `
    <div class="toast"></div>
    <div class="auth-wrap" id="auth" style="display:none">
      <div class="auth-card">
        <div class="logo">
          <span class="dot"></span>
          <h1>RouterOS <span class="muted">• Login</span></h1>
        </div>
        <p class="muted">Faça login para administrar seu roteador. Padrão: <code>admin / admin</code></p>
        <div class="field">
          <label>Usuário</label>
          <input class="input" id="login-user" placeholder="admin" value="admin"/>
        </div>
        <div class="field">
          <label>Senha</label>
          <input class="input" id="login-pass" type="password" placeholder="••••••••" value="admin"/>
        </div>
        <div class="row" style="margin-top:12px">
          <button class="btn" id="btn-login">Entrar</button>
          <button class="btn ghost" id="btn-login-reset">Redefinir para padrão</button>
        </div>
        <p class="help">Dica: altere a senha em <b>Admin → Credenciais</b> após entrar.</p>
      </div>
    </div>

    <div class="shell" id="shell" style="display:none">
      <aside class="sidebar">
        <div class="side-head">
          <div class="brand">
            <span class="dot"></span>
            <div>
              <strong id="brand-name">RouterOS</strong><br/>
              <span class="fw small">v1.0 • ${new Date().getFullYear()}</span>
            </div>
          </div>
          <button id="btn-logout" class="btn ghost" title="Sair">Sair</button>
        </div>
        <nav class="nav" id="nav">
          ${[
            ["status","Status"],
            ["wan","WAN (Internet)"],
            ["lan","LAN & DHCP"],
            ["wifi","Rede Wi‑Fi"],
            ["forward","Port Forwarding"],
            ["firewall","Firewall & Segurança"],
            ["logs","Logs"],
            ["admin","Admin"],
            ["system","Ferramentas do Sistema"],
          ].map(([id, label])=>`<a href="#${id}" data-page="${id}">${label}</a>`).join("")}
        </nav>
      </aside>
      <main class="content">
        <div class="header">
          <div class="breadcrumb">Painel do Roteador • <span id="crumb">Status</span></div>
          <div class="chips">
            <span class="chip" id="chip-time">--:--:--</span>
            <span class="chip">TZ: <span id="chip-tz"></span></span>
            <span class="chip">IP WAN: <span id="chip-wan-ip">–</span></span>
            <span class="chip">Wi‑Fi: <span id="chip-wifi">–</span></span>
          </div>
        </div>
        <div id="page"></div>
      </main>
    </div>
  `;

  // Auth handlers
  $("#btn-login").onclick = onLogin;
  $("#btn-login-reset").onclick = ()=>{
    state.user = structuredClone(defaultUser);
    saveUser(state.user);
    toast("Credenciais redefinidas para padrão.");
  };
  $("#btn-logout").onclick = onLogout;

  // Hash routing
  window.addEventListener("hashchange", renderPage);
  render();
}

function onLogin(){
  const u = $("#login-user").value.trim();
  const p = $("#login-pass").value;
  const cur = loadUser();
  if(u === cur.username && p === cur.password){
    sessionStorage.setItem("authed","1");
    pushLog(`Login efetuado por '${u}'`);
    render();
  } else {
    toast("Usuário ou senha inválidos.");
  }
}
function onLogout(){
  sessionStorage.removeItem("authed");
  pushLog("Logout efetuado");
  render();
}

function render(){
  const authed = sessionStorage.getItem("authed") === "1";
  $("#auth").style.display = authed ? "none" : "grid";
  $("#shell").style.display = authed ? "grid" : "none";

  if(authed){
    $("#brand-name").textContent = state.cfg.system.hostname || "RouterOS";
    $("#chip-tz").textContent = state.cfg.system.timeZone;
    $("#chip-wifi").textContent = (state.cfg.wifi24.enabled || state.cfg.wifi5.enabled) ? "Ativo" : "Desligado";
    tickClock();
    renderPage();
    if(!window._clock){
      window._clock = setInterval(tickClock, 1000);
    }
  }
}

function tickClock(){
  const fmt = new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute:"2-digit", second:"2-digit" });
  $("#chip-time").textContent = fmt.format(new Date());
}

function renderPage(){
  const page = (location.hash || "#status").slice(1);
  state.page = page;
  $$("#nav a").forEach(a=>a.classList.toggle("active", a.dataset.page===page));
  $("#crumb").textContent = $(`#nav a[data-page="${page}"]`)?.textContent || page;

  const host = $("#page");
  const cfg = state.cfg = loadConfig();
  $("#chip-wan-ip").textContent = deriveWanIp(cfg);

  const views = {
    status: viewStatus,
    wan: viewWAN,
    lan: viewLAN,
    wifi: viewWiFi,
    forward: viewForward,
    firewall: viewFirewall,
    admin: viewAdmin,
    system: viewSystem,
    logs: viewLogs,
  };
  (views[page] || viewStatus)(host, cfg);
}

/* Helpers */
function formButtonRow(extraRight=""){
  return `
    <div class="row" style="justify-content:space-between; margin-top:12px">
      <div class="row" style="gap:8px">
        <button class="btn" type="submit">Aplicar</button>
        <button class="btn secondary" type="reset">Cancelar</button>
      </div>
      ${extraRight}
    </div>`;
}

function deriveWanIp(cfg){
  if(cfg.wan.mode === "static" && cfg.wan.ip) return cfg.wan.ip;
  // Simple fake IP allocator
  const seed = Math.abs([...JSON.stringify(cfg)].reduce((a,c)=>a + c.charCodeAt(0), 0)) % 200 + 20;
  return `100.64.${seed%255}.${(seed*3)%255}`;
}

function viewStatus(host, cfg){
  host.innerHTML = `
    <div class="kpis">
      <div class="card">
        <h3>Internet</h3>
        <div class="small">Status</div>
        <div style="font-size:22px; margin:4px 0">
          ${cfg.wan.mode.toUpperCase()} • <b>${deriveWanIp(cfg)}</b>
        </div>
        <div class="small">DNS: ${cfg.wan.dns1 || "–"} / ${cfg.wan.dns2 || "–"}</div>
      </div>
      <div class="card">
        <h3>Wi‑Fi 2.4 GHz</h3>
        <div class="small">${cfg.wifi24.enabled ? "Ativo" : "Desligado"}</div>
        <div style="font-size:22px; margin:4px 0"><b>${cfg.wifi24.ssid}</b></div>
        <div class="small">Canal ${cfg.wifi24.channel}</div>
      </div>
      <div class="card">
        <h3>Wi‑Fi 5 GHz</h3>
        <div class="small">${cfg.wifi5.enabled ? "Ativo" : "Desligado"}</div>
        <div style="font-size:22px; margin:4px 0"><b>${cfg.wifi5.ssid}</b></div>
        <div class="small">Canal ${cfg.wifi5.channel}</div>
      </div>
      <div class="card">
        <h3>LAN</h3>
        <div class="small">Gateway</div>
        <div style="font-size:22px; margin:4px 0"><b>${cfg.lan.ip}</b></div>
        <div class="small">DHCP ${cfg.lan.dhcp ? "Ativo" : "Desligado"}</div>
      </div>
    </div>

    <div class="grid-2">
      <div class="card">
        <h3>Clientes DHCP (simulado)</h3>
        <table class="table">
          <thead><tr><th>Host</th><th>IP</th><th>MAC</th></tr></thead>
          <tbody id="tbl-clients"></tbody>
        </table>
      </div>
      <div class="card">
        <h3>Resumo de Firewall</h3>
        <div class="chips">
          <span class="chip">SPI: ${cfg.firewall.spi ? "On" : "Off"}</span>
          <span class="chip">UPnP: ${cfg.firewall.upnp ? "On" : "Off"}</span>
          <span class="chip">Parental: ${cfg.firewall.parental ? "On" : "Off"}</span>
          <span class="chip">DMZ: ${cfg.firewall.dmz || "—"}</span>
          <span class="chip">Ger. Remota: ${cfg.firewall.remoteMgmt ? (":" + cfg.firewall.remotePort) : "Off"}</span>
        </div>
      </div>
    </div>
  `;
  const clients = fakeClients();
  const tbody = $("#tbl-clients");
  tbody.innerHTML = clients.map(c=>`<tr><td>${c.name}</td><td>${c.ip}</td><td>${c.mac}</td></tr>`).join("");
}

function fakeClients(){
  const n = 3 + Math.floor(Math.random()*4);
  const [base, last] = (loadConfig().lan.dhcpRange || "192.168.1.100-192.168.1.199").split("-");
  const prefix = base.split(".").slice(0,3).join(".");
  const used = new Set();
  const names = ["PC‑Sala","iPhone","Android","SmartTV","Notebook","Impressora","Echo"];
  function randomIp(){
    let l;
    do{ l = 100 + Math.floor(Math.random()*99); } while(used.has(l));
    used.add(l);
    return `${prefix}.${l}`;
  }
  function randomMac(){
    return Array.from({length:6}, _=>Math.floor(Math.random()*256).toString(16).padStart(2,"0")).join(":");
  }
  return Array.from({length:n}, (_,i)=>({ name: names[i%names.length], ip: randomIp(), mac: randomMac() }));
}

function viewWAN(host, cfg){
  host.innerHTML = `
    <div class="card">
      <h3>WAN (Internet)</h3>
      <form id="form-wan" class="form-grid">
        <div class="field">
          <label>Modo de conexão</label>
          <select class="input" name="mode">
            <option value="dhcp">DHCP (Dinâmico)</option>
            <option value="pppoe">PPPoE</option>
            <option value="static">IP Estático</option>
          </select>
        </div>
        <div class="field wan wan-static">
          <label>IP</label>
          <input class="input" name="ip" placeholder="100.64.1.2"/>
        </div>
        <div class="field wan wan-static">
          <label>Máscara</label>
          <input class="input" name="mask" placeholder="255.255.255.0"/>
        </div>
        <div class="field wan wan-static">
          <label>Gateway</label>
          <input class="input" name="gw" placeholder="100.64.1.1"/>
        </div>
        <div class="field">
          <label>DNS Primário</label>
          <input class="input" name="dns1" placeholder="1.1.1.1"/>
        </div>
        <div class="field">
          <label>DNS Secundário</label>
          <input class="input" name="dns2" placeholder="8.8.8.8"/>
        </div>
        <div class="field">
          <label>Clonar MAC (opcional)</label>
          <input class="input" name="macClone" placeholder="AA:BB:CC:DD:EE:FF"/>
        </div>
        ${formButtonRow(`<button class="btn ghost" id="btn-renew" type="button">Renovar DHCP</button>`)}
      </form>
    </div>
  `;
  const f = $("#form-wan");
  fillForm(f, cfg.wan);
  toggleWanFields();
  f.mode.onchange = toggleWanFields;
  f.onsubmit = e => {
    e.preventDefault();
    const data = formToObj(new FormData(f));
    cfg.wan = data;
    saveConfig(cfg);
    pushLog(`WAN atualizada (${data.mode})`);
    toast("Configurações de WAN salvas.");
    renderPage();
  };
  f.onreset = e => setTimeout(()=>renderPage(),0);
  $("#btn-renew").onclick = ()=>{
    pushLog("Renovação DHCP solicitada");
    toast("Solicitado: Renovar DHCP (simulado)");
  };

  function toggleWanFields(){
    $$(".wan").forEach(el=>el.style.display = (f.mode.value === "static") ? "block" : "none");
  }
}

function viewLAN(host, cfg){
  host.innerHTML = `
    <div class="card">
      <h3>LAN & DHCP</h3>
      <form id="form-lan" class="form-grid">
        <div class="field">
          <label>IP do Roteador</label>
          <input class="input" name="ip" placeholder="192.168.1.1"/>
        </div>
        <div class="field">
          <label>Máscara</label>
          <input class="input" name="mask" placeholder="255.255.255.0"/>
        </div>
        <div class="field">
          <label class="switch">
            <input type="checkbox" name="dhcp"/>
            <span class="track"><span class="thumb"></span></span>
            <span>Servidor DHCP</span>
          </label>
        </div>
        <div class="field dhcp-opt">
          <label>Faixa DHCP</label>
          <input class="input" name="dhcpRange" placeholder="192.168.1.100-192.168.1.199"/>
        </div>
        <div class="field dhcp-opt">
          <label>Lease (segundos)</label>
          <input class="input" type="number" name="lease" placeholder="86400"/>
        </div>
        ${formButtonRow()}
      </form>
    </div>
  `;
  const f = $("#form-lan");
  fillForm(f, cfg.lan);
  toggle();
  f.dhcp.onchange = toggle;
  f.onsubmit = e => {
    e.preventDefault();
    const data = formToObj(new FormData(f));
    data.dhcp = !!f.dhcp.checked;
    cfg.lan = data;
    saveConfig(cfg);
    pushLog("LAN/DHCP atualizados");
    toast("Configurações de LAN salvas.");
    renderPage();
  };
  f.onreset = ()=>setTimeout(()=>renderPage(),0);

  function toggle(){
    $$(".dhcp-opt").forEach(el=>el.style.display = f.dhcp.checked ? "block" : "none");
  }
}

function viewWiFi(host, cfg){
  host.innerHTML = `
    <div class="grid-2">
      ${wifiCard("wifi24", "Wi‑Fi 2.4 GHz", cfg.wifi24)}
      ${wifiCard("wifi5", "Wi‑Fi 5 GHz", cfg.wifi5)}
    </div>
  `;
  function wifiCard(key, title, data){
    const id = `form-${key}`;
    setTimeout(()=>{
      const f = $("#"+id);
      fillForm(f, data);
      f.enabled.checked = !!data.enabled;
      f.hidden.checked = !!data.hidden;
      f.onsubmit = e => {
        e.preventDefault();
        const v = formToObj(new FormData(f));
        v.enabled = f.enabled.checked;
        v.hidden = f.hidden.checked;
        state.cfg[key] = v;
        saveConfig(state.cfg);
        pushLog(`${title} atualizado`);
        toast(`${title}: configurações salvas.`);
        renderPage();
      };
      f.onreset = ()=>setTimeout(()=>renderPage(),0);
    }, 0);
    return `
      <div class="card">
        <h3>${title}</h3>
        <form id="${id}" class="form-grid">
          <div class="field">
            <label>Habilitar</label>
            <label class="switch"><input type="checkbox" name="enabled"/><span class="track"><span class="thumb"></span></span></label>
          </div>
          <div class="field">
            <label>SSID</label>
            <input class="input" name="ssid" placeholder="MinhaRede"/>
          </div>
          <div class="field">
            <label>Senha</label>
            <input class="input" name="password" placeholder="mín. 8 caracteres" type="password"/>
          </div>
          <div class="field">
            <label>Canal</label>
            <select class="input" name="channel">
              <option value="auto">Auto</option>
              ${Array.from({length: (key==="wifi24"?13:11)}, (_,i)=>`<option>${(key==="wifi24"?i+1:i+36)}</option>`).join("")}
            </select>
          </div>
          <div class="field">
            <label>Largura de banda</label>
            <select class="input" name="band">
              ${key==="wifi24" ? `<option>20MHz</option><option>20/40MHz</option>` : `<option>40MHz</option><option>80MHz</option><option>160MHz</option>`}
            </select>
          </div>
          <div class="field">
            <label>Ocultar SSID</label>
            <label class="switch"><input type="checkbox" name="hidden"/><span class="track"><span class="thumb"></span></span></label>
          </div>
          ${formButtonRow(``)}
        </form>
      </div>
    `;
  }
}

function viewForward(host, cfg){
  host.innerHTML = `
    <div class="card">
      <h3>Port Forwarding</h3>
      <form id="form-addfwd" class="form-grid">
        <div class="field"><label>Serviço</label><input class="input" name="name" placeholder="Servidor de Jogo"/></div>
        <div class="field"><label>Protocolo</label><select class="input" name="proto"><option>TCP</option><option>UDP</option></select></div>
        <div class="field"><label>Porta Externa</label><input class="input" name="ext" placeholder="8080"/></div>
        <div class="field"><label>IP Interno</label><input class="input" name="ip" placeholder="192.168.1.120"/></div>
        <div class="field"><label>Porta Interna</label><input class="input" name="int" placeholder="8080"/></div>
        ${formButtonRow()}
      </form>
      <hr class="sep"/>
      <table class="table" id="fwd-table">
        <thead><tr><th>Serviço</th><th>Protocolo</th><th>Externa</th><th>IP Interno</th><th>Interna</th><th></th></tr></thead>
        <tbody></tbody>
      </table>
    </div>
  `;
  const tbody = $("#fwd-table tbody");
  function renderRows(){
    tbody.innerHTML = cfg.forwarding.map((r, i)=>`
      <tr>
        <td>${r.name}</td><td>${r.proto}</td><td>${r.ext}</td><td>${r.ip}</td><td>${r.int}</td>
        <td><button class="btn ghost" data-i="${i}">Remover</button></td>
      </tr>`).join("") || `<tr><td colspan="6" class="small">Nenhum redirecionamento configurado.</td></tr>`;
    $$(`#fwd-table button[data-i]`).forEach(b=>b.onclick = ()=>{
      cfg.forwarding.splice(parseInt(b.dataset.i),1);
      saveConfig(cfg);
      pushLog("Port forwarding removido");
      renderRows();
    });
  }
  renderRows();
  $("#form-addfwd").onsubmit = e => {
    e.preventDefault();
    const data = formToObj(new FormData(e.target));
    cfg.forwarding.push(data);
    saveConfig(cfg);
    pushLog("Port forwarding adicionado");
    toast("Regra adicionada.");
    e.target.reset();
    renderRows();
  };
  $("#form-addfwd").onreset = ()=>setTimeout(()=>renderPage(),0);
}

function viewFirewall(host, cfg){
  host.innerHTML = `
    <div class="grid-2">
      <div class="card">
        <h3>Segurança</h3>
        <form id="form-fw" class="form-grid">
          <div class="field">
            <label>Firewall SPI</label>
            <label class="switch"><input type="checkbox" name="spi"/><span class="track"><span class="thumb"></span></span></label>
          </div>
          <div class="field">
            <label>UPnP</label>
            <label class="switch"><input type="checkbox" name="upnp"/><span class="track"><span class="thumb"></span></span></label>
          </div>
          <div class="field">
            <label>Gerenciamento Remoto</label>
            <label class="switch"><input type="checkbox" name="remoteMgmt"/><span class="track"><span class="thumb"></span></span></label>
          </div>
          <div class="field">
            <label>Porta Ger. Remota</label>
            <input class="input" name="remotePort" placeholder="8080"/>
          </div>
          <div class="field">
            <label>DMZ (IP)</label>
            <input class="input" name="dmz" placeholder="192.168.1.200"/>
          </div>
          <div class="field">
            <label>Controle Parental</label>
            <label class="switch"><input type="checkbox" name="parental"/><span class="track"><span class="thumb"></span></span></label>
          </div>
          ${formButtonRow()}
        </form>
      </div>
      <div class="card">
        <h3>QoS</h3>
        <form id="form-qos" class="form-grid">
          <div class="field"><label>Ativar QoS</label><label class="switch"><input type="checkbox" name="enabled"/><span class="track"><span class="thumb"></span></span></label></div>
          <div class="field"><label>Upload (Mbps)</label><input class="input" type="number" name="up" placeholder="10"/></div>
          <div class="field"><label>Download (Mbps)</label><input class="input" type="number" name="down" placeholder="100"/></div>
          ${formButtonRow()}
        </form>
      </div>
    </div>
  `;
  const f1 = $("#form-fw");
  const f2 = $("#form-qos");
  fillForm(f1, cfg.firewall);
  fillForm(f2, cfg.qos);
  f1.spi.checked = !!cfg.firewall.spi;
  f1.upnp.checked = !!cfg.firewall.upnp;
  f1.remoteMgmt.checked = !!cfg.firewall.remoteMgmt;
  f1.parental.checked = !!cfg.firewall.parental;
  f2.enabled.checked = !!cfg.qos.enabled;

  f1.onsubmit = e => {
    e.preventDefault();
    const d = formToObj(new FormData(f1));
    d.spi = f1.spi.checked;
    d.upnp = f1.upnp.checked;
    d.remoteMgmt = f1.remoteMgmt.checked;
    d.parental = f1.parental.checked;
    cfg.firewall = d;
    saveConfig(cfg);
    pushLog("Firewall/QoS atualizado (segurança)");
    toast("Firewall salvo.");
  };
  f1.onreset = ()=>setTimeout(()=>renderPage(),0);
  f2.onsubmit = e => {
    e.preventDefault();
    const d = formToObj(new FormData(f2));
    d.enabled = f2.enabled.checked;
    cfg.qos = d;
    saveConfig(cfg);
    pushLog("Firewall/QoS atualizado (qos)");
    toast("QoS salvo.");
  };
  f2.onreset = ()=>setTimeout(()=>renderPage(),0);
}

function viewAdmin(host, cfg){
  host.innerHTML = `
    <div class="grid-2">
      <div class="card">
        <h3>Credenciais</h3>
        <form id="form-user" class="form-grid">
          <div class="field"><label>Usuário</label><input class="input" name="username" placeholder="admin"/></div>
          <div class="field"><label>Senha Atual</label><input class="input" type="password" name="current" placeholder="••••••••"/></div>
          <div class="field"><label>Nova Senha</label><input class="input" type="password" name="password" placeholder="mín. 4 caracteres"/></div>
          <div class="field"><label>Confirmar Senha</label><input class="input" type="password" name="confirm" placeholder="••••••••"/></div>
          ${formButtonRow(`<button class="btn warn" id="btn-defaults" type="button">Restaurar Padrão</button>`)}
        </form>
      </div>
      <div class="card">
        <h3>Nome do Dispositivo</h3>
        <form id="form-host" class="form-grid">
          <div class="field"><label>Hostname</label><input class="input" name="hostname" placeholder="RouterOS"/></div>
          <div class="field"><label>Time Zone</label><input class="input" name="timeZone" placeholder="America/Maceio"/></div>
          <div class="field"><label>Sincronizar com NTP</label><label class="switch"><input type="checkbox" name="ntp"/><span class="track"><span class="thumb"></span></span></label></div>
          ${formButtonRow()}
        </form>
      </div>
    </div>
  `;
  const user = loadUser();
  const fUser = $("#form-user");
  fUser.username.value = user.username;
  $("#btn-defaults").onclick = ()=>{
    localStorage.removeItem(storeKey);
    saveUser(structuredClone(defaultUser));
    pushLog("Configurações restauradas para padrão");
    toast("Padrões restaurados. Faça login novamente.");
    sessionStorage.removeItem("authed");
    setTimeout(()=>location.reload(), 800);
  };
  fUser.onsubmit = e => {
    e.preventDefault();
    const data = formToObj(new FormData(fUser));
    if(data.current !== user.password) return toast("Senha atual incorreta.");
    if(!data.password || data.password.length < 4) return toast("Nova senha muito curta.");
    if(data.password !== data.confirm) return toast("Senhas não conferem.");
    const newUser = { username: data.username, password: data.password };
    saveUser(newUser);
    pushLog("Credenciais alteradas");
    toast("Credenciais atualizadas. Faça login novamente.");
    sessionStorage.removeItem("authed");
    setTimeout(()=>location.reload(), 1000);
  };
  fUser.onreset = ()=>setTimeout(()=>renderPage(),0);

  const fHost = $("#form-host");
  fillForm(fHost, cfg.system);
  fHost.ntp.checked = !!cfg.system.ntp;
  fHost.onsubmit = e => {
    e.preventDefault();
    const d = formToObj(new FormData(fHost));
    d.ntp = fHost.ntp.checked;
    cfg.system = d;
    saveConfig(cfg);
    pushLog("Hostname/TZ atualizados");
    toast("Sistema atualizado.");
    render();
  };
  fHost.onreset = ()=>setTimeout(()=>renderPage(),0);
}

function viewSystem(host, cfg){
  host.innerHTML = `
    <div class="grid-2">
      <div class="card">
        <h3>Backup & Restore</h3>
        <div class="small">Faça backup/restore das configurações em JSON.</div>
        <div class="row" style="margin-top:12px">
          <button class="btn" id="btn-backup">Baixar Backup</button>
          <label class="btn ghost">
            Restaurar… <input type="file" id="file-restore" accept="application/json" style="display:none">
          </label>
        </div>
      </div>
      <div class="card">
        <h3>Reiniciar Roteador</h3>
        <p class="small">Reinicia o sistema (simulado). Sessão será desconectada.</p>
        <button class="btn bad" id="btn-reboot">Reiniciar</button>
      </div>
    </div>
  `;
  $("#btn-backup").onclick = ()=>{
    const blob = new Blob([JSON.stringify(loadConfig(), null, 2)], {type: "application/json"});
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "router-backup.json";
    a.click();
    URL.revokeObjectURL(a.href);
    pushLog("Backup baixado");
  };
  $("#file-restore").onchange = async (e)=>{
    const file = e.target.files[0];
    if(!file) return;
    const text = await file.text();
    try{
      const cfg = JSON.parse(text);
      saveConfig(cfg);
      pushLog("Backup restaurado");
      toast("Backup restaurado. Reiniciando…");
      sessionStorage.removeItem("authed");
      setTimeout(()=>location.reload(), 800);
    }catch(err){
      toast("Arquivo inválido.");
    }
  };
  $("#btn-reboot").onclick = ()=>{
    pushLog("Reboot solicitado");
    toast("Reiniciando…");
    sessionStorage.removeItem("authed");
    setTimeout(()=>location.reload(), 800);
  };
}

function viewLogs(host, cfg){
  const logs = getLogs();
  host.innerHTML = `
    <div class="card">
      <h3>Logs</h3>
      <table class="table">
        <thead><tr><th>Data/Hora</th><th>Evento</th></tr></thead>
        <tbody>
          ${logs.map(l=>`<tr><td>${new Date(l.ts).toLocaleString()}</td><td>${l.entry}</td></tr>`).join("") || `<tr><td colspan="2" class="small">Sem logs.</td></tr>`}
        </tbody>
      </table>
      <div class="row" style="margin-top:12px">
        <button class="btn ghost" id="btn-clear">Limpar Logs</button>
      </div>
    </div>
  `;
  $("#btn-clear").onclick = ()=>{
    localStorage.removeItem(logKey);
    toast("Logs limpos.");
    renderPage();
  };
}

/* Utils */
function formToObj(fd){
  const o = {};
  for(const [k,v] of fd.entries()){
    o[k] = v;
  }
  return o;
}
function fillForm(form, data){
  Object.entries(data || {}).forEach(([k,v])=>{
    const el = form.elements[k];
    if(!el) return;
    if(el.type === "checkbox") el.checked = !!v;
    else el.value = v;
  });
}

// INIT
(function(){
  const root = document.getElementById("app");
  mount(root);
})();


// --- Controle de Banda ---
function addBandwidthRule() {
  const table = document.getElementById("bandwidthTable");
  const row = document.createElement("tr");
  row.innerHTML = `<td>Dispositivo X</td><td>AA:BB:CC:DD:EE:FF</td>
                   <td><input type='number' value='10'></td>
                   <td><input type='number' value='2'></td>
                   <td><button onclick='this.closest("tr").remove()'>Remover</button></td>`;
  table.appendChild(row);
}

// --- WPS ---
function startWPS() {
  const status = document.getElementById("wpsStatus");
  status.innerText = "WPS iniciado... aguardando dispositivo.";
  setTimeout(() => { status.innerText = "Dispositivo conectado com sucesso via WPS!"; }, 3000);
}

// --- IPv6 ---
function saveIPv6() {
  const enable = document.getElementById("enableIPv6").checked;
  const addr = document.getElementById("wanIPv6").value;
  const prefix = document.getElementById("delegatedPrefix").value;
  alert("Configurações IPv6 salvas: " + (enable ? "Ativado" : "Desativado") +
        ", Endereço: " + addr + ", Prefixo: " + prefix);
}

// --- VLAN ---
function addVLAN() {
  const table = document.getElementById("vlanTable");
  const row = document.createElement("tr");
  row.innerHTML = `<td><input type='number' placeholder='ID'></td>
                   <td><input type='text' placeholder='1,2,3'></td>
                   <td><button onclick='this.closest("tr").remove()'>Remover</button></td>`;
  table.appendChild(row);
}
