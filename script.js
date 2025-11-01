const calendarGrid = document.getElementById('calendar-grid');
const currentMonthYear = document.getElementById('current-month-year');
const addTodoBtn = document.getElementById('add-todo-btn');
const modal = document.getElementById('add-todo-modal');
const closeBtn = document.querySelector('.close-btn');
const todoDateInput = document.getElementById('todo-date');
const todoTextInput = document.getElementById('todo-text');
const todoMemoInput = document.getElementById('todo-memo');
const todoPrioritySelect = document.getElementById('todo-priority');
const saveTodoBtn = document.getElementById('save-todo-btn');
const modalTitle = document.getElementById('modal-title');
const themeBtns = document.querySelectorAll('.theme-btn');
const todoTooltip = document.getElementById('todo-tooltip'); 

let currentDate = new Date();
let selectedDate = new Date();
selectedDate.setHours(0,0,0,0);

let todosData = loadFromStorage('todos') || {};
let currentTheme = loadFromStorage('theme') || 'brown';
let editingTodo = null; // {dateKey, index}

// 스토리지 함수
function saveToStorage(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch(e) {
        console.log('Storage not available');
    }
}

function loadFromStorage(key) {
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : null;
    } catch(e) {
        return null;
    }
}

// 유틸리티 함수
function dateToKey(date){ 
    const y=date.getFullYear(), m=date.getMonth()+1, d=date.getDate();
    return `${y}-${m<10?'0':''}${m}-${d<10?'0':''}${d}`;
}

function getPriorityOrder(prio) { 
    const order = { high: 3, medium: 2, low: 1 };
    return order[prio] || 0;
}

// 통계 계산
function calculateStats() {
    const today = new Date();
    today.setHours(0,0,0,0);
    
    let streak = 0;
    let checkDate = new Date(today);
    let maxDays = 0;
    
    while(maxDays < 365) {
        const key = dateToKey(checkDate);
        const dayTodos = todosData[key] || [];
        
        if (dayTodos.length > 0 && dayTodos.every(t => t.completed)) {
            streak++;
        } else if (dayTodos.length === 0) {
            if (streak > 0) break;
        } else {
            break;
        }
        
        checkDate.setDate(checkDate.getDate() - 1);
        maxDays++;
    }

    let totalCompleted = 0;
    Object.values(todosData).forEach(todos => {
        totalCompleted += todos.filter(t => t.completed).length;
    });

    const month = currentDate.getMonth();
    const year = currentDate.getFullYear();
    let monthTodos = 0;
    Object.keys(todosData).forEach(key => {
        const [y, m] = key.split('-').map(Number);
        if (y === year && m === month + 1) {
            monthTodos += todosData[key].length;
        }
    });

    document.getElementById('streak-count').textContent = `${streak}일`;
    document.getElementById('total-completed').textContent = `${totalCompleted}개`;
    document.getElementById('month-todos').textContent = `${monthTodos}개`;
}

// 툴팁 표시 및 숨기기
function hideTooltip() {
    todoTooltip.style.display = 'none';
    todoTooltip.dataset.date = ''; 
}

