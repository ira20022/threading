import { useEffect, useState } from 'react'
import './EventLoop.css'

function EventLoop({ tasks, onCompleteTask, onDbTaskUpdate, isSimulating, simulationSpeed }) {
  const [activeTasks, setActiveTasks] = useState([])
  const [taskQueue, setTaskQueue] = useState([]) // Single queue for both new and returning tasks
  const [processedTaskIds, setProcessedTaskIds] = useState(new Set()) // Track processed tasks

  // Reset state when simulation stops
  useEffect(() => {
    if (!isSimulating) {
      const resetState = () => {
        setActiveTasks([])
        setTaskQueue([])
        setProcessedTaskIds(new Set())
      }
      resetState()
    }
  }, [isSimulating])

  // Process new tasks
  useEffect(() => {
    if (!isSimulating) return

    tasks.forEach(task => {
      if (!processedTaskIds.has(task.id)) {
        setTaskQueue(prev => [...prev, { ...task, phase: 'queued', startTime: Date.now(), isNewTask: true }])
        setProcessedTaskIds(prev => new Set([...prev, task.id]))
      }
    })
  }, [tasks, isSimulating, processedTaskIds])

  // Function to add returning tasks to the queue
  const addReturningTask = (task) => {
    setTaskQueue(prev => [...prev, {
      ...task,
      phase: 'queued',
      isNewTask: false,
      returnTime: Date.now()
    }])
  }

  useEffect(() => {
    if (!isSimulating) return

    // Calculate speed multiplier (speed 10 = 1x, speed 1 = 10x slower)
    const speedMultiplier = 11 - simulationSpeed

    const processQueue = () => {
      // Only process if there are queued tasks and no currently executing task
      const currentlyExecuting = activeTasks.find(t => t.inEventLoop === true)
      
      if (taskQueue.length === 0 || currentlyExecuting) return

      // Process the first task in the queue (FIFO)
      const nextTask = taskQueue[0]
      
      // Remove from queue
      setTaskQueue(prev => prev.filter(t => t.id !== nextTask.id))
      
      // Move task to active processing (single task execution)
      setActiveTasks(current => {
        // Avoid duplicates
        if (current.find(t => t.id === nextTask.id)) {
          return current
        }
        
        if (nextTask.isNewTask) {
          // New task starts from beginning
          return [...current, { ...nextTask, phase: 'processing', dbPhase: 'pre-await', inEventLoop: true }]
        } else {
          // Returning task continues after await
          return [...current, { ...nextTask, phase: 'post-await', dbPhase: 'post-await', inEventLoop: true }]
        }
      })
      
      if (nextTask.isNewTask) {
        // Simulate async task execution with clear await behavior
        setTimeout(() => {
          // Phase 1: Hit await - task leaves event loop and goes to DB
          setActiveTasks(current => current.filter(t => t.id !== nextTask.id))
          
          // Notify parent about DB task
          onDbTaskUpdate(nextTask.id, 'add', {
            ...nextTask,
            phase: 'db-operation',
            dbPhase: 'db-operation',
            dbStartTime: Date.now()
          })
          
          // Phase 2: DB operation completes - task returns to queue
          setTimeout(() => {
            // Remove from DB tasks
            onDbTaskUpdate(nextTask.id, 'remove')
            
            // Add back to the same queue (returning task)
            addReturningTask(nextTask)
            
          }, (600 + Math.random() * 400) * speedMultiplier)
        }, (300 + Math.random() * 200) * speedMultiplier)
      } else {
        // Task is continuing after await - complete it
        setTimeout(() => {
          setActiveTasks(current => current.filter(t => t.id !== nextTask.id))
          onCompleteTask(nextTask.id, 'async')
        }, (200 + Math.random() * 200) * speedMultiplier)
      }
    }

    const timeoutId = setTimeout(processQueue, 100 * speedMultiplier)
    return () => clearTimeout(timeoutId)
  }, [taskQueue, activeTasks, isSimulating, onCompleteTask, onDbTaskUpdate, simulationSpeed])

  return (
    <div className="event-loop">
      <div className="component-header">
        <h4>Event Loop (Single-Threaded)</h4>
        <div className="component-stats">
          <span className="queue-count">Queue: {taskQueue.length}</span>
          <span className="active-count">Executing: {activeTasks.length}</span>
        </div>
      </div>

      <div className="event-loop-content">
        <div className="task-queue">
          <h5>Task Queue (FIFO - New & Returning)</h5>
          <div className="queue-items">
            {taskQueue.map((task, index) => {
              const isNext = index === 0 && !activeTasks.find(t => t.inEventLoop === true)
              return (
                <div key={task.id} className={`queue-item ${task.isNewTask ? 'async' : 'return'} ${isNext ? 'next-to-execute' : ''}`}>
                  <span className="task-id">#{task.id}</span>
                  <span className="task-type">{task.isNewTask ? 'New' : 'Return'}</span>
                  {isNext && <span className="next-indicator">Next</span>}
                </div>
              )
            })}
            {taskQueue.length === 0 && (
              <div className="empty-state">No queued tasks</div>
            )}
          </div>
        </div>

        <div className="active-tasks">
          <h5>Event Loop Execution (One at a time)</h5>
          <div className="active-items">
            {activeTasks.map((task, index) => (
              <div
                key={task.id}
                className={`active-item async ${task.dbPhase || ''}`}
                style={{
                  animationDelay: `${index * 0.2}s`
                }}
              >
                <span className="task-id">#{task.id}</span>
                <div className="task-progress">
                  <div className="progress-bar">
                    <div className={`progress-fill async-progress ${task.dbPhase || ''}`}></div>
                  </div>
                </div>
                <div className="task-status-container">
                  <span className="task-status">
                    {task.dbPhase === 'pre-await' && '⚡ Executing (before await)'}
                    {task.dbPhase === 'post-await' && '✅ Resumed (after await)'}
                    {!task.dbPhase && 'Processing'}
                  </span>
                  <span className="loop-indicator in-loop">In Event Loop</span>
                </div>
              </div>
            ))}
            {activeTasks.length === 0 && (
              <div className="empty-state">No executing tasks</div>
            )}
          </div>
        </div>

      </div>

      {activeTasks.length > 0 && (
        <div className="flow-visualization">
          <div className="flow-lines">
            {activeTasks.map((task, index) => (
              <div
                key={`flow-${task.id}`}
                className="flow-line async-flow"
                style={{
                  animationDelay: `${index * 0.3}s`,
                  top: `${20 + index * 15}%`
                }}
              ></div>
            ))}
          </div>
        </div>
      )}

      <div className="event-loop-info">
        <div className="info-item">
          <strong>Single-Threaded Execution:</strong> Only ONE task executes at a time in the event loop. When a task hits <code>await</code>, it pauses and the NEXT task from the queue starts executing.
        </div>
        <div className="info-item">
          <strong>FIFO Queue:</strong> Both new tasks and tasks returning from DB operations use the same queue. Tasks are processed in First-In-First-Out order.
        </div>
        <div className="info-item">
          <strong>Async/Await Flow:</strong> Task starts → hits <code>await</code> → leaves event loop → DB operation → returns to queue → resumes in event loop → completes.
        </div>
      </div>
    </div>
  )
}

export default EventLoop