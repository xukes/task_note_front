// Task Manager Application
class TaskManager {
    constructor() {
        this.tasks = this.loadTasks();
        this.currentFilter = 'all';
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.renderTasks();
    }

    setupEventListeners() {
        // Form submission
        document.getElementById('addTaskForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addTask();
        });

        // Filter buttons
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.setFilter(e.target.dataset.filter);
            });
        });
    }

    addTask() {
        const title = document.getElementById('taskTitle').value.trim();
        const intro = document.getElementById('taskIntro').value.trim();
        const status = document.getElementById('taskStatus').value;
        const notes = document.getElementById('taskNotes').value.trim();

        if (!title || !intro) {
            alert('请填写任务标题和介绍！');
            return;
        }

        const task = {
            id: Date.now(),
            title: title,
            intro: intro,
            status: status,
            notes: notes,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        this.tasks.unshift(task);
        this.saveTasks();
        this.renderTasks();
        this.clearForm();
    }

    editTask(id) {
        const task = this.tasks.find(t => t.id === id);
        if (!task) return;

        document.getElementById('taskTitle').value = task.title;
        document.getElementById('taskIntro').value = task.intro;
        document.getElementById('taskStatus').value = task.status;
        document.getElementById('taskNotes').value = task.notes;

        this.deleteTask(id);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    deleteTask(id) {
        if (confirm('确定要删除这个任务吗？')) {
            this.tasks = this.tasks.filter(t => t.id !== id);
            this.saveTasks();
            this.renderTasks();
        }
    }

    updateTaskStatus(id, newStatus) {
        const task = this.tasks.find(t => t.id === id);
        if (task) {
            task.status = newStatus;
            task.updatedAt = new Date().toISOString();
            this.saveTasks();
            this.renderTasks();
        }
    }

    setFilter(filter) {
        this.currentFilter = filter;
        
        // Update active button
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.filter === filter) {
                btn.classList.add('active');
            }
        });

        this.renderTasks();
    }

    getFilteredTasks() {
        if (this.currentFilter === 'all') {
            return this.tasks;
        }
        return this.tasks.filter(task => task.status === this.currentFilter);
    }

    renderTasks() {
        const tasksList = document.getElementById('tasksList');
        const filteredTasks = this.getFilteredTasks();

        if (filteredTasks.length === 0) {
            tasksList.innerHTML = `
                <div class="empty-state">
                    <p>📝 暂无任务</p>
                    <p style="margin-top: 10px; font-size: 0.9em;">添加您的第一个任务开始管理吧！</p>
                </div>
            `;
            return;
        }

        tasksList.innerHTML = filteredTasks.map(task => this.createTaskCard(task)).join('');

        // Add event listeners for action buttons
        filteredTasks.forEach(task => {
            // Edit button
            const editBtn = document.querySelector(`[data-edit-id="${task.id}"]`);
            if (editBtn) {
                editBtn.addEventListener('click', () => this.editTask(task.id));
            }

            // Delete button
            const deleteBtn = document.querySelector(`[data-delete-id="${task.id}"]`);
            if (deleteBtn) {
                deleteBtn.addEventListener('click', () => this.deleteTask(task.id));
            }

            // Status select
            const statusSelect = document.querySelector(`[data-status-id="${task.id}"]`);
            if (statusSelect) {
                statusSelect.addEventListener('change', (e) => {
                    this.updateTaskStatus(task.id, e.target.value);
                });
            }
        });
    }

    createTaskCard(task) {
        const date = new Date(task.createdAt);
        const formattedDate = date.toLocaleDateString('zh-CN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        return `
            <div class="task-card">
                <div class="task-header">
                    <h3 class="task-title">${this.escapeHtml(task.title)}</h3>
                    <span class="task-status status-${task.status}">${task.status}</span>
                </div>
                
                <div class="task-meta">
                    创建时间：${formattedDate}
                </div>

                <div class="task-section">
                    <h4>📖 任务介绍</h4>
                    <div class="task-intro">${this.escapeHtml(task.intro).replace(/\n/g, '<br>')}</div>
                </div>

                <div class="task-section">
                    <h4>📊 实现情况</h4>
                    <select class="form-group select" data-status-id="${task.id}">
                        <option value="未开始" ${task.status === '未开始' ? 'selected' : ''}>未开始</option>
                        <option value="进行中" ${task.status === '进行中' ? 'selected' : ''}>进行中</option>
                        <option value="已完成" ${task.status === '已完成' ? 'selected' : ''}>已完成</option>
                        <option value="已延期" ${task.status === '已延期' ? 'selected' : ''}>已延期</option>
                    </select>
                </div>

                ${task.notes ? `
                    <div class="task-section">
                        <h4>📝 附加笔记</h4>
                        <div class="task-notes">${this.escapeHtml(task.notes).replace(/\n/g, '<br>')}</div>
                    </div>
                ` : ''}

                <div class="task-actions">
                    <button class="btn btn-secondary" data-edit-id="${task.id}">编辑</button>
                    <button class="btn btn-danger" data-delete-id="${task.id}">删除</button>
                </div>
            </div>
        `;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    clearForm() {
        document.getElementById('addTaskForm').reset();
    }

    saveTasks() {
        localStorage.setItem('tasks', JSON.stringify(this.tasks));
    }

    loadTasks() {
        const stored = localStorage.getItem('tasks');
        return stored ? JSON.parse(stored) : [];
    }
}

// Initialize the application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new TaskManager();
});
