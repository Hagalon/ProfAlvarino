// script.js - com paginação (máx. 5 posts por página)
let todosOsPosts = [];
let categoriaAtual = 'todas';
let textoOriginalHeader = '';

// Configuração da paginação
const POSTS_POR_PAGINA = 5;
let paginaAtual = 1;
let totalPaginas = 1;

function gerarIconePost(icone) {
  if (!icone) return '📄'; // ícone padrão
  
  // Verifica se parece um caminho de imagem (extensões comuns ou URLs)
  const extensoesImagem = /\.(jpg|jpeg|png|gif|svg|webp|bmp|ico)(\?.*)?$/i;
  const pareceUrl = icone.startsWith('http') || icone.startsWith('/') || icone.includes('.');
  
  if (extensoesImagem.test(icone) || pareceUrl) {
    // Retorna uma tag <img> com o caminho
    return `<img src="${icone}" alt="Ícone do post" loading="lazy">`;
  } else {
    // Provavelmente é um emoji ou texto simples
    return icone;
  }
}

async function carregarFeed() {
  const container = document.getElementById('feed-container');
  container.innerHTML = '<p style="text-align: center; padding: 40px;">Carregando publicações...</p>';
  
  try {
    const resposta = await fetch('posts.json');
    todosOsPosts = await resposta.json();

    if (todosOsPosts.length === 0) {
      container.innerHTML = '<p style="text-align: center; padding: 40px;">Nenhuma publicação encontrada.</p>';
      document.getElementById('pagination-controls').innerHTML = '';
      return;
    }

    const headerP = document.querySelector('.site-header p');
    if (headerP) textoOriginalHeader = headerP.textContent;

    filtrarPorCategoria('todas');
    configurarLinksCategoria();
  } catch (erro) {
    console.error('Erro ao carregar feed:', erro);
    container.innerHTML = '<p style="text-align: center; padding: 40px;">Erro ao carregar as publicações.</p>';
  }
}

function filtrarPorCategoria(categoria, novaPagina = 1) {
  const container = document.getElementById('feed-container');
  if (!container) return;
  
  categoriaAtual = categoria;
  paginaAtual = novaPagina;
  
  // Filtra os posts pela categoria
  let postsFiltrados = (categoria === 'todas') 
    ? todosOsPosts 
    : todosOsPosts.filter(post => post.categoria.toLowerCase() === categoria.toLowerCase());
  
  // Calcula total de páginas
  totalPaginas = Math.ceil(postsFiltrados.length / POSTS_POR_PAGINA);
  
  // Ajusta página atual se necessário
  if (paginaAtual > totalPaginas) paginaAtual = totalPaginas;
  if (paginaAtual < 1) paginaAtual = 1;
  
  // Se não houver posts
  if (postsFiltrados.length === 0) {
    container.innerHTML = `<p style="text-align: center; padding: 40px;">Nenhuma publicação na categoria "${categoria}".</p>`;
    document.getElementById('pagination-controls').innerHTML = '';
    atualizarHeaderCategoria(categoria);
    destacarCategoriaAtiva(categoria);
    return;
  }
  
  // Obtém os posts da página atual
  const inicio = (paginaAtual - 1) * POSTS_POR_PAGINA;
  const fim = inicio + POSTS_POR_PAGINA;
  const postsPagina = postsFiltrados.slice(inicio, fim);
  
  // Renderiza os posts
  const html = postsPagina.map(post => `
    <article class="post-card">
      <div class="post-img">${gerarIconePost(post.icone)}</div>
      <div class="post-content">
        <div class="post-meta">
          <span class="post-category">${post.categoria}</span>
          <span>• ${post.data || ''}</span>
        </div>
        <h2 class="post-title"><a href="${post.link}">${post.titulo}</a></h2>
        <p class="post-excerpt">${post.resumo || ''}</p>
        <div class="post-footer">
          <span>Por ${post.autor || ''}</span>
          <a href="${post.link}" class="read-more">Ler mais →</a>
        </div>
      </div>
    </article>
  `).join('');
  
  container.innerHTML = html;
  
  // Renderiza os controles de paginação
  renderizarPaginacao(postsFiltrados.length);
  
  // Atualiza header e destaque
  atualizarHeaderCategoria(categoria);
  destacarCategoriaAtiva(categoria);
}

