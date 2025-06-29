FROM node:22-alpine AS builder

WORKDIR /build

# install dependencies
# copy only package.json files for better caching
# (if no dependencies are changed, there is no need to reinstall them, so it is faster to use the cache)
COPY package*.json ./
RUN npm ci --fund=false
# copy rest of src files etc.
COPY . .

# build and install only production dependencies
RUN npm run build
# install only production dependencies for reducing image size and security (no need for dev dependencies in prod env)
RUN npm ci --omit=dev --audit=false --fund=false


######################################################################

FROM node:22-alpine

WORKDIR /app

LABEL org.opencontainers.image.authors="Nico W. <info@ni-wa.de>"

EXPOSE 3000

# set node env to production because it will not be set as default anywhere
ENV NODE_ENV=production
# only if healthcheck exists
# HEALTHCHECK --interval=10s --retries=2 CMD npx docker-healthcheck || exit 1

# copy files from build stage
COPY --from=builder /build/dist/ dist/
COPY --from=builder /build/package*.json ./
COPY --from=builder /build/node_modules/ node_modules/

# [IF WANTED] change user permissions
#RUN chown node:node -R *
# [IF WANTED] switch to node user for more security
#USER node


ENTRYPOINT ["node", "."]
