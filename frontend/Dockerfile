FROM node:18-alpine

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install

COPY . .

EXPOSE 3000

# Next.js development server with hot reload
CMD ["npm", "run", "dev"]
