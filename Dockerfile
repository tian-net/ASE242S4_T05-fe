# Usamos una imagen oficial de Node.js ligera
FROM node:20-alpine

# Directorio de trabajo dentro del contenedor
WORKDIR /app

# Copiamos package.json y package-lock.json primero para aprovechar la caché de Docker
COPY package*.json ./

# Instalamos dependencias
RUN npm install

# Copiamos el resto del código fuente
COPY . .

# Exponemos el puerto real de Vite
EXPOSE 5173

# Ejecutamos el frontend asegurando que escuche en todas las interfaces de red
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]