function showTooltip(dateKey) {
    let dayTodos = todosData[dateKey] || [];
    
    if (todoTooltip.dataset.date === dateKey && todoTooltip.style.display === 'block') {
        hideTooltip();
        return;
    }

    const dateObj = new Date(dateKey);
    const displayDate = `${dateObj.getMonth() + 1}월 ${dateObj.getDate()}일`;

    todoTooltip.innerHTML = `
        <h5>
            <span>${displayDate}</span>
            <button id="close-tooltip-btn">✖</button>
        </h5>
    `;
    todoTooltip.dataset.date = dateKey;

    dayTodos.sort((a,b) => getPriorityOrder(b.priority) - getPriorityOrder(a.priority));

    if (dayTodos.length > 0) {
        const ul = document.createElement('ul');
        
        dayTodos.forEach((todo, index) => {
            const li = document.createElement('li');
            const infoDiv = document.createElement('div');
            infoDiv.className = 'todo-info';

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.checked = todo.completed;
            
            const contentDiv = document.createElement('div');
            contentDiv.className = 'todo-content';
            
            const textSpan = document.createElement('div');
            textSpan.textContent = todo.text;
            textSpan.className = 'todo-text'; 
            if (todo.completed) textSpan.classList.add('completed');
            
            contentDiv.appendChild(textSpan);
            
            if (todo.memo) {
                const memoSpan = document.createElement('div');
                memoSpan.textContent = todo.memo;
                memoSpan.className = 'todo-memo';
                if (todo.completed) memoSpan.classList.add('completed');
                contentDiv.appendChild(memoSpan);
            }

            checkbox.addEventListener('change', (e) => {
                todosData[dateKey][index].completed = e.target.checked;
                saveToStorage('todos', todosData);
                
                if (e.target.checked) {
                    textSpan.classList.add('completed');
                    if (todo.memo) {
                        contentDiv.querySelector('.todo-memo').classList.add('completed');
                    }
                } else {
                    textSpan.classList.remove('completed');
                    if (todo.memo) {
                        contentDiv.querySelector('.todo-memo').classList.remove('completed');
                    }
                }
                
                renderCalendar(currentDate);
                calculateStats();
            });

            const actionsDiv = document.createElement('div');
            actionsDiv.className = 'todo-actions';

            const editBtn = document.createElement('button');
            editBtn.textContent = '✏️';
            editBtn.className = 'edit-btn';
            editBtn.title = '수정';
            
            editBtn.addEventListener('click', () => {
                editingTodo = { dateKey, index };
                modalTitle.textContent = '할 일 수정';
                todoDateInput.value = dateKey;
                todoTextInput.value = todo.text;
                todoMemoInput.value = todo.memo || '';
                todoPrioritySelect.value = todo.priority;
                modal.style.display = 'flex';
                todoTextInput.focus();
            });

            const deleteBtn = document.createElement('button');
            deleteBtn.textContent = '🗑️';
            deleteBtn.className = 'delete-btn';
            deleteBtn.title = '삭제';
            
            deleteBtn.addEventListener('click', () => {
                if (confirm('이 할 일을 삭제하시겠습니까?')) {
                    todosData[dateKey].splice(index, 1);
                    if (todosData[dateKey].length === 0) {
                        delete todosData[dateKey];
                    }
                    saveToStorage('todos', todosData);
                    showTooltip(dateKey);
                    renderCalendar(currentDate);
                    calculateStats();
                }
            });

            infoDiv.appendChild(checkbox);
            infoDiv.appendChild(contentDiv);
            actionsDiv.appendChild(editBtn);
            actionsDiv.appendChild(deleteBtn);
            li.appendChild(infoDiv);
            li.appendChild(actionsDiv);
            ul.appendChild(li);
        });
        todoTooltip.appendChild(ul);
    } else {
        const emptyState = document.createElement('div');
        emptyState.className = 'empty-state';
        emptyState.innerHTML = `
            <div class="emoji">📝</div>
            <div>등록된 할 일이 없습니다</div>
        `;
        todoTooltip.appendChild(emptyState);
    }
    
    document.getElementById('close-tooltip-btn').addEventListener('click', hideTooltip);
    todoTooltip.style.display = 'block';
}

// 캘린더 렌더링
function renderCalendar(date){
    calendarGrid.innerHTML='';

    const month=date.getMonth(), year=date.getFullYear();
    currentMonthYear.textContent=`${year}년 ${month+1}월`;

    const firstDay=new Date(year,month,1).getDay(); 
    const daysInMonth=new Date(year,month+1,0).getDate(); 
    const daysOfWeek=['일','월','화','수','목','금','토'];

    daysOfWeek.forEach(day=>{
        const h=document.createElement('div');
        h.className='day-cell header';
        h.textContent=day;
        calendarGrid.appendChild(h);
    });

    for(let i=0;i<firstDay;i++){
        const e=document.createElement('div');
        e.className='day-cell empty';
        calendarGrid.appendChild(e);
    }

    const today=new Date();
    today.setHours(0,0,0,0);
    const todayKey=dateToKey(today);

    for(let d=1;d<=daysInMonth;d++){
        const cell=document.createElement('div');
        cell.className='day-cell';
        cell.textContent=d;

        const cellDate=new Date(year,month,d);
        cellDate.setHours(0,0,0,0);
        const dateKey=dateToKey(cellDate);
        cell.dataset.date=dateKey;

        const dayOfWeek=cellDate.getDay();
        if(dayOfWeek===0) cell.classList.add('sunday'); 
        if(dayOfWeek===6) cell.classList.add('saturday'); 

        if(todayKey===dateKey) cell.classList.add('today');
        if(dateToKey(selectedDate)===dateKey) cell.classList.add('selected');

        if(todosData[dateKey] && todosData[dateKey].length > 0){
            const allCompleted = todosData[dateKey].every(t => t.completed);
            const hasIncomplete = todosData[dateKey].some(todo => !todo.completed);
            
            if (allCompleted) {
                const mark = document.createElement('div');
                mark.className = 'complete-mark';
                mark.textContent = '✓';
                cell.appendChild(mark);
            }
            
            if (hasIncomplete) {
                const dot=document.createElement('div');
                dot.className='todo-dot';
                cell.appendChild(dot);
            }
        }

        cell.addEventListener('click',()=>{
            document.querySelectorAll('.day-cell.selected').forEach(c=>c.classList.remove('selected'));
            cell.classList.add('selected');
            selectedDate=cellDate; 
            if (!cell.classList.contains('empty')) {
                showTooltip(dateKey);
            }
        });
        
        calendarGrid.appendChild(cell);
    }

    calculateStats();
}

