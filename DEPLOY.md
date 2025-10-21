

# Deploy no Netlify

## Como fazer o deploy:

### 1. Via Interface Web do Netlify (Recomendado)
1. Acesse [netlify.com](https://netlify.com)
2. Faça login ou crie uma conta
3. Clique em "Add new site" → "Deploy manually"
4. Arraste a pasta `build` (criada após `npm run build`) para a área de deploy
5. Seu site estará disponível imediatamente!

### 2. Via Git (Deploy Automático)
1. Suba seu código para GitHub/GitLab
2. No Netlify, conecte seu repositório
3. Configure:
   - **Build command**: `npm run build`
   - **Publish directory**: `build`
   - **Node version**: `18`
4. Cada push no repositório fará deploy automático

### 3. Via Netlify CLI
```bash
# Instalar Netlify CLI
npm install -g netlify-cli

# Login
netlify login

# Deploy
npm run build
netlify deploy --prod --dir=build
```

## Configurações Importantes:

- ✅ **netlify.toml**: Configuração automática
- ✅ **_redirects**: Para SPAs (Single Page Applications)
- ✅ **homepage**: Configurado no package.json
- ✅ **Build**: Testado e funcionando

## Domínio Personalizado:
1. No painel do Netlify, vá em "Domain settings"
2. Adicione seu domínio personalizado
3. Configure DNS conforme instruções

## Variáveis de Ambiente (se necessário):
No painel do Netlify → Site settings → Environment variables

## URLs Internas:
✅ **Suportadas**: O frontend agora aceita URLs com IPs internos (10.x.x.x, 172.16-31.x.x, 192.168.x.x)
✅ **Credenciais**: URLs com usuário/senha são aceitas
⚠️ **Limitação**: O backend precisa ter acesso à rede interna de destino

### Exemplo de URL suportada:
```
http://softplan_read:34a9lnqN3KTd@10.47.60.92:9999/10.47.60.143/Servidores/PG5/LOG/SPLOGMETODOSERVIDOR_2025_10_19/
```
