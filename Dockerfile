ARG HYSTERIA_IMAGE=tobyxdd/hysteria:latest
FROM oven/bun:1 AS web
WORKDIR /app/web
COPY web/package.json web/bun.lock ./
RUN bun install --frozen-lockfile
COPY web/ ./
RUN bun run build

FROM golang:1.26-bookworm AS server
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY cmd/ cmd/
COPY internal/ internal/
RUN CGO_ENABLED=0 go build -trimpath -o /panel ./cmd/panel

FROM ${HYSTERIA_IMAGE} AS core
FROM alpine:3.22
RUN apk add --no-cache ca-certificates tzdata && addgroup -g 10001 panel && adduser -D -u 10001 -G panel panel && mkdir /data && chown panel:panel /data
COPY --from=core /usr/local/bin/hysteria /usr/local/bin/hysteria
COPY --from=server /panel /usr/local/bin/panel
COPY --from=web /app/web/dist /app/web
USER panel
WORKDIR /app
ENV PANEL_DATA=/data PANEL_WEB=/app/web HYSTERIA_BIN=/usr/local/bin/hysteria PANEL_LISTEN=:8080
EXPOSE 8080/tcp 8443/udp
ENTRYPOINT ["/usr/local/bin/panel"]
