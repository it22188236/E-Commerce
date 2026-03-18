# auth-service/Dockerfile

# Use official Node.js runtime as base image
FROM node:20-alpine

# Set working directory inside container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application code
COPY . .

# Create a non-root user to run the app
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001
USER nodejs

# Expose the port the app runs on
EXPOSE 5004

# Command to run the application
CMD ["node", "src/server.js"]