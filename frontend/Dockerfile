FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install && npm install serve -g
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["serve", "-s", "build", "-l", "3000"]