

        let processList = [];
        let ganttData = [];
        let currentTime = 0;
        let executionLog = [];
        
        // Event Listeners
        document.addEventListener('DOMContentLoaded', function() {
            document.getElementById('algorithm').addEventListener('change', toggleTimeQuantum);
            document.getElementById('addProcessBtn').addEventListener('click', addProcess);
            document.getElementById('runSchedulerBtn').addEventListener('click', runScheduler);
            document.getElementById('resetBtn').addEventListener('click', resetSimulator);
            document.getElementById('generateRandomBtn').addEventListener('click', generateRandomProcesses);
            
            toggleTimeQuantum();
        });
        
        function toggleTimeQuantum() {
            const algorithm = document.getElementById('algorithm').value;
            const quantumInput = document.getElementById('quantumInput');
            quantumInput.classList.toggle('hidden', algorithm !== 'rr');
        }
        
        function addProcess() {
            const pid = document.getElementById('processId').value || `P${processList.length + 1}`;
            const arrivalTime = parseInt(document.getElementById('arrivalTime').value) || 0;
            const burstTime = parseInt(document.getElementById('burstTime').value);
            const priority = parseInt(document.getElementById('priority').value) || 1;
            const color = document.getElementById('processColor').value;
            
            if (isNaN(burstTime) || burstTime <= 0) {
                showNotification("Please enter a valid burst time (greater than 0).", "error");
                return;
            }
            
            if (processList.some(p => p.pid === pid)) {
                showNotification(`Process ID "${pid}" already exists.`, "error");
                return;
            }
            
            processList.push({
                pid: pid,
                arrivalTime: arrivalTime,
                burstTime: burstTime,
                priority: priority,
                color: color,
                remainingTime: burstTime,
                completionTime: 0,
                turnaroundTime: 0,
                waitingTime: 0,
                responseTime: -1 // -1 indicates not yet responded to
            });
            
            updateProcessTable();
            showNotification(`Process ${pid} added successfully.`, "success");
            
            // Clear input fields for the next process
            document.getElementById('processId').value = "";
            document.getElementById('arrivalTime').value = "";
            document.getElementById('burstTime').value = "";
        }
        
        function deleteProcess(pid) {
            processList = processList.filter(p => p.pid !== pid);
            updateProcessTable();
            showNotification(`Process ${pid} removed.`, "info");
        }
        
        function updateProcessTable() {
            const tableBody = document.getElementById('processTable');
            tableBody.innerHTML = '';
            
            processList.forEach(p => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td class="border border-gray-500 p-2">${p.pid}</td>
                    <td class="border border-gray-500 p-2">${p.arrivalTime}</td>
                    <td class="border border-gray-500 p-2">${p.burstTime}</td>
                    <td class="border border-gray-500 p-2">${p.priority}</td>
                    <td class="border border-gray-500 p-2">
                        <div class="w-8 h-4 rounded" style="background-color: ${p.color}"></div>
                    </td>
                    <td class="border border-gray-500 p-2">
                        <button class="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600" onclick="deleteProcess('${p.pid}')">Delete</button>
                    </td>
                `;
                tableBody.appendChild(row);
            });
        }
        
        function resetSimulator() {
            processList = [];
            ganttData = [];
            currentTime = 0;
            executionLog = [];
            
            document.getElementById('processId').value = "";
            document.getElementById('arrivalTime').value = "";
            document.getElementById('burstTime').value = "";
            document.getElementById('priority').value = "";
            
            updateProcessTable();
            document.getElementById('resultsSection').classList.add('hidden');
            
            showNotification("Simulator reset completed.", "info");
        }
        
        function generateRandomProcesses() {
            resetSimulator();
            
            const count = 5; // Number of random processes to generate
            const maxArrivalTime = 10;
            const maxBurstTime = 10;
            const maxPriority = 5;
            
            // List of vibrant colors for better visualization
            const colors = [
                "#3B82F6", "#EF4444", "#10B981", "#F59E0B", 
                "#6366F1", "#EC4899", "#8B5CF6", "#14B8A6",
                "#F97316", "#A855F7"
            ];
            
            for (let i = 0; i < count; i++) {
                const arrivalTime = Math.floor(Math.random() * maxArrivalTime);
                const burstTime = Math.floor(Math.random() * (maxBurstTime - 1)) + 1; // Ensure burst time is at least 1
                const priority = Math.floor(Math.random() * maxPriority) + 1; // Priority starts from 1
                const color = colors[i % colors.length];
                
                processList.push({
                    pid: `P${i+1}`,
                    arrivalTime: arrivalTime,
                    burstTime: burstTime,
                    priority: priority,
                    color: color,
                    remainingTime: burstTime,
                    completionTime: 0,
                    turnaroundTime: 0,
                    waitingTime: 0,
                    responseTime: -1
                });
            }
            
            updateProcessTable();
            showNotification(`Generated ${count} random processes.`, "success");
        }
        
        function runScheduler() {
            if (processList.length === 0) {
                showNotification("Please add at least one process.", "error");
                return;
            }
            
            // Reset previous execution data
            ganttData = [];
            currentTime = 0;
            executionLog = [];
            
            // Make a deep copy of processes to avoid modifying the original list
            const processes = JSON.parse(JSON.stringify(processList));
            
            // Reset metrics for new execution
            processes.forEach(p => {
                p.completionTime = 0;
                p.turnaroundTime = 0;
                p.waitingTime = 0;
                p.responseTime = -1;
                p.remainingTime = p.burstTime;
            });
            
            const algorithm = document.getElementById('algorithm').value;
            
            // Run the selected algorithm
            switch (algorithm) {
                case 'fcfs':
                    fcfs(processes);
                    break;
                case 'sjf':
                    sjf(processes);
                    break;
                case 'srtf':
                    srtf(processes);
                    break;
                case 'rr':
                    const quantum = parseInt(document.getElementById('timeQuantum').value) || 2;
                    roundRobin(processes, quantum);
                    break;
                case 'priority':
                    priorityScheduling(processes, false); // Non-preemptive
                    break;
                case 'priority_p':
                    priorityScheduling(processes, true); // Preemptive
                    break;
                case 'ljf':
                    ljf(processes);
                    break;
                case 'lrtf':
                    lrtf(processes);
                    break;
                case 'hrrn':
                    hrrn(processes);
                    break;
                default:
                    showNotification("Algorithm not implemented yet.", "error");
                    return;
            }
            
            // Calculate metrics and display results
            calculateMetrics(processes);
            displayResults(processes);
            showNotification(`${getAlgorithmFullName(algorithm)} simulation completed.`, "success");
        }
        
        /* Scheduling Algorithms */
        
        // First Come First Serve (FCFS)
        function fcfs(processes) {
            // Sort processes by arrival time
            processes.sort((a, b) => a.arrivalTime - b.arrivalTime);
            
            currentTime = 0;
            
            for (let i = 0; i < processes.length; i++) {
                const p = processes[i];
                
                // If process hasn't arrived yet, advance time
                if (currentTime < p.arrivalTime) {
                    addIdleTime(currentTime, p.arrivalTime);
                    currentTime = p.arrivalTime;
                }
                
                logExecution(`Time ${currentTime}: Process ${p.pid} starts execution`);
                
                // Set response time if not set yet
                if (p.responseTime === -1) {
                    p.responseTime = currentTime - p.arrivalTime;
                }
                
                // Add process to Gantt chart
                ganttData.push({
                    pid: p.pid,
                    start: currentTime,
                    end: currentTime + p.burstTime,
                    color: p.color
                });
                
                // Update times
                currentTime += p.burstTime;
                p.completionTime = currentTime;
                
                logExecution(`Time ${currentTime}: Process ${p.pid} completed`);
            }
        }
        
        // Shortest Job First (SJF) - Non-preemptive
        function sjf(processes) {
            // Sort processes by arrival time (initial sort)
            processes.sort((a, b) => a.arrivalTime - b.arrivalTime);
            
            currentTime = 0;
            let completed = 0;
            const n = processes.length;
            
            // Make a copy of processes to track which ones are completed
            const remainingProcesses = [...processes];
            
            while (completed < n) {
                // Find processes that have arrived by current time
                const availableProcesses = remainingProcesses.filter(p => p.arrivalTime <= currentTime);
                
                if (availableProcesses.length === 0) {
                    // No process available, advance time to next arrival
                    const nextArrival = Math.min(...remainingProcesses.map(p => p.arrivalTime));
                    addIdleTime(currentTime, nextArrival);
                    currentTime = nextArrival;
                    continue;
                }
                
                // Find process with shortest burst time
                availableProcesses.sort((a, b) => a.burstTime - b.burstTime);
                const shortestJob = availableProcesses[0];
                
                logExecution(`Time ${currentTime}: Process ${shortestJob.pid} starts execution`);
                
                // Set response time if not set yet
                if (shortestJob.responseTime === -1) {
                    shortestJob.responseTime = currentTime - shortestJob.arrivalTime;
                }
                
                // Add process to Gantt chart
                ganttData.push({
                    pid: shortestJob.pid,
                    start: currentTime,
                    end: currentTime + shortestJob.burstTime,
                    color: shortestJob.color
                });
                
                // Update times
                currentTime += shortestJob.burstTime;
                shortestJob.completionTime = currentTime;
                
                logExecution(`Time ${currentTime}: Process ${shortestJob.pid} completed`);
                
                // Remove the completed process from the remaining list
                const index = remainingProcesses.findIndex(p => p.pid === shortestJob.pid);
                remainingProcesses.splice(index, 1);
                
                completed++;
            }
        }
        
        // Shortest Remaining Time First (SRTF) - Preemptive version of SJF
        function srtf(processes) {
            // Sort processes by arrival time (initial sort)
            processes.sort((a, b) => a.arrivalTime - b.arrivalTime);
            
            currentTime = 0;
            let completed = 0;
            const n = processes.length;
            
            // Create a copy to track remaining times
            const remainingProcesses = JSON.parse(JSON.stringify(processes));
            
            // Track the currently running process
            let currentProcess = null;
            let startTime = 0;
            
            while (completed < n) {
                // Find processes that have arrived by current time
                const availableProcesses = remainingProcesses.filter(p => 
                    p.arrivalTime <= currentTime && p.remainingTime > 0
                );
                
                if (availableProcesses.length === 0) {
                    // No process available, advance time to next arrival
                    const uncompletedProcesses = remainingProcesses.filter(p => p.remainingTime > 0);
                    if (uncompletedProcesses.length === 0) break;
                    
                    const nextArrival = Math.min(...uncompletedProcesses.map(p => p.arrivalTime));
                    if (nextArrival > currentTime) {
                        addIdleTime(currentTime, nextArrival);
                        currentTime = nextArrival;
                    } else {
                        currentTime++;
                    }
                    continue;
                }
                
                // Find process with shortest remaining time
                availableProcesses.sort((a, b) => a.remainingTime - b.remainingTime);
                const nextProcess = availableProcesses[0];
                
                // Check if we're switching processes
                if (currentProcess === null || currentProcess.pid !== nextProcess.pid) {
                    // If there was a previous process, add it to Gantt chart
                    if (currentProcess !== null && startTime < currentTime) {
                        ganttData.push({
                            pid: currentProcess.pid,
                            start: startTime,
                            end: currentTime,
                            color: currentProcess.color
                        });
                        
                        logExecution(`Time ${currentTime}: Process ${currentProcess.pid} preempted`);
                    }
                    
                    // Start new process
                    startTime = currentTime;
                    currentProcess = nextProcess;
                    
                    // Set response time if not set yet
                    const originalProcess = processes.find(p => p.pid === nextProcess.pid);
                    if (originalProcess.responseTime === -1) {
                        originalProcess.responseTime = currentTime - originalProcess.arrivalTime;
                    }
                    
                    logExecution(`Time ${currentTime}: Process ${nextProcess.pid} starts/resumes execution`);
                }
                
                // Execute for 1 time unit
                currentTime++;
                nextProcess.remainingTime--;
                
                // Check if the process is completed
                if (nextProcess.remainingTime === 0) {
                    // Add to Gantt chart
                    ganttData.push({
                        pid: nextProcess.pid,
                        start: startTime,
                        end: currentTime,
                        color: nextProcess.color
                    });
                    
                    // Update completion time in the original processes array
                    const originalProcess = processes.find(p => p.pid === nextProcess.pid);
                    originalProcess.completionTime = currentTime;
                    
                    logExecution(`Time ${currentTime}: Process ${nextProcess.pid} completed`);
                    
                    completed++;
                    currentProcess = null;
                }
            }
        }
        
        // Round Robin (RR)
        function roundRobin(processes, timeQuantum) {
            // Sort processes by arrival time
            processes.sort((a, b) => a.arrivalTime - b.arrivalTime);
            
            currentTime = 0;
            let completed = 0;
            const n = processes.length;
            
            // Create a copy to track remaining times
            const remainingProcesses = JSON.parse(JSON.stringify(processes));
            
            // Ready queue
            let readyQueue = [];
            let index = 0;
            
            while (completed < n) {
                // Add newly arrived processes to the ready queue
                while (index < n && processes[index].arrivalTime <= currentTime) {
                    readyQueue.push(remainingProcesses[index]);
                    index++;
                }
                
                if (readyQueue.length === 0) {
                    // No process in ready queue, advance time
                    if (index < n) {
                        addIdleTime(currentTime, processes[index].arrivalTime);
                        currentTime = processes[index].arrivalTime;
                    } else {
                        break;
                    }
                    continue;
                }
                
                // Get the next process from ready queue
                const process = readyQueue.shift();
                
                // Set response time if not set yet
                const originalProcess = processes.find(p => p.pid === process.pid);
                if (originalProcess.responseTime === -1) {
                    originalProcess.responseTime = currentTime - originalProcess.arrivalTime;
                }
                
                const executeTime = Math.min(timeQuantum, process.remainingTime);
                
                logExecution(`Time ${currentTime}: Process ${process.pid} starts/resumes execution`);
                
                // Add to Gantt chart
                ganttData.push({
                    pid: process.pid,
                    start: currentTime,
                    end: currentTime + executeTime,
                    color: process.color
                });
                
                // Update times
                currentTime += executeTime;
                process.remainingTime -= executeTime;
                
                // Add newly arrived processes during this time quantum
                while (index < n && processes[index].arrivalTime <= currentTime) {
                    readyQueue.push(remainingProcesses[index]);
                    index++;
                }
                
                // Check if process is completed
                if (process.remainingTime === 0) {
                    logExecution(`Time ${currentTime}: Process ${process.pid} completed`);
                    originalProcess.completionTime = currentTime;
                    completed++;
                } else {
                    logExecution(`Time ${currentTime}: Process ${process.pid} preempted, remaining: ${process.remainingTime}`);
                    readyQueue.push(process);
                }
            }
        }
        
        // Priority Scheduling (both preemptive and non-preemptive)
        function priorityScheduling(processes, isPreemptive) {
            // Sort processes by arrival time (initial sort)
            processes.sort((a, b) => a.arrivalTime - b.arrivalTime);
            
            currentTime = 0;
            let completed = 0;
            const n = processes.length;
            
            // Create a copy to track remaining times
            const remainingProcesses = JSON.parse(JSON.stringify(processes));
            
            // Track the currently running process (for preemptive)
            let currentProcess = null;
            let startTime = 0;
            
            while (completed < n) {
                // Find processes that have arrived by current time
                const availableProcesses = remainingProcesses.filter(p => 
                    p.arrivalTime <= currentTime && p.remainingTime > 0
                );
                
                if (availableProcesses.length === 0) {
                    // No process available, advance time to next arrival
                    const uncompletedProcesses = remainingProcesses.filter(p => p.remainingTime > 0);
                    if (uncompletedProcesses.length === 0) break;
                    
                    const nextArrival = Math.min(...uncompletedProcesses.map(p => p.arrivalTime));
                    addIdleTime(currentTime, nextArrival);
                    currentTime = nextArrival;
                    continue;
                }
                
                // Sort by priority (lower number = higher priority)
                availableProcesses.sort((a, b) => a.priority - b.priority);
                const highestPriorityProcess = availableProcesses[0];
                
                if (!isPreemptive) {
                    // Non-preemptive: once a process starts, it runs to completion
                    logExecution(`Time ${currentTime}: Process ${highestPriorityProcess.pid} starts execution`);
                    
                    // Set response time if not set yet
                    const originalProcess = processes.find(p => p.pid === highestPriorityProcess.pid);
                    if (originalProcess.responseTime === -1) {
                        originalProcess.responseTime = currentTime - originalProcess.arrivalTime;
                    }
                    
                    // Add to Gantt chart
                    ganttData.push({
                        pid: highestPriorityProcess.pid,
                        start: currentTime,
                        end: currentTime + highestPriorityProcess.remainingTime,
                        color: highestPriorityProcess.color
                    });
                    
                    // Update times
                    currentTime += highestPriorityProcess.remainingTime;
                    highestPriorityProcess.remainingTime = 0;
                    
                    // Update completion time in original array
                    originalProcess.completionTime = currentTime;
                    
                    logExecution(`Time ${currentTime}: Process ${highestPriorityProcess.pid} completed`);
                    
                    completed++;
                } else {
                    // Preemptive: check if we need to switch processes
                    if (currentProcess === null || currentProcess.pid !== highestPriorityProcess.pid) {
                        // If there was a previous process, add it to Gantt chart
                        if (currentProcess !== null && startTime < currentTime) {
                            ganttData.push({
                                pid: currentProcess.pid,
                                start: startTime,
                                end: currentTime,
                                color: currentProcess.color
                            });
                            
                            logExecution(`Time ${currentTime}: Process ${currentProcess.pid} preempted`);
                        }
                        
                        // Start new process
                        startTime = currentTime;
                        currentProcess = highestPriorityProcess;
                        
                        // Set response time if not set yet
                        const originalProcess = processes.find(p => p.pid === highestPriorityProcess.pid);
                        if (originalProcess.responseTime === -1) {
                            originalProcess.responseTime = currentTime - originalProcess.arrivalTime;
                        }
                        logExecution(`Time ${currentTime}: Process ${highestPriorityProcess.pid} starts/resumes execution`);
                    }
                    
                    // Execute for 1 time unit
                    currentTime++;
                    highestPriorityProcess.remainingTime--;
                    
                    // Check if the process is completed
                    if (highestPriorityProcess.remainingTime === 0) {
                        // Add to Gantt chart
                        ganttData.push({
                            pid: currentProcess.pid,
                            start: startTime,
                            end: currentTime,
                            color: currentProcess.color
                        });
                        
                        // Update completion time in the original processes array
                        const originalProcess = processes.find(p => p.pid === highestPriorityProcess.pid);
                        originalProcess.completionTime = currentTime;
                        
                        logExecution(`Time ${currentTime}: Process ${highestPriorityProcess.pid} completed`);
                        
                        completed++;
                        currentProcess = null;
                    }
                }
            }
        }
        
        // Longest Job First (LJF) - Non-preemptive
        function ljf(processes) {
            // Sort processes by arrival time (initial sort)
            processes.sort((a, b) => a.arrivalTime - b.arrivalTime);
            
            currentTime = 0;
            let completed = 0;
            const n = processes.length;
            
            // Make a copy of processes to track which ones are completed
            const remainingProcesses = [...processes];
            
            while (completed < n) {
                // Find processes that have arrived by current time
                const availableProcesses = remainingProcesses.filter(p => p.arrivalTime <= currentTime);
                
                if (availableProcesses.length === 0) {
                    // No process available, advance time to next arrival
                    const nextArrival = Math.min(...remainingProcesses.map(p => p.arrivalTime));
                    addIdleTime(currentTime, nextArrival);
                    currentTime = nextArrival;
                    continue;
                }
                
                // Find process with longest burst time
                availableProcesses.sort((a, b) => b.burstTime - a.burstTime);
                const longestJob = availableProcesses[0];
                
                logExecution(`Time ${currentTime}: Process ${longestJob.pid} starts execution`);
                
                // Set response time if not set yet
                if (longestJob.responseTime === -1) {
                    longestJob.responseTime = currentTime - longestJob.arrivalTime;
                }
                
                // Add process to Gantt chart
                ganttData.push({
                    pid: longestJob.pid,
                    start: currentTime,
                    end: currentTime + longestJob.burstTime,
                    color: longestJob.color
                });
                
                // Update times
                currentTime += longestJob.burstTime;
                longestJob.completionTime = currentTime;
                
                logExecution(`Time ${currentTime}: Process ${longestJob.pid} completed`);
                
                // Remove the completed process from the remaining list
                const index = remainingProcesses.findIndex(p => p.pid === longestJob.pid);
                remainingProcesses.splice(index, 1);
                
                completed++;
            }
        }
        
        // Longest Remaining Time First (LRTF) - Preemptive version of LJF
        function lrtf(processes) {
            // Sort processes by arrival time (initial sort)
            processes.sort((a, b) => a.arrivalTime - b.arrivalTime);
            
            currentTime = 0;
            let completed = 0;
            const n = processes.length;
            
            // Create a copy to track remaining times
            const remainingProcesses = JSON.parse(JSON.stringify(processes));
            
            // Track the currently running process
            let currentProcess = null;
            let startTime = 0;
            
            while (completed < n) {
                // Find processes that have arrived by current time
                const availableProcesses = remainingProcesses.filter(p => 
                    p.arrivalTime <= currentTime && p.remainingTime > 0
                );
                
                if (availableProcesses.length === 0) {
                    // No process available, advance time to next arrival
                    const uncompletedProcesses = remainingProcesses.filter(p => p.remainingTime > 0);
                    if (uncompletedProcesses.length === 0) break;
                    
                    const nextArrival = Math.min(...uncompletedProcesses.map(p => p.arrivalTime));
                    if (nextArrival > currentTime) {
                        addIdleTime(currentTime, nextArrival);
                        currentTime = nextArrival;
                    } else {
                        currentTime++;
                    }
                    continue;
                }
                
                // Find process with longest remaining time
                availableProcesses.sort((a, b) => b.remainingTime - a.remainingTime);
                const nextProcess = availableProcesses[0];
                
                // Check if we're switching processes
                if (currentProcess === null || currentProcess.pid !== nextProcess.pid) {
                    // If there was a previous process, add it to Gantt chart
                    if (currentProcess !== null && startTime < currentTime) {
                        ganttData.push({
                            pid: currentProcess.pid,
                            start: startTime,
                            end: currentTime,
                            color: currentProcess.color
                        });
                        
                        logExecution(`Time ${currentTime}: Process ${currentProcess.pid} preempted`);
                    }
                    
                    // Start new process
                    startTime = currentTime;
                    currentProcess = nextProcess;
                    
                    // Set response time if not set yet
                    const originalProcess = processes.find(p => p.pid === nextProcess.pid);
                    if (originalProcess.responseTime === -1) {
                        originalProcess.responseTime = currentTime - originalProcess.arrivalTime;
                    }
                    
                    logExecution(`Time ${currentTime}: Process ${nextProcess.pid} starts/resumes execution`);
                }
                
                // Execute for 1 time unit
                currentTime++;
                nextProcess.remainingTime--;
                
                // Check if the process is completed
                if (nextProcess.remainingTime === 0) {
                    // Add to Gantt chart
                    ganttData.push({
                        pid: nextProcess.pid,
                        start: startTime,
                        end: currentTime,
                        color: nextProcess.color
                    });
                    
                    // Update completion time in the original processes array
                    const originalProcess = processes.find(p => p.pid === nextProcess.pid);
                    originalProcess.completionTime = currentTime;
                    
                    logExecution(`Time ${currentTime}: Process ${nextProcess.pid} completed`);
                    
                    completed++;
                    currentProcess = null;
                }
            }
        }
        
        // Highest Response Ratio Next (HRRN)
        function hrrn(processes) {
            // Sort processes by arrival time (initial sort)
            processes.sort((a, b) => a.arrivalTime - b.arrivalTime);
            
            currentTime = 0;
            let completed = 0;
            const n = processes.length;
            
            // Make a copy of processes to track which ones are completed
            const remainingProcesses = [...processes];
            
            while (completed < n) {
                // Find processes that have arrived by current time
                const availableProcesses = remainingProcesses.filter(p => p.arrivalTime <= currentTime);
                
                if (availableProcesses.length === 0) {
                    // No process available, advance time to next arrival
                    const nextArrival = Math.min(...remainingProcesses.map(p => p.arrivalTime));
                    addIdleTime(currentTime, nextArrival);
                    currentTime = nextArrival;
                    continue;
                }
                
                // Calculate Response Ratio for each available process
                availableProcesses.forEach(p => {
                    const waitingTime = currentTime - p.arrivalTime;
                    p.responseRatio = (waitingTime + p.burstTime) / p.burstTime;
                });
                
                // Find process with highest response ratio
                availableProcesses.sort((a, b) => b.responseRatio - a.responseRatio);
                const nextProcess = availableProcesses[0];
                
                logExecution(`Time ${currentTime}: Process ${nextProcess.pid} starts execution (Response Ratio: ${nextProcess.responseRatio.toFixed(2)})`);
                
                // Set response time if not set yet
                if (nextProcess.responseTime === -1) {
                    nextProcess.responseTime = currentTime - nextProcess.arrivalTime;
                }
                
                // Add process to Gantt chart
                ganttData.push({
                    pid: nextProcess.pid,
                    start: currentTime,
                    end: currentTime + nextProcess.burstTime,
                    color: nextProcess.color
                });
                
                // Update times
                currentTime += nextProcess.burstTime;
                nextProcess.completionTime = currentTime;
                
                logExecution(`Time ${currentTime}: Process ${nextProcess.pid} completed`);
                
                // Remove the completed process from the remaining list
                const index = remainingProcesses.findIndex(p => p.pid === nextProcess.pid);
                remainingProcesses.splice(index, 1);
                
                completed++;
            }
        }
        
        /* Helper Functions */
        
        function addIdleTime(start, end) {
            if (start < end) {
                ganttData.push({
                    pid: "Idle",
                    start: start,
                    end: end,
                    color: "#CBD5E0" // Gray color for idle time
                });
                logExecution(`Time ${start} to ${end}: CPU idle`);
            }
        }
        
        function logExecution(message) {
            executionLog.push(message);
        }
        
        function calculateMetrics(processes) {
            // Calculate turnaround, waiting, and response times for each process
            processes.forEach(p => {
                p.turnaroundTime = p.completionTime - p.arrivalTime;
                p.waitingTime = p.turnaroundTime - p.burstTime;
            });
            
            // Update the original process list with calculated metrics
            processes.forEach(p => {
                const original = processList.find(op => op.pid === p.pid);
                if (original) {
                    original.completionTime = p.completionTime;
                    original.turnaroundTime = p.turnaroundTime;
                    original.waitingTime = p.waitingTime;
                    original.responseTime = p.responseTime;
                }
            });
        }
        
        function displayResults(processes) {
            // Show results section
            document.getElementById('resultsSection').classList.remove('hidden');
            
            // Display Gantt chart
            displayGanttChart();
            
            // Display execution steps if enabled
            const showSteps = document.getElementById('showSteps').checked;
            document.getElementById('executionStepsContainer').classList.toggle('hidden', !showSteps);
            if (showSteps) {
                displayExecutionSteps();
            }
            
            // Display results table
            displayResultTable(processes);
            
            // Display average metrics
            displayAverageMetrics(processes);
            
            // Display CPU utilization
            displayCPUUtilization();
        }
        
        function displayGanttChart() {
            const ganttChart = document.getElementById('ganttChart');
            const ganttTimeline = document.getElementById('ganttTimeline');
            
            if (ganttData.length === 0) {
                ganttChart.innerHTML = "<p class='text-center'>No data to display</p>";
                return;
            }
            
            // Sort Gantt data by start time
            ganttData.sort((a, b) => a.start - b.start);
            
            // Calculate the total time span and width for each unit
            const totalTime = ganttData[ganttData.length - 1].end;
            
            // Create Gantt chart content
            let ganttHTML = '<div class="flex flex-row items-stretch h-12 ml-10">';
            let timelineHTML = '<div class="flex flex-row">';
            
            ganttData.forEach((item, index) => {
                const duration = item.end - item.start;
                const width = `${duration * 50}px`; // 50px per time unit for better visibility
                
                ganttHTML += `
                    <div style="width: ${width}; background-color: ${item.pid === 'Idle' ? item.color : item.color};" 
                         class="flex items-center justify-center border-r border-gray-700 text-sm relative group">
                        <span class="${item.pid === 'Idle' ? 'text-gray-800' : 'text-white'} font-semibold">
                            ${item.pid}
                        </span>
                        <div class="hidden group-hover:block absolute bottom-full mb-1 bg-gray-900 text-white text-xs p-1 rounded">
                            ${item.pid}: ${item.start} - ${item.end} (${duration})
                        </div>
                    </div>
                `;
                
                // Only add time markers at the start of each segment
                timelineHTML += `
                    <div style="width: ${width};" class="text-center border-r border-gray-600 text-xs">
                        ${item.start}
                    </div>
                `;
                
                // Add the final time marker at the end of the last segment
                if (index === ganttData.length - 1) {
                    timelineHTML += `<span class="text-xs">${item.end}</span>`;
                }
            });
            
            ganttHTML += '</div>';
            timelineHTML += '</div>';
            
            ganttChart.innerHTML = ganttHTML;
            ganttTimeline.innerHTML = timelineHTML;
        }
        
        function displayExecutionSteps() {
            const executionStepsDiv = document.getElementById('executionSteps');
            if (executionLog.length === 0) {
                executionStepsDiv.innerHTML = "<p>No execution steps to display</p>";
                return;
            }
            
            let stepsHTML = '<ol class="list-decimal pl-5 space-y-1">';
            
            executionLog.forEach(step => {
                stepsHTML += `<li>${step}</li>`;
            });
            
            stepsHTML += '</ol>';
            executionStepsDiv.innerHTML = stepsHTML;
        }
        
        function displayResultTable(processes) {
            const resultTable = document.getElementById('resultTable');
            resultTable.innerHTML = '';
            
            // Sort processes by PID for consistent display
            const sortedProcesses = [...processes].sort((a, b) => 
                a.pid.localeCompare(b.pid, undefined, { numeric: true })
            );
            
            sortedProcesses.forEach(p => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td class="border border-gray-500 p-2">
                        <div class="flex items-center">
                            <div class="w-3 h-3 rounded-full mr-2" style="background-color: ${p.color}"></div>
                            ${p.pid}
                        </div>
                    </td>
                    <td class="border border-gray-500 p-2">${p.arrivalTime}</td>
                    <td class="border border-gray-500 p-2">${p.burstTime}</td>
                    <td class="border border-gray-500 p-2">${p.completionTime}</td>
                    <td class="border border-gray-500 p-2">${p.turnaroundTime}</td>
                    <td class="border border-gray-500 p-2">${p.waitingTime}</td>
                    <td class="border border-gray-500 p-2">${p.responseTime}</td>
                `;
                resultTable.appendChild(row);
            });
        }
        
        function displayAverageMetrics(processes) {
            const avgMetricsDiv = document.getElementById('averageMetrics');
            
            // Calculate average metrics
            const avgTurnaroundTime = processes.reduce((sum, p) => sum + p.turnaroundTime, 0) / processes.length;
            const avgWaitingTime = processes.reduce((sum, p) => sum + p.waitingTime, 0) / processes.length;
            const avgResponseTime = processes.reduce((sum, p) => sum + p.responseTime, 0) / processes.length;
            
            // Find max completion time
            const maxCompletionTime = Math.max(...processes.map(p => p.completionTime));
            const minArrivalTime = Math.min(...processes.map(p => p.arrivalTime));
            const throughput = processes.length / (maxCompletionTime - minArrivalTime || 1);
            
            avgMetricsDiv.innerHTML = `
                <div class="grid grid-cols-1 gap-2">
                    <div class="flex justify-between">
                        <span>Average Turnaround Time:</span>
                        <span class="font-semibold">${avgTurnaroundTime.toFixed(2)} time units</span>
                    </div>
                    <div class="flex justify-between">
                        <span>Average Waiting Time:</span>
                        <span class="font-semibold">${avgWaitingTime.toFixed(2)} time units</span>
                    </div>
                    <div class="flex justify-between">
                        <span>Average Response Time:</span>
                        <span class="font-semibold">${avgResponseTime.toFixed(2)} time units</span>
                    </div>
                    <div class="flex justify-between">
                        <span>Throughput:</span>
                        <span class="font-semibold">${throughput.toFixed(4)} processes/time unit</span>
                    </div>
                </div>
            `;
        }
        
        function displayCPUUtilization() {
            const cpuUtilDiv = document.getElementById('cpuUtilization');
            
            // Calculate total execution time and idle time
            let totalTime = 0;
            let idleTime = 0;
            
            if (ganttData.length > 0) {
                totalTime = ganttData[ganttData.length - 1].end - ganttData[0].start;
                ganttData.forEach(item => {
                    if (item.pid === 'Idle') {
                        idleTime += (item.end - item.start);
                    }
                });
            }
            
            const cpuUtil = totalTime > 0 ? ((totalTime - idleTime) / totalTime) * 100 : 0;
            
            // Utilization level classification
            let utilizationClass = "text-green-500";
            if (cpuUtil < 60) utilizationClass = "text-red-500";
            else if (cpuUtil < 80) utilizationClass = "text-yellow-500";
            
            cpuUtilDiv.innerHTML = `
                <div class="grid grid-cols-1 gap-2">
                    <div class="flex justify-between">
                        <span>CPU Utilization:</span>
                        <span class="font-semibold ${utilizationClass}">${cpuUtil.toFixed(2)}%</span>
                    </div>
                    <div class="flex justify-between">
                        <span>Total Time:</span>
                        <span class="font-semibold">${totalTime} time units</span>
                    </div>
                    <div class="flex justify-between">
                        <span>Idle Time:</span>
                        <span class="font-semibold">${idleTime} time units</span>
                    </div>
                    <div class="w-full bg-gray-500 rounded-full h-2.5 mt-2">
                        <div class="bg-blue-500 h-2.5 rounded-full" style="width: ${cpuUtil}%"></div>
                    </div>
                </div>
            `;
        }
        
        function getAlgorithmFullName(algorithmCode) {
            const algorithms = {
                'fcfs': 'First Come First Serve (FCFS)',
                'sjf': 'Shortest Job First (SJF) - Non-preemptive',
                'srtf': 'Shortest Remaining Time First (SRTF) - Preemptive',
                'rr': 'Round Robin (RR)',
                'priority': 'Priority Scheduling - Non-preemptive',
                'priority_p': 'Priority Scheduling - Preemptive'
                
            };
            
            return algorithms[algorithmCode] || algorithmCode;
        }
        
        // Display notification
        function showNotification(message, type = 'info') {
            // You could implement a proper notification system here
            // For simplicity, we'll just use alert for now
            alert(message);
        }
        
        // Show/hide time quantum input when algorithm changes
        document.addEventListener('DOMContentLoaded', function() {
            document.getElementById('algorithm').addEventListener('change', function() {
                const algorithmValue = this.value;
                document.getElementById('quantumInput').classList.toggle('hidden', algorithmValue !== 'rr');
            });
        });
