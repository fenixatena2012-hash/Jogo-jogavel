# VoxelCraft Offline

Jogo voxel 3D original para navegador, com PWA instalável e suporte offline após a primeira abertura online.

## Publicar no Render
1. Extraia o ZIP e envie o conteúdo para um repositório GitHub.
2. No Render, crie **New + > Web Service** e conecte o repositório.
3. Build Command: `npm install && npm run build`
4. Start Command: `npm start`
5. Faça o deploy e abra a URL HTTPS no celular.

## Instalar no celular
- Android/Chrome: abra o site, aguarde carregar uma vez e use o menu do navegador > **Instalar app** ou **Adicionar à tela inicial**.
- iPhone/Safari: Compartilhar > **Adicionar à Tela de Início**.
- O navegador precisa suportar PWA. A instalação e o primeiro carregamento exigem internet.
- Depois que os arquivos forem armazenados pelo service worker, o jogo abre offline. O progresso é salvo localmente no aparelho.

## Controles em paisagem
- Joystick esquerdo: andar.
- Arrastar a área direita: olhar.
- PULAR, MINERAR e COLOCAR: botões da direita.
- Barra inferior: escolher bloco.
- Computador: WASD, Espaço, mouse, clique esquerdo/direito.

## Observações
Este é um jogo voxel original em desenvolvimento, não uma cópia integral do Minecraft. Não contém multiplayer nesta versão. A orientação paisagem é solicitada pelo navegador e pode depender do suporte do aparelho.
