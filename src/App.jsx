import { useState, useEffect, useRef } from 'react'
import './App.css'
import WorkerProcess from './components/WorkerProcess'
import ControlPanel from './components/ControlPanel'
import RequestSimulator from './components/RequestSimulator'

function App() {
  const [numWorkers, setNumWorkers] = useState(1)
  const [threadPoolSize, setThreadPoolSize] = useState(4)
  const [dbPoolSize, setDbPoolSize] = useState(8)
  const [asyncRequests, setAsyncRequests] = useState(0)
  const [syncRequests, setSyncRequests] = useState(0)
  const [isSimulating, setIsSimulating] = useState(false)
  const [activeRequests, setActiveRequests] = useState([])
  const [simulationSpeed, setSimulationSpeed] = useState(5)
  const requestIdRef = useRef(0)

  const generateRequestId = () => ++requestIdRef.current

  const addAsyncRequest = () => {
    if (!isSimulating) return
    
    const newRequest = {
      id: generateRequestId(),
      type: 'async',
      status: 'pending',
      workerId: Math.floor(Math.random() * numWorkers),
      startTime: Date.now(),
      phase: 'queued'
    }
    
    setActiveRequests(prev => [...prev, newRequest])
  }

  const addSyncRequest = () => {
    if (!isSimulating) return
    
    const newRequest = {
      id: generateRequestId(),
      type: 'sync',
      status: 'pending',
      workerId: Math.floor(Math.random() * numWorkers),
      startTime: Date.now(),
      phase: 'queued'
    }
    
    setActiveRequests(prev => [...prev, newRequest])
  }

  const startSimulation = () => {
    if (isSimulating) return
    
    // Reset request ID counter to start from 0 for each simulation
    requestIdRef.current = 0
    
    setIsSimulating(true)
    setActiveRequests([])
    
    // Generate requests with a small delay to ensure proper state update
    setTimeout(() => {
      const allRequests = []
      
      // Generate async requests
      for (let i = 0; i < asyncRequests; i++) {
        allRequests.push({
          id: generateRequestId(),
          type: 'async',
          status: 'pending',
          workerId: Math.floor(Math.random() * numWorkers),
          startTime: Date.now(),
          phase: 'queued'
        })
      }
      
      // Generate sync requests
      for (let i = 0; i < syncRequests; i++) {
        allRequests.push({
          id: generateRequestId(),
          type: 'sync',
          status: 'pending',
          workerId: Math.floor(Math.random() * numWorkers),
          startTime: Date.now(),
          phase: 'queued'
        })
      }
      
      setActiveRequests(allRequests)
    }, 100)
  }

  const stopSimulation = () => {
    setIsSimulating(false)
    setActiveRequests([])
  }

  const updateRequestPhase = (requestId, phase, status = 'processing') => {
    setActiveRequests(prev => 
      prev.map(req => 
        req.id === requestId 
          ? { ...req, phase, status }
          : req
      )
    )
  }

  const completeRequest = (requestId) => {
    setActiveRequests(prev => 
      prev.filter(req => req.id !== requestId)
    )
  }

  // Auto-stop simulation when all requests complete
  useEffect(() => {
    if (isSimulating) {
      const totalRequests = asyncRequests + syncRequests
      if (totalRequests > 0 && activeRequests.length === 0) {
        // Add a delay to ensure all requests have been processed
        const timeoutId = setTimeout(() => {
          console.log('Stopping simulation - all requests completed')
          setIsSimulating(false)
        }, 1500)
        return () => clearTimeout(timeoutId)
      }
    }
  }, [activeRequests, isSimulating, asyncRequests, syncRequests])

  return (
    <div className="app">
      <header className="app-header">
        <h1>Event Loop & Threading Visualization</h1>
        <p>Interactive demonstration of async/await behavior and thread pool management</p>
      </header>

      <div className="control-simulation-panel">
        <ControlPanel
          numWorkers={numWorkers}
          setNumWorkers={setNumWorkers}
          threadPoolSize={threadPoolSize}
          setThreadPoolSize={setThreadPoolSize}
          dbPoolSize={dbPoolSize}
          setDbPoolSize={setDbPoolSize}
        />

        <RequestSimulator
          asyncRequests={asyncRequests}
          setAsyncRequests={setAsyncRequests}
          syncRequests={syncRequests}
          setSyncRequests={setSyncRequests}
          isSimulating={isSimulating}
          onStartSimulation={startSimulation}
          onStopSimulation={stopSimulation}
          simulationSpeed={simulationSpeed}
          setSimulationSpeed={setSimulationSpeed}
        />
      </div>

      <div className="workers-container">
        <div className="workers-grid">
          {Array.from({ length: numWorkers }, (_, index) => (
            <WorkerProcess
              key={index}
              workerId={index}
              threadPoolSize={threadPoolSize}
              dbPoolSize={dbPoolSize}
              requests={activeRequests.filter(req => req.workerId === index)}
              onUpdateRequestPhase={updateRequestPhase}
              onCompleteRequest={completeRequest}
              isSimulating={isSimulating}
              simulationSpeed={simulationSpeed}
            />
          ))}
        </div>
      </div>

      {isSimulating && (
        <div className="dynamic-controls">
          <h3>Add Requests During Simulation</h3>
          <div className="dynamic-buttons">
            <button
              className="add-request-btn async-btn"
              onClick={addAsyncRequest}
            >
              + Add Async Request
            </button>
            <button
              className="add-request-btn sync-btn"
              onClick={addSyncRequest}
            >
              + Add Sync Request
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
