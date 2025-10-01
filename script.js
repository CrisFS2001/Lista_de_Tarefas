// ========== ELEMENTOS DOM ==========
const taskInput = document.getElementById('taskInput');
const addTaskBtn = document.getElementById('addTaskBtn');
const taskList = document.getElementById('taskList');
const searchInput = document.getElementById('searchInput');
const filterButtons = document.querySelectorAll('.filter-btn');
const themeToggle = document.getElementById('themeToggle');
const clearCompletedBtn = document.getElementById('clearCompletedBtn');
const emptyState = document.getElementById('emptyState');

// Elementos de estatísticas
const totalTasksEl = document.getElementById('totalTasks');
const completedTasksEl = document.getElementById('completedTasks');
const pendingTasksEl = document.getElementById('pendingTasks');

// ========== VARIÁVEIS DE ESTADO ==========
let tasks = [];
let currentFilter = 'all';
let currentSearchTerm = '';

// ========== INICIALIZAÇÃO ==========
document.addEventListener('DOMContentLoaded', () => {
    loadTasks();
    loadTheme();
    renderTasks();
    updateStats();
    updateEmptyState();
});

// ========== EVENTOS ==========
addTaskBtn.addEventListener('click', addTask);

taskInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        addTask();
    }
});

searchInput.addEventListener('input', (e) => {
    currentSearchTerm = e.target.value.toLowerCase();
    renderTasks();
});

filterButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        filterButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentFilter = btn.dataset.filter;
        renderTasks();
    });
});

themeToggle.addEventListener('click', toggleTheme);

clearCompletedBtn.addEventListener('click', clearCompletedTasks);

// ========== FUNÇÕES PRINCIPAIS ==========
function addTask() {
    const text = taskInput.value.trim();

    if (text === '') {
        shakeElement(taskInput);
        return;
    }

    const task = {
        id: Date.now(),
        text: text,
        completed: false,
        createdAt: new Date().toISOString()
    };

    tasks.unshift(task);
    saveTasks();
    renderTasks();
    updateStats();
    updateEmptyState();

    taskInput.value = '';
    taskInput.focus();

    showNotification('Tarefa adicionada com sucesso!', 'success');
}

function toggleTask(id) {
    const task = tasks.find(t => t.id === id);
    if (task) {
        task.completed = !task.completed;
        saveTasks();
        renderTasks();
        updateStats();

        const message = task.completed ? 'Tarefa concluída!' : 'Tarefa reativada!';
        showNotification(message, task.completed ? 'success' : 'info');
    }
}

function deleteTask(id) {
    if (confirm('Tem certeza que deseja excluir esta tarefa?')) {
        tasks = tasks.filter(t => t.id !== id);
        saveTasks();
        renderTasks();
        updateStats();
        updateEmptyState();
        showNotification('Tarefa excluída!', 'danger');
    }
}

function editTask(id) {
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    const newText = prompt('Editar tarefa:', task.text);

    if (newText !== null && newText.trim() !== '') {
        task.text = newText.trim();
        saveTasks();
        renderTasks();
        showNotification('Tarefa atualizada!', 'info');
    }
}

function clearCompletedTasks() {
    const completedCount = tasks.filter(t => t.completed).length;

    if (completedCount === 0) {
        showNotification('Não há tarefas concluídas para limpar!', 'info');
        return;
    }

    if (confirm(`Deseja excluir ${completedCount} tarefa(s) concluída(s)?`)) {
        tasks = tasks.filter(t => !t.completed);
        saveTasks();
        renderTasks();
        updateStats();
        updateEmptyState();
        showNotification(`${completedCount} tarefa(s) excluída(s)!`, 'success');
    }
}

// ========== RENDERIZAÇÃO ==========
function renderTasks() {
    const filteredTasks = getFilteredTasks();

    taskList.innerHTML = '';

    filteredTasks.forEach(task => {
        const li = createTaskElement(task);
        taskList.appendChild(li);
    });

    updateEmptyState();
}

function createTaskElement(task) {
    const li = document.createElement('li');
    li.className = `task-item ${task.completed ? 'completed' : ''}`;
    li.dataset.id = task.id;

    const checkbox = document.createElement('div');
    checkbox.className = 'task-checkbox';
    checkbox.innerHTML = '<i class="fas fa-check"></i>';
    checkbox.addEventListener('click', () => toggleTask(task.id));

    const content = document.createElement('div');
    content.className = 'task-content';

    const textEl = document.createElement('div');
    textEl.className = 'task-text';
    textEl.textContent = task.text;

    const timeEl = document.createElement('div');
    timeEl.className = 'task-time';
    timeEl.innerHTML = `<i class="far fa-clock"></i> ${formatDate(task.createdAt)}`;

    content.appendChild(textEl);
    content.appendChild(timeEl);

    const actions = document.createElement('div');
    actions.className = 'task-actions';

    const editBtn = document.createElement('button');
    editBtn.className = 'task-btn edit-btn';
    editBtn.innerHTML = '<i class="fas fa-edit"></i>';
    editBtn.title = 'Editar tarefa';
    editBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        editTask(task.id);
    });

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'task-btn delete-btn';
    deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
    deleteBtn.title = 'Excluir tarefa';
    deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        deleteTask(task.id);
    });

    actions.appendChild(editBtn);
    actions.appendChild(deleteBtn);

    li.appendChild(checkbox);
    li.appendChild(content);
    li.appendChild(actions);

    return li;
}

