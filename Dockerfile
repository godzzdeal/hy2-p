ARG HYSTERIA_IMAGE=tobyxdd/hysteria:latest
FROM oven/bun:1.4.3-alpine AS web
WORKDIR /app/web
COPY web/package.json web/bun.lock ./
RUN bun install --frozen-lockfile --ignore-scripts
COPY web/ ./
COPY internal/configuration/ordering/order.json /app/internal/configuration/ordering/order.json
COPY internal/buildinfo/VERSION /app/internal/buildinfo/VERSION
RUN bun run build

FROM golang:1.26-bookworm AS server
ARG PANEL_REVISION=local
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY cmd/ cmd/
COPY internal/ internal/
RUN CGO_ENABLED=0 go build -trimpath -ldflags "-X hy2-panel/internal/buildinfo.Revision=${PANEL_REVISION}" -o /panel ./cmd/panel && CGO_ENABLED=0 go build -trimpath -o /port-agent ./cmd/port-agent
RUN CGO_ENABLED=0 go build -trimpath -o /firewall-agent ./cmd/firewall-agent

FROM ${HYSTERIA_IMAGE} AS core
FROM docker:28-cli AS docker-client
FROM alpine:3.22
ARG PANEL_REVISION=local
LABEL io.hy2-panel.commit=${PANEL_REVISION}
RUN apk add --no-cache bash curl git jq coreutils util-linux ca-certificates tzdata libstdc++ && addgroup -g 10001 panel && adduser -D -u 10001 -G panel panel && mkdir /data && chown panel:panel /data
COPY --from=core /usr/local/bin/hysteria /usr/local/bin/hysteria
COPY --from=docker-client /usr/local/bin/docker /usr/local/bin/docker
COPY --from=docker-client /usr/local/libexec/docker/cli-plugins/docker-compose /usr/local/libexec/docker/cli-plugins/docker-compose
COPY --from=server /panel /usr/local/bin/panel
COPY --from=server /port-agent /usr/local/bin/port-agent
COPY --from=server /firewall-agent /usr/local/bin/firewall-agent
COPY --from=web /usr/local/bin/bun /usr/local/bin/bun
COPY --from=web --chown=panel:panel /app/web/.next/standalone /app/web
COPY --from=web --chown=panel:panel /app/web/.next/static /app/web/.next/static
COPY --from=web --chown=panel:panel /app/web/public /app/web/public
USER panel
WORKDIR /app
ENV PANEL_DATA=/data HYSTERIA_BIN=/usr/local/bin/hysteria PANEL_LISTEN=:8080 NEXT_TELEMETRY_DISABLED=1 NODE_ENV=production
EXPOSE 8080/tcp 8443/udp
ENTRYPOINT ["/usr/local/bin/panel"]
