# 🌐 RouterOS – Simulador de Painel de Roteador (Front-End)

Este projeto é um **simulador de interface administrativa de um roteador**, desenvolvido **100% em Front-End**, com o objetivo educacional de demonstrar como funcionam os principais recursos de um roteador doméstico ou corporativo.

🔗 **Acesse o projeto online:**  
👉 https://andressasanntos.github.io/RouterOS/

---

## 🎯 Objetivo do Projeto

O RouterOS Simulator foi criado para:

- Simular o funcionamento de um **painel administrativo de roteadores**
- Demonstrar conceitos de **redes de computadores**
- Praticar **HTML, CSS e JavaScript puro**
- Servir como **projeto de portfólio**
- Ajudar estudantes e leigos a entenderem configurações de rede

> ⚠️ **Observação:**  
> Este projeto **não é um roteador real**. Todas as funcionalidades são **simuladas no navegador**, sem back-end ou conexão real com rede.

---

## 🔐 Login de Acesso

- **Usuário:** `admin`
- **Senha:** `admin`

Após o login, é possível alterar as credenciais no menu **Admin → Credenciais**.

---

## 🧩 Funcionalidades Simuladas

### 📊 Status do Sistema
- IP WAN simulado
- Status da internet
- Wi-Fi 2.4 GHz e 5 GHz
- Gateway LAN
- Clientes DHCP simulados
- Resumo do firewall

---

### 🌍 WAN (Internet)
- Modo DHCP
- IP Estático
- PPPoE (simulado)
- DNS primário e secundário
- Clonagem de MAC
- Renovação DHCP (simulada)

---

### 🖧 LAN & DHCP
- IP do roteador
- Máscara de rede
- Servidor DHCP (liga/desliga)
- Faixa de IP
- Tempo de lease

---

### 📶 Rede Wi-Fi
- Wi-Fi 2.4 GHz e 5 GHz
- SSID
- Senha
- Canal
- Largura de banda
- Ocultar SSID
- Ativar/desativar rede

---

### 🔁 Port Forwarding
- Criação de regras TCP/UDP
- Porta externa e interna
- IP interno
- Remoção de regras

---

### 🔥 Firewall & Segurança
- Firewall SPI
- UPnP
- Gerenciamento remoto
- Porta remota
- DMZ
- Controle parental
- QoS (Upload / Download)

---

### 🛠️ Administração
- Alteração de usuário e senha
- Redefinição para padrões de fábrica
- Nome do dispositivo (Hostname)
- Timezone
- Sincronização NTP

---

### 💾 Sistema
- Backup das configurações (JSON)
- Restore de backup
- Reinicialização do roteador (simulada)

---

### 📜 Logs
- Registro de eventos:
  - Login
  - Alterações de configuração
  - Backup
  - Restore
  - Reboot
- Limpeza de logs

---

## 🧠 Como o Projeto Funciona

- Todas as configurações são armazenadas no **localStorage**
- Autenticação simulada via **sessionStorage**
- Não há back-end
- Não há banco de dados real
- IPs, clientes DHCP e eventos são **gerados dinamicamente**

---

## 🛠️ Tecnologias Utilizadas

- **HTML5**
- **CSS3 (com variáveis CSS e layout responsivo)**
- **JavaScript Vanilla**
- **GitHub Pages** (deploy)

---

## 📁 Estrutura do Projeto

```text
📦 RouterOS
 ┣ 📜 index.html
 ┣ 📜 styles.css
 ┣ 📜 app.js
 ┗ 📜 README.md
