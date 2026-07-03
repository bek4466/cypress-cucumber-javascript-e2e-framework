# Reproducible Linux execution image. The factory tag and runtime versions are
# pinned; update them deliberately with package.json and the lockfile.
ARG NODE_VERSION='24.18.0'
ARG CYPRESS_VERSION='15.17.0'
FROM cypress/factory:4.0.2

WORKDIR /e2e
COPY package.json package-lock.json ./
RUN npm ci
COPY . .

# Electron is built into Cypress and does not require an additional browser.
CMD ["npm", "run", "test:all"]
