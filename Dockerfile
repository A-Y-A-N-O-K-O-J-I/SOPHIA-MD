# Use the official Node.js runtime image
FROM node:16-alpine

RUN apk add --no-cache git

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install || yarn install

# Copy the rest of your app's files
COPY . .

# Expose the port (Hugging Face Spaces doesn't expose ports, but it's good practice)
EXPOSE 8000

# Start the WhatsApp bot
CMD ["node", "index.js"]