import { useEffect, useState } from 'react'
import EventLoop from './EventLoop'
import ThreadPool from './ThreadPool'
import './WorkerProcess.css'

function WorkerProcess({
  workerId,
  threadPoolSize,
  requests,
  onUpdateRequestPhase,
  onCompleteRequest,
  isSimulating,
  simulationSpeed
}) {
  const [eventLoopTasks, setEventLoopTasks] = useState([])
  const [threadPoolTasks, setThreadPoolTasks] = useState([])
  const [dbTasks, setDbTasks] = useState([])

  // Reset state when simulation stops
  useEffect(() => {
    if (!isSimulating) {
      const resetTasks = () => {
        setEventLoopTasks([])
        setThreadPoolTasks([])
        setDbTasks([]) // Clear all DB tasks immediately
      }
      resetTasks()
    }
  }, [isSimulating])

  // Process incoming requests
  useEffect(() => {
    if (!isSimulating) return

    requests.forEach(request => {
      if (request.phase === 'queued') {
        if (request.type === 'async') {
          // Async requests go directly to event loop
          setEventLoopTasks(prev => {
            if (!prev.find(t => t.id === request.id)) {
              // Update phase after adding to local state
              setTimeout(() => onUpdateRequestPhase(request.id, 'event-loop'), 0)
              return [...prev, request]
            }
            return prev
          })
        } else {
          // Sync requests go to thread pool - let ThreadPool component handle queuing and assignment
          setThreadPoolTasks(prev => {
            if (!prev.find(t => t.id === request.id)) {
              // Update phase to show it's being handled by thread pool
              setTimeout(() => onUpdateRequestPhase(request.id, 'thread-pool'), 0)
              return [...prev, request]
            }
            return prev
          })
        }
      }
    })
  }, [requests, isSimulating, threadPoolSize, onUpdateRequestPhase])

  const handleDbTaskUpdate = (taskId, action, taskData = null) => {
    // Don't add new DB tasks if simulation is not running
    if (!isSimulating && action === 'add') {
      return
    }
    
    if (action === 'add') {
      setDbTasks(prev => [...prev, taskData])
    } else if (action === 'remove') {
      setDbTasks(prev => prev.filter(task => task.id !== taskId))
    }
  }

  const completeTask = (requestId, taskType) => {
    if (taskType === 'async') {
      setEventLoopTasks(prev => prev.filter(task => task.id !== requestId))
    } else {
      setThreadPoolTasks(prev => prev.filter(task => task.id !== requestId))
    }
    onCompleteRequest(requestId)
  }

  return (
    <div className="worker-process">
      <div className="worker-header">
        <h3>Worker {workerId}</h3>
        <div className="worker-stats">
          <span className="stat">
            Event Loop: {eventLoopTasks.length} tasks
          </span>
          <span className="stat">
            Thread Pool: {threadPoolTasks.filter(t => t.status === 'processing').length}/{threadPoolSize}
          </span>
          <span className="stat">
            DB Operations: {dbTasks.length}
          </span>
        </div>
      </div>

      <div className="worker-components">
        <div className="async-sync-container">
          <EventLoop
            tasks={eventLoopTasks}
            onCompleteTask={completeTask}
            onDbTaskUpdate={handleDbTaskUpdate}
            isSimulating={isSimulating}
            simulationSpeed={simulationSpeed}
          />

          <ThreadPool
            key={`threadpool-${threadPoolSize}`}
            size={threadPoolSize}
            tasks={threadPoolTasks}
            onCompleteTask={completeTask}
            onDbTaskUpdate={handleDbTaskUpdate}
            isSimulating={isSimulating}
            simulationSpeed={simulationSpeed}
          />
        </div>

        <div className="db-operations">
          <div className="component-header">
            <h4>Database Operations</h4>
            <div className="component-stats">
              <span className="db-count">Active: {dbTasks.length}</span>
            </div>
          </div>
          <div className="db-content">
            <div className="db-items">
              {dbTasks.map((task, index) => (
                <div
                  key={task.id}
                  className={`db-item ${task.type === 'sync' ? 'sync-db' : 'async-db'}`}
                  style={{
                    animationDelay: `${index * 0.2}s`
                  }}
                >
                  <span className="task-id">#{task.id}</span>
                  <div className="task-progress">
                    <div className="progress-bar">
                      <div className={`progress-fill ${task.type === 'sync' ? 'sync-db-progress' : 'db-progress'}`}></div>
                    </div>
                  </div>
                  <div className="task-status-container">
                    <span className="task-status">🗄️ DB Query Running</span>
                    <span className={`task-type-indicator ${task.type === 'sync' ? 'sync-type' : 'async-type'}`}>
                      {task.type === 'sync' ? 'Sync' : 'Async'}
                    </span>
                    <span className={`loop-indicator ${task.type === 'sync' ? 'blocking-loop' : 'out-loop'}`}>
                      {task.type === 'sync' ? 'Blocking Thread' : 'Outside Event Loop'}
                    </span>
                  </div>
                </div>
              ))}
              {dbTasks.length === 0 && (
                <div className="empty-state">No DB operations</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default WorkerProcess