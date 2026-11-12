package aclfiles

import (
	"context"
	"errors"
	"net"
	"net/http"
	"net/netip"
	"net/url"
	"strings"
	"time"
)

const DownloadTimeout = 25 * time.Second
const ConnectTimeout = 10 * time.Second
const MaxRedirects = 5

func ValidateURL(raw string) error {
	address, err := url.Parse(raw)
	if err != nil || address.Scheme != "https" || address.Hostname() == "" || address.User != nil || address.Fragment != "" || (address.Port() != "" && address.Port() != "443") {
		return errors.New("Укажите прямую HTTPS-ссылку на файл без логина и пароля")
	}
	return nil
}

func IsPublic(address netip.Addr) bool {
	address = address.Unmap()
	if !address.IsGlobalUnicast() || address.IsPrivate() || address.IsLoopback() || address.IsLinkLocalUnicast() {
		return false
	}
	for _, prefix := range blockedPrefixes {
		if prefix.Contains(address) {
			return false
		}
	}
	return true
}

var blockedPrefixes = []netip.Prefix{netip.MustParsePrefix("0.0.0.0/8"), netip.MustParsePrefix("100.64.0.0/10"), netip.MustParsePrefix("192.0.0.0/24"), netip.MustParsePrefix("198.18.0.0/15"), netip.MustParsePrefix("240.0.0.0/4"), netip.MustParsePrefix("64:ff9b::/96"), netip.MustParsePrefix("64:ff9b:1::/48"), netip.MustParsePrefix("2002::/16"), netip.MustParsePrefix("2001::/32")}

func publicDial(ctx context.Context, network, target string) (net.Conn, error) {
	host, port, err := net.SplitHostPort(target)
	if err != nil {
		return nil, err
	}
	addresses, err := net.DefaultResolver.LookupNetIP(ctx, "ip", host)
	if err != nil {
		return nil, err
	}
	if len(addresses) == 0 {
		return nil, errors.New("Адрес загрузки не найден")
	}
	for _, address := range addresses {
		if !IsPublic(address) {
			return nil, errors.New("Загрузка из локальных и служебных сетей запрещена")
		}
	}
	dialer := net.Dialer{Timeout: ConnectTimeout}
	var failure error
	for _, address := range addresses {
		connection, err := dialer.DialContext(ctx, network, net.JoinHostPort(address.String(), port))
		if err == nil {
			return connection, nil
		}
		failure = err
	}
	return nil, failure
}

func Download(ctx context.Context, data, kind, raw string) (string, error) {
	if err := ValidateURL(raw); err != nil {
		return "", err
	}
	transport := &http.Transport{DialContext: publicDial, TLSHandshakeTimeout: ConnectTimeout, ResponseHeaderTimeout: ConnectTimeout}
	defer transport.CloseIdleConnections()
	client := http.Client{Timeout: DownloadTimeout, Transport: transport, CheckRedirect: func(request *http.Request, via []*http.Request) error {
		if len(via) >= MaxRedirects {
			return errors.New("Слишком много перенаправлений")
		}
		return ValidateURL(request.URL.String())
	}}
	request, err := http.NewRequestWithContext(ctx, http.MethodGet, raw, nil)
	if err != nil {
		return "", err
	}
	response, err := client.Do(request)
	if err != nil {
		return "", err
	}
	defer response.Body.Close()
	if response.StatusCode != http.StatusOK {
		return "", errors.New("Сервер не вернул файл. Проверьте прямую ссылку")
	}
	if strings.Contains(strings.ToLower(response.Header.Get("Content-Type")), "text/html") {
		return "", errors.New("По ссылке находится страница, а не файл")
	}
	return Store(data, kind, response.Body)
}
