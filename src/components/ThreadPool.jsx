import { useEffect, useState, useRef, useMemo } from 'react'
import './ThreadPool.css'

function ThreadPool({ size, tasks, onCompleteTask, onDbTaskUpdate, isSimulating, simulationSpeed }) {
  // Initialize threads with a stable initial state using useMemo
  const initialThreads = useMemo(() =>
    Array.from({ length: size }, (_, index) => ({
      id: index,
      busy: false,
      task: null,
      startTime: null
    })), [size]
  )
  
  const [threads, setThreads] = useState(initialThreads)
  // Separate state for tracking busy status to avoid conflicts
  const [busyThreadIds, setBusyThreadIds] = useState(new Set())
  const [queuedTasks, setQueuedTasks] = useState([])
  const [processingTasks, setProcessingTasks] = useState(new Set()) // Track tasks being processed
  const processedTasksRef = useRef(new Set()) // Track tasks that have been processed

  // Reset state when simulation stops
  useEffect(() => {
    if (!isSimulating) {
      const resetState = () => {
        setThreads(prev => prev.map(thread => ({
          ...thread,
          busy: false,
          task: null,
          startTime: null
        })))
        setQueuedTasks([])
        setProcessingTasks(new Set())
        processedTasksRef.current = new Set()
      }
      resetState()
    }
  }, [isSimulating])

  // Process incoming tasks
  useEffect(() => {
    if (!isSimulating) return

    tasks.forEach(task => {
      const isAlreadyQueued = queuedTasks.find(t => t.id === task.id)
      const isAlreadyProcessing = threads.find(thread => thread.task?.id === task.id)
      const isBeingProcessed = processingTasks.has(task.id)
      const isCompleted = processedTasksRef.current.has(task.id)
      
      if (!isAlreadyQueued && !isAlreadyProcessing && !isBeingProcessed && !isCompleted) {
        setQueuedTasks(prev => [...prev, { ...task, queueTime: Date.now() }])
      }
    })
  }, [tasks, isSimulating, queuedTasks, processingTasks])

  // Assign tasks to available threads immediately when tasks arrive or threads become free
  useEffect(() => {
    if (!isSimulating || queuedTasks.length === 0) return

    // Calculate speed multiplier (speed 10 = 1x, speed 1 = 10x slower)
    const speedMultiplier = 11 - simulationSpeed

    const assignTasks = () => {
      setThreads(prevThreads => {
        const updatedThreads = [...prevThreads]
        let remainingQueue = [...queuedTasks]
        let tasksAssigned = false

        updatedThreads.forEach((thread, index) => {
          if (!busyThreadIds.has(thread.id) && remainingQueue.length > 0) {
            const nextTask = remainingQueue.shift()
            
            // Check if task is already being processed or has been processed
            if (processingTasks.has(nextTask.id) || processedTasksRef.current.has(nextTask.id)) {
              return // Skip this task, it's already being processed or completed
            }
            
            // Mark task as being processed to prevent duplicates
            setProcessingTasks(prev => new Set([...prev, nextTask.id]))
            processedTasksRef.current.add(nextTask.id)
            tasksAssigned = true
            
            updatedThreads[index] = {
              ...thread,
              task: nextTask,
              startTime: Date.now()
            }
            
            // Set thread as busy using separate state
            setBusyThreadIds(prev => new Set([...prev, thread.id]))
            

            // Capture task and thread info immediately
            const taskId = nextTask.id
            const threadId = thread.id
            
            // All sync tasks have DB operations (100% chance)
            const needsDb = true
            
            if (needsDb && onDbTaskUpdate) {
              // For sync operations, the thread stays busy during the entire DB operation
              // Add a significant delay so you can see the thread as busy BEFORE DB starts
              setTimeout(() => {
                onDbTaskUpdate(taskId, 'add', {
                  ...nextTask,
                  phase: 'db-operation',
                  dbPhase: 'db-operation',
                  dbStartTime: Date.now(),
                  type: 'sync'
                })
                
                // DB operation duration - thread remains busy during this entire time
                const dbDuration = (800 + Math.random() * 600) * speedMultiplier // Reduced duration
                setTimeout(() => {
                  // Remove from DB operations
                  onDbTaskUpdate(taskId, 'remove')
                  
                  // Complete the sync task and free the thread
                  setBusyThreadIds(prev => {
                    const newSet = new Set(prev)
                    newSet.delete(threadId)
                    return newSet
                  })
                  setThreads(current =>
                    current.map(t =>
                      t.id === threadId
                        ? { ...t, task: null, startTime: null }
                        : t
                    )
                  )
                  // Remove from processing tasks
                  setProcessingTasks(prev => {
                    const newSet = new Set(prev)
                    newSet.delete(taskId)
                    return newSet
                  })
                  onCompleteTask(taskId, 'sync')
                }, dbDuration)
              }, 800 * speedMultiplier) // Reduced delay to see thread busy first
            } else {
              // Complete task without DB operation
              const duration = (1200 + Math.random() * 1800) * speedMultiplier
              setTimeout(() => {
                setBusyThreadIds(prev => {
                  const newSet = new Set(prev)
                  newSet.delete(threadId)
                  return newSet
                })
                setThreads(current =>
                  current.map(t =>
                    t.id === threadId
                      ? { ...t, task: null, startTime: null }
                      : t
                  )
                )
                // Remove from processing tasks
                setProcessingTasks(prev => {
                  const newSet = new Set(prev)
                  newSet.delete(taskId)
                  return newSet
                })
                onCompleteTask(taskId, 'sync')
              }, duration)
            }
          }
        })

        if (tasksAssigned) {
          setQueuedTasks(remainingQueue)
        }
        return updatedThreads
      })
    }

    // Add a small delay to make the queue visible
    const timeoutId = setTimeout(assignTasks, 500)
    return () => clearTimeout(timeoutId)
  }, [queuedTasks, isSimulating, onCompleteTask, onDbTaskUpdate, simulationSpeed])

  const busyThreads = threads.filter(thread => busyThreadIds.has(thread.id))

  return (
    <div className="thread-pool">
      <div className="component-header">
        <h4>Thread Pool</h4>
        <div className="component-stats">
          <span className="busy-count">Busy: {busyThreads.length}/{size}</span>
          <span className="queue-count">Queue: {queuedTasks.length}</span>
        </div>
      </div>

      <div className="thread-pool-content">
        <div className="task-queue">
          <h5>Sync Task Queue</h5>
          <div className="queue-items">
            {queuedTasks.map(task => (
              <div key={task.id} className="queue-item sync">
                <span className="task-id">#{task.id}</span>
                <span className="task-type">Sync</span>
                <span className="wait-time">Queued</span>
              </div>
            ))}
            {queuedTasks.length === 0 && (
              <div className="empty-state">No queued tasks</div>
            )}
          </div>
        </div>

        <div className="threads-grid">
          <h5>Thread Pool ({size} threads)</h5>
          <div className="threads-container">
            {threads.map(thread => {
              const isBusy = busyThreadIds.has(thread.id)
              return (
                <div
                  key={thread.id}
                  className={`thread ${isBusy ? 'busy' : 'idle'}`}
                >
                  <div className="thread-header">
                    <span className="thread-id">Thread {thread.id}</span>
                    <span className={`thread-status ${isBusy ? 'busy' : 'idle'}`}>
                      {isBusy ? 'BUSY' : 'IDLE'}
                    </span>
                  </div>
                  
                  {isBusy && thread.task && (
                    <div className="thread-task">
                      <div className="task-info">
                        <span className="task-id">#{thread.task.id}</span>
                        <span className="task-type">Sync Request</span>
                      </div>
                      <div className="task-progress">
                        <div className="progress-bar">
                          <div className="progress-fill sync-progress"></div>
                        </div>
                      </div>
                      <div className="execution-time">
                        Processing...
                      </div>
                    </div>
                  )}

                  {!isBusy && (
                    <div className="thread-idle">
                      <span>Waiting for work...</span>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ThreadPool