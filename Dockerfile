# Use a Node.js image
FROM node:22-alpine

# Set the working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package.json package-lock.json ./
RUN npm ci

# Copy the rest of the code
COPY . .

# Build TypeScript files
RUN npm run build

# Remove development dependencies
RUN npm prune --omit=dev

# Set the command to run the script every time the container starts
CMD ["npm", "start"]