# Utiliser une image Node.js officielle
FROM node:20-alpine

# Définir le répertoire de travail
WORKDIR /app

# Copier les fichiers de dépendances
COPY package*.json ./

# Installer les dépendances de production uniquement
RUN npm install --only=production

# Copier tous les fichiers du projet
COPY . .

# Exposer le port utilisé par l'application
EXPOSE 8080

# Définir les variables d'environnement
ENV NODE_ENV=production
ENV PORT=8080

# Commande pour démarrer l'application
CMD ["node", "server.js"]
