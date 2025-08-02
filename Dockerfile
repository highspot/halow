# Keep this sync'd with node version in package.json and with the label below
FROM public.ecr.aws/docker/library/node:18-alpine

LABEL "org.opencontainers.image.source"="https://github.com/highspot/halow"
LABEL "io.snyk.containers.image.dockerfile"="/Dockerfile"
LABEL "org.opencontainers.image.base.name"="public.ecr.aws/docker/library/node:18-alpine"
LABEL "org.opencontainers.image.authors"="devops"

# Get the latest updates and install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

ENV NODE_ENV=production
ENV PORT=3400

EXPOSE $PORT

WORKDIR /srv/halow

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copy application code
COPY dist/ ./dist/
COPY views/ ./views/
COPY public/ ./public/

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S halow -u 1001 -G nodejs && \
    chown -R halow:nodejs /srv/halow

USER halow

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/server.js"]