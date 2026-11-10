package files

import "errors"

func FromConfig(source, data, serverName string) (string, error) {
	mode, paths, err := Sources(source, data)
	if err != nil {
		return "", err
	}
	certificates := []Certificate{}
	for _, path := range paths {
		certificate, err := Read(path)
		if err != nil {
			return "", errors.New("Не удалось прочитать сертификат для pinSHA256")
		}
		certificates = append(certificates, certificate)
	}
	return Pin(mode, certificates, serverName)
}

func Pin(mode string, certificates []Certificate, serverName string) (string, error) {
	pin := ""
	for _, certificate := range certificates {
		if certificate.Expired {
			continue
		}
		if mode == "acme" && serverName != "" && certificate.leaf.VerifyHostname(serverName) != nil {
			continue
		}
		if pin != "" && pin != certificate.PinSHA256 {
			return "", errors.New("Для pinSHA256 найдено несколько сертификатов. Укажите отпечаток вручную")
		}
		pin = certificate.PinSHA256
	}
	if pin == "" {
		return "", errors.New("Сертификат для pinSHA256 ещё не найден. Проверьте TLS или выдачу ACME")
	}
	return pin, nil
}
