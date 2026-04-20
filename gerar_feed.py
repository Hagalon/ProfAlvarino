#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import os
import json
from pathlib import Path
from datetime import datetime
from bs4 import BeautifulSoup

# Configurações
POSTS_DIR = Path("Posts")
OUTPUT_FILE = Path("posts.json")
ITEMS_PER_FEED = 10  # Máximo de posts no feed

def extrair_dados_post(arquivo_html):
    """Extrai metadados de um arquivo HTML de post."""
    with open(arquivo_html, 'r', encoding='utf-8') as f:
        soup = BeautifulSoup(f, 'html.parser')

    # Extrai usando seletores CSS
    titulo_elem = soup.select_one('.post-title')
    categoria_elem = soup.select_one('.post-category')
    data_elem = soup.select_one('.post-date')
    autor_elem = soup.select_one('.post-author')
    icone_elem = soup.select_one('.post-icon')
    resumo_elem = soup.select_one('.post-excerpt')

    # Fallbacks se não encontrar
    titulo = titulo_elem.get_text(strip=True) if titulo_elem else "Sem título"
    categoria = categoria_elem.get_text(strip=True) if categoria_elem else "Geral"
    autor = autor_elem.get_text(strip=True) if autor_elem else "Autor desconhecido"
    if icone_elem:
        img_tag = icone_elem.find('img')
        if img_tag and img_tag.get('src'):
            icone = img_tag['src']
        else:
            icone = icone_elem.get_text(strip=True)
    else:
        icone = "📄"
    resumo = resumo_elem.get_text(strip=True) if resumo_elem else ""

    # Processa data (espera-se ISO: YYYY-MM-DD)
    data_str = data_elem.get_text(strip=True) if data_elem else ""
    try:
        data_obj = datetime.fromisoformat(data_str)
        data_formatada = data_obj.strftime("%d/%m/%Y")
        # Para ordenação
        timestamp = data_obj.timestamp()
    except ValueError:
        data_formatada = data_str if data_str else "Data desconhecida"
        timestamp = 0

    # Nome do arquivo relativo para link
    # link = arquivo_html.relative_to(Path.cwd()).as_posix()
    link = arquivo_html.as_posix()

    return {
        "titulo": titulo,
        "categoria": categoria,
        "data": data_formatada,
        "autor": autor,
        "icone": icone,
        "resumo": resumo,
        "link": link,
        "timestamp": timestamp  # para ordenar
    }

def gerar_json_feed():
    """Varre a pasta Posts, extrai dados e gera posts.json."""
    if not POSTS_DIR.exists():
        print(f"Erro: Pasta '{POSTS_DIR}' não encontrada.")
        return

    posts = []
    for arquivo in POSTS_DIR.glob("*.html"):
        if arquivo.name.startswith('.'):
            continue  # Pula arquivos ocultos (ex: .rascunho.html)
        print(f"Processando: {arquivo.name}")
        dados = extrair_dados_post(arquivo)
        posts.append(dados)

    # Ordena por data (mais recente primeiro)
    posts.sort(key=lambda p: p['timestamp'], reverse=True)

    # Remove o campo timestamp (não necessário no JSON final)
    for p in posts:
        del p['timestamp']

    # Limita quantidade (opcional)
    posts = posts[:ITEMS_PER_FEED]

    # Salva JSON
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(posts, f, ensure_ascii=False, indent=2)

    print(f"✅ {len(posts)} posts salvos em {OUTPUT_FILE}")

if __name__ == "__main__":
    gerar_json_feed()
