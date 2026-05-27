#!/bin/bash
# Script para instalar dependências do Puppeteer no Render

# Atualizar apt e instalar dependências do Chrome
apt-get update
apt-get install -y \
    ca-certificates \
    fonts-liberation \
    libasound2 \
    libatk-bridge-2.0-0 \
    libatk1.0-0 \
    libatspi2.0-0 \
    libcups2 \
    libdbus-1-3 \
    libdrm2 \
    libgbm1 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libwayland-client0 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxkbcommon0 \
    libxrandr2 \
    xdg-utils

# Instalar Chromium
apt-get install -y chromium-browser

echo "Chromium instalado com sucesso"
