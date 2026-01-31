import './ControlPanel.css'

function ControlPanel({ 
  numWorkers, 
  setNumWorkers, 
  threadPoolSize, 
  setThreadPoolSize, 
}) {
  return (
    <div className="control-panel">
      <h2>System Configuration</h2>
      
      <div className="controls-grid">
        <div className="control-group">
          <label htmlFor="workers">Number of Workers</label>
          <div className="control-input">
            <button 
              onClick={() => setNumWorkers(Math.max(1, numWorkers - 1))}
              disabled={numWorkers <= 1}
            >
              -
            </button>
            <span className="value">{numWorkers}</span>
            <button 
              onClick={() => setNumWorkers(Math.min(8, numWorkers + 1))}
              disabled={numWorkers >= 8}
            >
              +
            </button>
          </div>
        </div>

        <div className="control-group">
          <label htmlFor="thread-pool">Thread Pool Size (Global)</label>
          <div className="control-input">
            <button 
              onClick={() => setThreadPoolSize(Math.max(1, threadPoolSize - 1))}
              disabled={threadPoolSize <= 1}
            >
              -
            </button>
            <span className="value">{threadPoolSize}</span>
            <button 
              onClick={() => setThreadPoolSize(Math.min(16, threadPoolSize + 1))}
              disabled={threadPoolSize >= 16}
            >
              +
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}

export default ControlPanel