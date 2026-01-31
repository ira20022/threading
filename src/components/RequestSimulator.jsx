import './RequestSimulator.css'

function RequestSimulator({
  asyncRequests,
  setAsyncRequests,
  syncRequests,
  setSyncRequests,
  isSimulating,
  onStartSimulation,
  onStopSimulation,
  simulationSpeed,
  setSimulationSpeed
}) {
  return (
    <div className="request-simulator">
      
      <div className="simulator-grid">
        <div className="request-config">
          <div className="request-type async-config">
            <h3>Async Endpoints Concurrent Requests</h3>
            <div className="request-input">
              <div className="input-controls">
                <button
                  onClick={() => setAsyncRequests(Math.max(0, asyncRequests - 1))}
                  disabled={isSimulating || asyncRequests <= 0}
                >
                  -
                </button>
                <input
                  type="number"
                  min="0"
                  max="50"
                  value={asyncRequests}
                  onChange={(e) => {
                    const value = Math.min(50, Math.max(0, parseInt(e.target.value) || 0))
                    setAsyncRequests(value)
                  }}
                  disabled={isSimulating}
                  className="value-input"
                />
                <button
                  onClick={() => setAsyncRequests(Math.min(50, asyncRequests + 1))}
                  disabled={isSimulating || asyncRequests >= 50}
                >
                  +
                </button>
              </div>
            </div>
            <div className="behavior-info">
              <h4>Behavior:</h4>
              <ul>
                <li>Handled directly by Event Loop</li>
                <li>No Thread Pool usage</li>
                <li>Cooperative multitasking</li>
                <li>Non-blocking execution</li>
              </ul>
            </div>
          </div>

          <div className="request-type sync-config">
            <h3>Sync Endpoints Concurrent Requests</h3>
            <div className="request-input">
              <div className="input-controls">
                <button
                  onClick={() => setSyncRequests(Math.max(0, syncRequests - 1))}
                  disabled={isSimulating || syncRequests <= 0}
                >
                  -
                </button>
                <input
                  type="number"
                  min="0"
                  max="50"
                  value={syncRequests}
                  onChange={(e) => {
                    const value = Math.min(50, Math.max(0, parseInt(e.target.value) || 0))
                    setSyncRequests(value)
                  }}
                  disabled={isSimulating}
                  className="value-input"
                />
                <button
                  onClick={() => setSyncRequests(Math.min(50, syncRequests + 1))}
                  disabled={isSimulating || syncRequests >= 50}
                >
                  +
                </button>
              </div>
            </div>
            <div className="behavior-info">
              <h4>Behavior:</h4>
              <ul>
                <li>Offloaded to Thread Pool</li>
                <li>Event Loop remains free</li>
                <li>Blocking operations in threads</li>
                <li>Limited by thread pool size</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="simulation-controls">
          <div className="speed-control">
            <label htmlFor="speed-slider">Simulation Speed</label>
            <div className="speed-slider-container">
              <span className="speed-label">Slow</span>
              <input
                id="speed-slider"
                type="range"
                min="1"
                max="10"
                value={simulationSpeed}
                onChange={(e) => setSimulationSpeed(parseInt(e.target.value))}
                disabled={isSimulating}
                className="speed-slider"
              />
              <span className="speed-label">Fast</span>
            </div>
            <div className="speed-value">
              Speed: {simulationSpeed}/10
              {simulationSpeed >= 1 && simulationSpeed <= 2 && <span className="speed-desc">(Very Slow)</span>}
              {simulationSpeed >= 3 && simulationSpeed <= 4 && <span className="speed-desc">(Slow)</span>}
              {simulationSpeed === 5 && <span className="speed-desc">(Normal)</span>}
              {simulationSpeed >= 6 && simulationSpeed <= 8 && <span className="speed-desc">(Fast)</span>}
              {simulationSpeed >= 9 && simulationSpeed <= 10 && <span className="speed-desc">(Very Fast)</span>}
            </div>
          </div>

          <div className="control-buttons">
            <button
              className="start-btn"
              onClick={onStartSimulation}
              disabled={isSimulating || (asyncRequests === 0 && syncRequests === 0)}
            >
              {isSimulating ? 'Simulating...' : 'Start Simulation'}
            </button>
            
            <button
              className="stop-btn"
              onClick={onStopSimulation}
              disabled={!isSimulating}
            >
              Stop Simulation
            </button>
          </div>

          <div className="simulation-info">
            <div className="info-row">
              <span>Total Requests:</span>
              <span className="value">{asyncRequests + syncRequests}</span>
            </div>
            <div className="info-row">
              <span>Async:</span>
              <span className="value async">{asyncRequests}</span>
            </div>
            <div className="info-row">
              <span>Sync:</span>
              <span className="value sync">{syncRequests}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default RequestSimulator