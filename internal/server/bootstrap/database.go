package bootstrap

import (
	"database/sql"
	"encoding/json"
	"hy2-panel/internal/configuration"
	_ "modernc.org/sqlite"
	"os"
	"path/filepath"
)

func OpenDatabase(data string, initial configuration.Settings) (*sql.DB, error) {
	if err := os.MkdirAll(data, 0700); err != nil {
		return nil, err
	}
	db, err := sql.Open("sqlite", filepath.Join(data, "panel.db"))
	if err != nil {
		return nil, err
	}
	db.SetMaxOpenConns(1)
	if _, err = db.Exec(schema); err != nil {
		db.Close()
		return nil, err
	}
	raw, err := json.Marshal(initial)
	if err != nil {
		db.Close()
		return nil, err
	}
	if _, err = db.Exec("INSERT OR IGNORE INTO settings(id,body) VALUES(1,?)", string(raw)); err != nil {
		db.Close()
		return nil, err
	}
	return db, nil
}

const schema = `PRAGMA journal_mode=WAL;
CREATE TABLE IF NOT EXISTS users(id TEXT PRIMARY KEY,name TEXT NOT NULL,enabled INTEGER NOT NULL,expires TEXT NOT NULL,created TEXT NOT NULL,password TEXT NOT NULL,token TEXT NOT NULL UNIQUE);
CREATE TABLE IF NOT EXISTS settings(id INTEGER PRIMARY KEY CHECK(id=1),body TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS history(id INTEGER PRIMARY KEY,created TEXT NOT NULL,body TEXT NOT NULL);`
