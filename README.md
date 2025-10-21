# Nexora AutoHunter Frontend

Frontend em ReactJS para o Nexora AutoHunter - aplicação para download automático de arquivos.

## 🚀 Instalação

1. Instalar dependências:
```bash
npm install
```

## ▶️ Executar

```bash
npm start
```

O aplicativo abrirá em http://localhost:3000

## 🏗️ Build para Produção

```bash
npm run build
```

## ✨ Funcionalidades

- **Escanear URL**: Verifica quais arquivos estão disponíveis na URL informada
- **Tipos de Arquivo Suportados**:
  - Arquivos comprimidos (.zip, .7z, .rar)
  - Imagens (.png, .jpeg, .jpg, .gif, .bmp)
  - Documentos PDF (.pdf)
- **Download Seletivo**: Escolha quais arquivos baixar
- **Validação em Tempo Real**: Tooltips com validação de URL e diretório
- **Progresso em Tempo Real**: Acompanhe o progresso dos downloads via WebSocket
- **Interface Moderna**: Design responsivo com gradientes e animações
- **Paginação**: Navegação fácil através de muitos arquivos
- **Feedback Visual**: Spinners, barras de progresso e notificações

## 🎨 Interface

- Design moderno com tema roxo (#835EE9)
- Validação visual com tooltips
- Animações suaves e transições
- Interface responsiva
- Feedback visual durante operações

## 📁 Estrutura

```
frontend/
├── public/
│   ├── index.html          # HTML principal
│   └── logo-icon.png       # Logo da aplicação
├── src/
│   ├── App.js              # Componente principal
│   ├── App.css             # Estilos do componente
│   ├── index.js            # Ponto de entrada
│   └── index.css           # Estilos globais
├── package.json            # Dependências e scripts
├── package-lock.json       # Lock file das dependências
└── README.md               # Este arquivo
```

## 🔧 Tecnologias

- **React 18** - Biblioteca JavaScript para UI
- **Axios** - Cliente HTTP para comunicação com a API
- **CSS3** - Estilização moderna com gradientes e animações
- **WebSocket** - Recebimento de progresso em tempo real

## 🌐 API

O frontend se comunica com o backend através de:
- **REST API** (porta 8000) para operações de escaneamento e download
- **WebSocket** para receber progresso em tempo real

## 📱 Responsividade

A interface é totalmente responsiva e funciona bem em:
- Desktop
- Tablet
- Mobile

## 🎯 Validação

- **URL**: Validação de formato com tooltip
- **Diretório**: Validação de campo obrigatório com tooltip
- **Arquivos**: Seleção obrigatória antes do download