function renderizarPaginacao(totalPosts) {
  const paginationDiv = document.getElementById('pagination-controls');
  if (!paginationDiv) return;
  
  if (totalPosts === 0 || totalPaginas <= 1) {
    paginationDiv.innerHTML = '';
    return;
  }
  
  let html = '<ul class="pagination-list">';
  
  // Botão "Anterior"
  html += `<li class="page-item ${paginaAtual === 1 ? 'disabled' : ''}">`;
  if (paginaAtual > 1) {
    html += `<a href="#" class="page-link" data-page="${paginaAtual - 1}" aria-label="Página anterior">&laquo; Anterior</a>`;
  } else {
    html += `<span class="page-link disabled">&laquo; Anterior</span>`;
  }
  html += '</li>';
  
  // Números de página (mostra no máximo 5 números ao redor da atual)
  let inicioLoop = Math.max(1, paginaAtual - 2);
  let fimLoop = Math.min(totalPaginas, paginaAtual + 2);
  
  if (inicioLoop > 1) {
    html += `<li class="page-item"><a href="#" class="page-link" data-page="1">1</a></li>`;
    if (inicioLoop > 2) html += `<li class="page-item"><span class="page-link disabled">...</span></li>`;
  }
  
  for (let i = inicioLoop; i <= fimLoop; i++) {
    html += `<li class="page-item ${i === paginaAtual ? 'active' : ''}">`;
    if (i === paginaAtual) {
      html += `<span class="page-link active">${i}</span>`;
    } else {
      html += `<a href="#" class="page-link" data-page="${i}">${i}</a>`;
    }
    html += '</li>';
  }
  
  if (fimLoop < totalPaginas) {
    if (fimLoop < totalPaginas - 1) html += `<li class="page-item"><span class="page-link disabled">...</span></li>`;
    html += `<li class="page-item"><a href="#" class="page-link" data-page="${totalPaginas}">${totalPaginas}</a></li>`;
  }
  
  // Botão "Próximo"
  html += `<li class="page-item ${paginaAtual === totalPaginas ? 'disabled' : ''}">`;
  if (paginaAtual < totalPaginas) {
    html += `<a href="#" class="page-link" data-page="${paginaAtual + 1}" aria-label="Próxima página">Próximo &raquo;</a>`;
  } else {
    html += `<span class="page-link disabled">Próximo &raquo;</span>`;
  }
  html += '</li>';
  
  html += '</ul>';
  paginationDiv.innerHTML = html;
  
  // Adiciona event listeners aos links de página
  paginationDiv.querySelectorAll('.page-link[data-page]').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const novaPagina = parseInt(link.getAttribute('data-page'));
      if (!isNaN(novaPagina)) {
        filtrarPorCategoria(categoriaAtual, novaPagina);
        // Rola suavemente para o topo do feed
        document.getElementById('feed-container').scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });
}

function atualizarHeaderCategoria(categoria) {
  const headerP = document.querySelector('.site-header p');
  if (!headerP) return;
  headerP.textContent = (categoria === 'todas') 
    ? (textoOriginalHeader || 'Notícias, artigos e atualizações em tempo real')
    : `Categoria: ${categoria}`;
}

function destacarCategoriaAtiva(categoria) {
  document.querySelectorAll('.nav-link[data-categoria]').forEach(link => {
    link.classList.remove('active');
  });
  const linkAtivo = document.querySelector(`.nav-link[data-categoria="${categoria}"]`);
  if (linkAtivo) linkAtivo.classList.add('active');
}

function configurarLinksCategoria() {
  const mapaCategorias = {
    'Início': 'todas', 'Categorias': 'todas',
    'Tecnologia': 'Tecnologia', 'Ciência': 'Ciência',
    'Espaço': 'Espaço', 'Biologia': 'Biologia',
    'Física': 'Física', 'Cultura': 'Cultura',
    'Negócios': 'Negócios'
  };
  
  document.querySelectorAll('.nav-link').forEach(link => {
    const texto = link.textContent.trim();
    if (mapaCategorias[texto]) {
      link.setAttribute('data-categoria', mapaCategorias[texto]);
      link.removeEventListener('click', handleLinkClick);
      link.addEventListener('click', handleLinkClick);
    }
  });
}

function handleLinkClick(event) {
  event.preventDefault();
  const categoria = event.currentTarget.getAttribute('data-categoria');
  if (categoria) filtrarPorCategoria(categoria, 1); // sempre volta para página 1
}

document.addEventListener('DOMContentLoaded', carregarFeed);
