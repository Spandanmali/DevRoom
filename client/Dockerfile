FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy rest of the application
COPY . .

# Expose Vite's default port
EXPOSE 5173

# Start development server and expose to network
CMD ["npm", "run", "dev", "--", "--host"]