// 전역 클릭 이벤트
document.addEventListener('click', (e) => {
    if (!e.target.closest('#todo-tooltip') && 
        !e.target.closest('#add-todo-modal') &&
        !e.target.closest('.day-cell')) {
        hideTooltip();
    }
});

// 테마 버튼
document.body.classList.add(currentTheme); 
themeBtns.forEach(btn=>{
    btn.addEventListener('click',()=>{
        const theme = btn.dataset.theme;
        document.body.classList.remove('white','black','pink','brown');
        document.body.classList.add(theme);
        currentTheme = theme;
        saveToStorage('theme', theme);
        renderCalendar(currentDate); 
    });
});

// 달력 이동
document.getElementById('prev-month').addEventListener('click',()=>{
    currentDate.setMonth(currentDate.getMonth()-1);
    renderCalendar(currentDate);
    hideTooltip();
});
document.getElementById('next-month').addEventListener('click',()=>{
    currentDate.setMonth(currentDate.getMonth()+1);
    renderCalendar(currentDate);
    hideTooltip();
});

// 모달
addTodoBtn.addEventListener('click',()=>{
    editingTodo = null;
    modalTitle.textContent = '새 할 일';
    modal.style.display='flex'; 
    todoDateInput.value=dateToKey(selectedDate);
    todoTextInput.value='';
    todoMemoInput.value='';
    todoPrioritySelect.value='medium';
    todoTextInput.focus();
});
closeBtn.addEventListener('click',()=>{
    modal.style.display='none';
    editingTodo = null;
});
window.addEventListener('click',e=>{
    if(e.target==modal) {
        modal.style.display='none';
        editingTodo = null;
    }
});

// Enter 키로 저장
todoTextInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        saveTodoBtn.click();
    }
});

// 할 일 저장
saveTodoBtn.addEventListener('click',()=>{
    const dateVal=todoDateInput.value;
    const textVal=todoTextInput.value.trim();
    const memoVal=todoMemoInput.value.trim();
    const prio=todoPrioritySelect.value;
    
    if(!dateVal || textVal===''){ 
        alert('날짜와 제목을 입력해주세요.'); 
        return; 
    }

    if (editingTodo) {
        // 수정 모드
        const { dateKey, index } = editingTodo;
        todosData[dateKey][index] = {
            ...todosData[dateKey][index],
            text: textVal,
            memo: memoVal,
            priority: prio
        };
        saveToStorage('todos', todosData);
        modal.style.display='none';
        editingTodo = null;
        
        renderCalendar(currentDate);
        showTooltip(dateKey);
    } else {
        // 추가 모드
        if(!todosData[dateVal]) todosData[dateVal]=[];
        todosData[dateVal].push({
            text: textVal,
            memo: memoVal,
            priority: prio,
            completed: false
        });
        saveToStorage('todos', todosData);
        modal.style.display='none';
        
        const [y, m] = dateVal.split('-').map(Number);
        if (y === currentDate.getFullYear() && m === currentDate.getMonth() + 1) {
            renderCalendar(currentDate);
            if (dateVal === dateToKey(selectedDate)) {
                showTooltip(dateVal);
            }
        } else {
            currentDate = new Date(y, m - 1, 1);
            selectedDate = new Date(dateVal);
            renderCalendar(currentDate);
            showTooltip(dateVal);
        }
    }
});

// 초기 실행
renderCalendar(currentDate);
