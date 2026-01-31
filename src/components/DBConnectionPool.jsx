import './DBConnectionPool.css'

function DBConnectionPool({ size, connections }) {
  const activeConnections = connections.filter(conn => conn.active)
  const idleConnections = connections.filter(conn => !conn.active)

  return (
    <div className="db-connection-pool">
      <div className="component-header">
        <h4>DB Connection Pool</h4>
        <div className="component-stats">
          <span className="active-count">Active: {activeConnections.length}</span>
          <span className="idle-count">Idle: {idleConnections.length}</span>
          <span className="total-count">Total: {size}</span>
        </div>
      </div>

      <div className="db-pool-content">
        <div className="connections-grid">
          {connections.map(connection => (
            <div 
              key={connection.id} 
              className={`db-connection ${connection.active ? 'active' : 'idle'}`}
            >
              <div className="connection-header">
                <span className="connection-id">DB-{connection.id}</span>
                <span className={`connection-status ${connection.active ? 'active' : 'idle'}`}>
                  {connection.active ? 'ACTIVE' : 'IDLE'}
                </span>
              </div>
              
              {connection.active && connection.requestId && (
                <div className="connection-usage">
                  <span className="using-request">Request #{connection.requestId}</span>
                  <div className="activity-indicator">
                    <div className="activity-pulse"></div>
                  </div>
                </div>
              )}

              {!connection.active && (
                <div className="connection-idle">
                  <span>Available</span>
                </div>
              )}
            </div>
          ))}
        </div>


        {activeConnections.length > 0 && (
          <div className="usage-visualization">
            <div className="usage-bar">
              <div 
                className="usage-fill"
                style={{ width: `${(activeConnections.length / size) * 100}%` }}
              ></div>
            </div>
            <div className="usage-label">
              Pool Usage: {activeConnections.length}/{size} ({Math.round((activeConnections.length / size) * 100)}%)
            </div>
          </div>
        )}

        {activeConnections.length === size && (
          <div className="pool-exhausted">
            <span className="warning-icon">⚠️</span>
            <span>Pool Exhausted - New requests will wait</span>
          </div>
        )}
      </div>
    </div>
  )
}

export default DBConnectionPool