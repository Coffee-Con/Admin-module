# Using the official Node.js image
FROM node:23

# Set the working directory
WORKDIR /usr/src/app

# Copy package.json, package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy all files
COPY . .

# Expose port
EXPOSE 80 443 4000 4001

# npm start
CMD ["npm", "start"]
