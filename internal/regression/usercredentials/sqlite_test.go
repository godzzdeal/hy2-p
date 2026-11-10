package usercredentials_test

import (
	"context"
	"database/sql/driver"
	"errors"
	"strings"
	"sync"
	"time"
)

// The old check/write sequence is forced to read two zero counts before either
// write. Transactions serialize as on the application's single-connection pool.
type connector struct {
	driver driver.Driver
	name   string
	mu     sync.Mutex
	gate   *validationGate
}

func (source *connector) Driver() driver.Driver { return source.driver }
func (source *connector) Connect(context.Context) (driver.Conn, error) {
	base, err := source.driver.Open(source.name)
	if err != nil {
		return nil, err
	}
	return &connection{Conn: base, source: source}, nil
}

type connection struct {
	driver.Conn
	source        *connector
	inTransaction bool
}

func (conn *connection) BeginTx(ctx context.Context, options driver.TxOptions) (driver.Tx, error) {
	beginner, ok := conn.Conn.(driver.ConnBeginTx)
	if !ok {
		return nil, errors.New("fixture requires ConnBeginTx")
	}
	conn.source.mu.Lock()
	baseTransaction, err := beginner.BeginTx(ctx, options)
	if err != nil {
		conn.source.mu.Unlock()
		return nil, err
	}
	conn.inTransaction = true
	return &transaction{Tx: baseTransaction, connection: conn}, nil
}
func (conn *connection) ExecContext(ctx context.Context, query string, values []driver.NamedValue) (driver.Result, error) {
	if !conn.inTransaction {
		conn.source.mu.Lock()
		defer conn.source.mu.Unlock()
	}
	executor, ok := conn.Conn.(driver.ExecerContext)
	if !ok {
		return nil, errors.New("fixture requires ExecerContext")
	}
	return executor.ExecContext(ctx, query, values)
}
func (conn *connection) QueryContext(ctx context.Context, query string, values []driver.NamedValue) (driver.Rows, error) {
	queryer, ok := conn.Conn.(driver.QueryerContext)
	if !ok {
		return nil, errors.New("fixture requires QueryerContext")
	}
	rows, err := queryer.QueryContext(ctx, query, values)
	if err != nil {
		return nil, err
	}
	if !conn.inTransaction && strings.HasPrefix(query, "SELECT count(*) FROM users WHERE id<>") && conn.source.gate != nil {
		return &validationRows{Rows: rows, gate: conn.source.gate}, nil
	}
	return rows, nil
}

type transaction struct {
	driver.Tx
	connection *connection
}

func (tx *transaction) finish() {
	tx.connection.inTransaction = false
	tx.connection.source.mu.Unlock()
}
func (tx *transaction) Commit() error   { defer tx.finish(); return tx.Tx.Commit() }
func (tx *transaction) Rollback() error { defer tx.finish(); return tx.Tx.Rollback() }

type validationGate struct {
	mu    sync.Mutex
	count int
	done  chan struct{}
}

func (gate *validationGate) wait() error {
	gate.mu.Lock()
	gate.count++
	if gate.count == 2 {
		close(gate.done)
	}
	gate.mu.Unlock()
	select {
	case <-gate.done:
		return nil
	case <-time.After(5 * time.Second):
		return errors.New("competing validation never completed")
	}
}

type validationRows struct {
	driver.Rows
	gate *validationGate
}

func (rows *validationRows) Next(values []driver.Value) error {
	if err := rows.Rows.Next(values); err != nil {
		return err
	}
	return rows.gate.wait()
}
