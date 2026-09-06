# SemText — static marketing site (semtext.dev) + component demos, served by nginx.
#
# Two stages:
#   builder     — node, runs `npm ci && npm run build` to produce dist/
#   production  — nginx:alpine serving dist/site at / and dist/demo at /demo/
#
# The final stage MUST be named "production" — the fleet build tooling targets
# that stage name by contract (same as elixirgenai.dev, pos.noizu.com, ...).

FROM node:22-alpine AS builder
WORKDIR /app

# Cypress is a devDependency but its binary is only needed for the e2e suite,
# never for `npm run build`. Skip the ~200MB download in the image build.
ENV CYPRESS_INSTALL_BINARY=0

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:alpine AS production

COPY nginx.conf /etc/nginx/conf.d/default.conf

# Marketing site is the web root; component demos live under /demo/.
COPY --from=builder /app/dist/site/ /usr/share/nginx/html/
COPY --from=builder /app/dist/demo/ /usr/share/nginx/html/demo/

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
