# Use a Bun image
FROM oven/bun:1-alpine

# Set the working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package.json bun.lock* ./
RUN bun install --frozen-lockfile

# Copy the rest of the code
COPY . .

# Remove development dependencies
RUN bun install --production

# Set the command to run the script every time the container starts
CMD ["bun", "start"]