// ========== FILTROS E BUSCA ==========
function getFilteredTasks() {
    let filtered = tasks;

    // Filtro por status
    if (currentFilter === 'completed') {
        filtered = filtered.filter(t => t.completed);
    } else if (currentFilter === 'pending') {
        filtered = filtered.filter(t => !t.completed);
    }

    // Busca por texto
    if (currentSearchTerm) {
        filtered = filtered.filter(t =>
            t.text.toLowerCase().includes(currentSearchTerm)
        );
    }

    return filtered;
}

// ========== ESTATÍSTICAS ==========
function updateStats() {
    const total = tasks.length;
    const completed = tasks.filter(t => t.completed).length;
    const pending = total - completed;

    animateNumber(totalTasksEl, total);
    animateNumber(completedTasksEl, completed);
    animateNumber(pendingTasksEl, pending);

    // Atualizar botão de limpar concluídas
    clearCompletedBtn.disabled = completed === 0;
}

function animateNumber(element, targetValue) {
    const currentValue = parseInt(element.textContent) || 0;
    const duration = 300;
    const steps = 20;
    const increment = (targetValue - currentValue) / steps;
    let current = currentValue;
    let step = 0;

    const timer = setInterval(() => {
        step++;
        current += increment;
        element.textContent = Math.round(current);

        if (step >= steps) {
            element.textContent = targetValue;
            clearInterval(timer);
        }
    }, duration / steps);
}

// ========== ESTADO VAZIO ==========
function updateEmptyState() {
    const hasFilteredTasks = getFilteredTasks().length > 0;

    if (hasFilteredTasks) {
        emptyState.classList.remove('show');
    } else {
        emptyState.classList.add('show');

        // Atualizar mensagem baseada no filtro
        const h3 = emptyState.querySelector('h3');
        const p = emptyState.querySelector('p');

        if (currentSearchTerm) {
            h3.textContent = 'Nenhuma tarefa encontrada';
            p.textContent = 'Tente buscar por outro termo';
        } else if (currentFilter === 'completed') {
            h3.textContent = 'Nenhuma tarefa concluída';
            p.textContent = 'Complete suas tarefas para vê-las aqui!';
        } else if (currentFilter === 'pending') {
            h3.textContent = 'Nenhuma tarefa pendente';
            p.textContent = 'Parabéns! Você está em dia!';
        } else {
            h3.textContent = 'Nenhuma tarefa ainda';
            p.textContent = 'Adicione sua primeira tarefa para começar!';
        }
    }
}

// ========== TEMA ==========
function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);

    // Atualizar ícone
    const icon = themeToggle.querySelector('i');
    icon.className = newTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';

    // Animação do botão
    themeToggle.style.transform = 'rotate(360deg)';
    setTimeout(() => {
        themeToggle.style.transform = '';
    }, 300);
}

function loadTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);

    const icon = themeToggle.querySelector('i');
    icon.className = savedTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
}

// ========== ARMAZENAMENTO ==========
function saveTasks() {
    localStorage.setItem('tasks', JSON.stringify(tasks));
}

function loadTasks() {
    const savedTasks = localStorage.getItem('tasks');
    tasks = savedTasks ? JSON.parse(savedTasks) : [];
}

// ========== UTILITÁRIOS ==========
function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Agora mesmo';
    if (diffMins < 60) return `${diffMins} min atrás`;
    if (diffHours < 24) return `${diffHours} hora${diffHours > 1 ? 's' : ''} atrás`;
    if (diffDays < 7) return `${diffDays} dia${diffDays > 1 ? 's' : ''} atrás`;

    return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}

function shakeElement(element) {
    element.style.animation = 'none';
    setTimeout(() => {
        element.style.animation = 'shake 0.5s';
    }, 10);

    setTimeout(() => {
        element.style.animation = '';
    }, 500);
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;

    Object.assign(notification.style, {
        position: 'fixed',
        top: '20px',
        right: '20px',
        padding: '15px 20px',
        borderRadius: '12px',
        color: 'white',
        fontWeight: '600',
        fontSize: '0.95rem',
        zIndex: '10000',
        animation: 'slideInRight 0.3s ease',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
        maxWidth: '300px'
    });

    const colors = {
        success: '#48bb78',
        danger: '#f56565',
        info: '#667eea'
    };
    notification.style.background = colors[type] || colors.info;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}

// ========== ANIMAÇÕES CSS ADICIONAIS ==========
const style = document.createElement('style');
style.textContent = `
    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        25% { transform: translateX(-10px); }
        75% { transform: translateX(10px); }
    }
    
    @keyframes slideInRight {
        from {
            opacity: 0;
            transform: translateX(100px);
        }
        to {
            opacity: 1;
            transform: translateX(0);
        }
    }
    
    @keyframes slideOutRight {
        from {
            opacity: 1;
            transform: translateX(0);
        }
        to {
            opacity: 0;
            transform: translateX(100px);
        }
    }
`;
document.head.appendChild(style);

// ========== ATALHOS DE TECLADO ==========
document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + K para focar na busca
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        searchInput.focus();
    }

    // Esc para limpar busca
    if (e.key === 'Escape' && document.activeElement === searchInput) {
        searchInput.value = '';
        currentSearchTerm = '';
        renderTasks();
        searchInput.blur();
    }
});