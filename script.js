const calendarGrid = document.getElementById('calendar-grid');
const currentMonthYear = document.getElementById('current-month-year');
const addTodoBtn = document.getElementById('add-todo-btn');
const modal = document.getElementById('add-todo-modal');
const closeBtn = document.querySelector('.close-btn');
const todoDateInput = document.getElementById('todo-date');
const todoTextInput = document.getElementById('todo-text');
const todoMemoInput = document.getElementById('todo-memo');
const todoCategorySelect = document.getElementById('todo-category');
const todoPrioritySelect = document.getElementById('todo-priority');
const todoRepeatCheckbox = document.getElementById('todo-repeat');
const repeatTypeSelect = document.getElementById('repeat-type');
const saveTodoBtn = document.getElementById('save-todo-btn');
const modalTitle = document.getElementById('modal-title');
const themeBtns = document.querySelectorAll('.theme-btn');
const todoTooltip = document.getElementById('todo-tooltip'); 
const datePickerModal = document.getElementById('date-picker-modal');
const datePickerGrid = document.getElementById('date-picker-grid');
const pickerMonthYear = document.getElementById('picker-month-year');
const closePickerBtn = document.querySelector('.close-picker-btn');
const syncBtn = document.getElementById('sync-btn');
const syncModal = document.getElementById('sync-modal');
const exportBtn = document.getElementById('export-btn');
const importBtn = document.getElementById('import-btn');
const importFile = document.getElementById('import-file');
const closeSyncBtn = document.querySelector('.close-sync-btn');
const themeSelector = document.getElementById('theme-selector');
const themeOptions = document.getElementById('theme-options');

let currentDate = new Date();
let selectedDate = new Date();
selectedDate.setHours(0,0,0,0);
let pickerDate = new Date();

let todosData = loadFromStorage('todos') || {};
let habitsData = loadFromStorage('habits') || [];
let currentTheme = loadFromStorage('theme') || 'brown';
let editingTodo = null;
let draggedTodo = null;

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
    const order = { high: 3, medium: 2, low: 1, none: 0 };
    return order[prio] || 0;
}

// 반복 일정 생성 제거 - 습관으로 관리
function getWeeklyGoal(repeatType) {
    const goals = {
        'daily': 7,
        '6times': 6,
        '5times': 5,
        '4times': 4,
        '3times': 3,
        '2times': 2,
        'weekly': 1
    };
    return goals[repeatType] || 7;
}

function getWeekDates() {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const monday = new Date(today);
    monday.setDate(today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1));
    monday.setHours(0, 0, 0, 0);
    
    const dates = [];
    for (let i = 0; i < 7; i++) {
        const date = new Date(monday);
        date.setDate(monday.getDate() + i);
        dates.push(dateToKey(date));
    }
    return dates;
}

function renderHabits() {
    const habitList = document.getElementById('habit-list');
    const habitTracker = document.getElementById('habit-tracker');
    
    if (habitsData.length === 0) {
        habitTracker.style.display = 'none';
        return;
    }
    
    habitTracker.style.display = 'block';
    habitList.innerHTML = '';
    
    const todayKey = dateToKey(new Date());
    const weekDates = getWeekDates();
    
    habitsData.forEach((habit, index) => {
        const item = document.createElement('div');
        item.className = `habit-item ${habit.category}`;
        
        const infoDiv = document.createElement('div');
        infoDiv.className = 'habit-info';
        
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.className = 'habit-check';
        checkbox.checked = habit.completedDates && habit.completedDates.includes(todayKey);
        
        checkbox.addEventListener('change', (e) => {
            if (!habit.completedDates) habit.completedDates = [];
            
            if (e.target.checked) {
                if (!habit.completedDates.includes(todayKey)) {
                    habit.completedDates.push(todayKey);
                }
            } else {
                habit.completedDates = habit.completedDates.filter(d => d !== todayKey);
            }
            
            saveToStorage('habits', habitsData);
            renderHabits();
            renderCalendar(currentDate);
        });
        
        const textSpan = document.createElement('div');
        textSpan.className = 'habit-text';
        textSpan.textContent = habit.text;
        
        infoDiv.appendChild(checkbox);
        infoDiv.appendChild(textSpan);
        
        // 주간 진행률
        const weeklyGoal = getWeeklyGoal(habit.repeatType);
        const weeklyCompleted = weekDates.filter(date => 
            habit.completedDates && habit.completedDates.includes(date)
        ).length;
        const progress = Math.min((weeklyCompleted / weeklyGoal) * 100, 100);
        
        const progressDiv = document.createElement('div');
        progressDiv.className = 'habit-progress';
        
        const progressText = document.createElement('div');
        progressText.className = 'progress-text';
        progressText.textContent = `${weeklyCompleted}/${weeklyGoal}`;
        
        const progressBar = document.createElement('div');
        progressBar.className = 'progress-bar';
        
        const progressFill = document.createElement('div');
        progressFill.className = 'progress-fill';
        if (weeklyCompleted >= weeklyGoal) {
            progressFill.classList.add('complete');
        }
        progressFill.style.width = `${progress}%`;
        
        progressBar.appendChild(progressFill);
        progressDiv.appendChild(progressText);
        progressDiv.appendChild(progressBar);
        
        // 연속 기록 계산
        let streak = 0;
        let checkDate = new Date();
        checkDate.setHours(0,0,0,0);
        
        while (streak < 365) {
            const key = dateToKey(checkDate);
            if (habit.completedDates && habit.completedDates.includes(key)) {
                streak++;
                checkDate.setDate(checkDate.getDate() - 1);
            } else {
                break;
            }
        }
        
        const streakSpan = document.createElement('div');
        streakSpan.className = 'habit-streak';
        streakSpan.textContent = `🔥 ${streak}`;
        
        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'habit-actions';
        
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'habit-delete';
        deleteBtn.textContent = '🗑️';
        deleteBtn.title = '삭제';
        deleteBtn.setAttribute('data-action', 'delete-habit');
        deleteBtn.setAttribute('data-index', index);
        
        // 직접 처리
        deleteBtn.onmouseup = function(evt) {
            evt.preventDefault();
            evt.stopPropagation();
            evt.stopImmediatePropagation();
            
            const idx = parseInt(this.getAttribute('data-index'));
            
            if (window.confirm('이 습관을 삭제하시겠습니까?')) {
                const habits = loadFromStorage('habits') || [];
                habits.splice(idx, 1);
                saveToStorage('habits', habits);
                habitsData = habits;
                
                // 즉시 재렌더링
                renderHabits();
                renderCalendar(currentDate);
            }
            
            return false;
        };
        
        actionsDiv.appendChild(deleteBtn);
        
        item.appendChild(infoDiv);
        item.appendChild(progressDiv);
        item.appendChild(streakSpan);
        item.appendChild(actionsDiv);
        habitList.appendChild(item);
    });
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
            <div class="tooltip-header-actions">
                <button id="add-from-tooltip-btn" title="할 일 추가">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <line x1="12" y1="5" x2="12" y2="19"></line>
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                    </svg>
                </button>
                <button id="close-tooltip-btn">✖</button>
            </div>
        </h5>
    `;
    todoTooltip.dataset.date = dateKey;

    dayTodos.sort((a,b) => getPriorityOrder(b.priority) - getPriorityOrder(a.priority));

    if (dayTodos.length > 0) {
        const ul = document.createElement('ul');
        
        dayTodos.forEach((todo, index) => {
            const li = document.createElement('li');
            li.className = todo.category;
            li.draggable = true;
            li.dataset.index = index;
            
            // 드래그 이벤트
            li.addEventListener('dragstart', (e) => {
                draggedTodo = { fromDateKey: dateKey, index: index, todo: {...todo} };
                li.classList.add('dragging');
                e.dataTransfer.effectAllowed = 'move';
            });
            
            li.addEventListener('dragend', () => {
                li.classList.remove('dragging');
            });
            
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
            });

            const actionsDiv = document.createElement('div');
            actionsDiv.className = 'todo-actions';

            const editBtn = document.createElement('button');
            editBtn.textContent = '✏️';
            editBtn.className = 'edit-btn';
            editBtn.title = '수정';
            
            editBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                editingTodo = { dateKey, index };
                modalTitle.textContent = '할 일 수정';
                todoDateInput.value = dateKey;
                todoTextInput.value = todo.text;
                todoMemoInput.value = todo.memo || '';
                todoCategorySelect.value = todo.category || 'etc';
                todoPrioritySelect.value = todo.priority || 'none';
                todoRepeatCheckbox.checked = false;
                repeatOptions.style.display = 'none';
                modal.style.display = 'flex';
                todoTextInput.focus();
            });

            const deleteBtn = document.createElement('button');
            deleteBtn.textContent = '🗑️';
            deleteBtn.className = 'delete-btn';
            deleteBtn.title = '삭제';
            deleteBtn.setAttribute('data-action', 'delete');
            deleteBtn.setAttribute('data-datekey', dateKey);
            deleteBtn.setAttribute('data-index', index);
            
            // 직접 처리 (이벤트 리스너 없이)
            deleteBtn.onmouseup = function(evt) {
                evt.preventDefault();
                evt.stopPropagation();
                evt.stopImmediatePropagation();
                
                const dk = this.getAttribute('data-datekey');
                const idx = parseInt(this.getAttribute('data-index'));
                
                if (window.confirm('이 할 일을 삭제하시겠습니까?')) {
                    const todos = loadFromStorage('todos') || {};
                    if (todos[dk] && todos[dk][idx]) {
                        todos[dk].splice(idx, 1);
                        if (todos[dk].length === 0) {
                            delete todos[dk];
                        }
                        saveToStorage('todos', todos);
                        todosData = todos;
                        
                        // 즉시 재렌더링
                        renderCalendar(currentDate);
                        
                        if (todos[dk] && todos[dk].length > 0) {
                            setTimeout(() => showTooltip(dk), 50);
                        } else {
                            hideTooltip();
                        }
                    }
                }
                
                return false;
            };

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
    
    // 팝업에서 할 일 추가 버튼
    document.getElementById('add-from-tooltip-btn').addEventListener('click', () => {
        editingTodo = null;
        modalTitle.textContent = '할 일 추가';
        modal.style.display='flex'; 
        todoDateInput.value=dateKey;
        todoTextInput.value='';
        todoMemoInput.value='';
        todoCategorySelect.value='etc';
        todoPrioritySelect.value='none';
        todoRepeatCheckbox.checked = false;
        repeatOptions.style.display = 'none';
        todoTextInput.focus();
    });
    
    todoTooltip.style.display = 'block';
}

// 날짜 선택기 렌더링
function renderDatePicker() {
    datePickerGrid.innerHTML = '';
    
    const month = pickerDate.getMonth();
    const year = pickerDate.getFullYear();
    pickerMonthYear.textContent = `${year}년 ${month + 1}월`;
    
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysOfWeek = ['월', '화', '수', '목', '금', '토', '일'];
    
    daysOfWeek.forEach(day => {
        const h = document.createElement('div');
        h.className = 'picker-day-cell header';
        h.textContent = day;
        datePickerGrid.appendChild(h);
    });
    
    // 월요일 시작으로 조정
    const adjustedFirstDay = firstDay === 0 ? 6 : firstDay - 1;
    
    for (let i = 0; i < adjustedFirstDay; i++) {
        const e = document.createElement('div');
        e.className = 'picker-day-cell empty';
        datePickerGrid.appendChild(e);
    }
    
    for (let d = 1; d <= daysInMonth; d++) {
        const cell = document.createElement('div');
        cell.className = 'picker-day-cell';
        cell.textContent = d;
        
        const cellDate = new Date(year, month, d);
        const dayOfWeek = cellDate.getDay();
        
        if (dayOfWeek === 0) cell.classList.add('sunday');
        if (dayOfWeek === 6) cell.classList.add('saturday');
        
        cell.addEventListener('click', () => {
            currentDate = new Date(year, month, 1);
            selectedDate = cellDate;
            renderCalendar(currentDate);
            datePickerModal.style.display = 'none';
        });
        
        datePickerGrid.appendChild(cell);
    }
}

// 캘린더 렌더링
function renderCalendar(date){
    calendarGrid.innerHTML='';

    const month=date.getMonth(), year=date.getFullYear();
    currentMonthYear.textContent=`${year}년 ${month+1}월`;

    const firstDay=new Date(year,month,1).getDay(); 
    const daysInMonth=new Date(year,month+1,0).getDate(); 
    const daysOfWeek=['월','화','수','목','금','토','일'];

    daysOfWeek.forEach(day=>{
        const h=document.createElement('div');
        h.className='day-cell header';
        h.textContent=day;
        calendarGrid.appendChild(h);
    });

    // 월요일 시작으로 조정 (일요일=0 -> 6으로 변환)
    const adjustedFirstDay = firstDay === 0 ? 6 : firstDay - 1;
    
    // 이전 달 날짜 표시
    const prevMonth = month === 0 ? 11 : month - 1;
    const prevYear = month === 0 ? year - 1 : year;
    const prevMonthDays = new Date(prevYear, prevMonth + 1, 0).getDate();
    
    for(let i = adjustedFirstDay - 1; i >= 0; i--){
        const day = prevMonthDays - i;
        const cell = document.createElement('div');
        cell.className = 'day-cell other-month';
        cell.textContent = day;
        
        const cellDate = new Date(prevYear, prevMonth, day);
        const dateKey = dateToKey(cellDate);
        cell.dataset.date = dateKey;
        
        cell.addEventListener('click', () => {
            currentDate = new Date(prevYear, prevMonth, 1);
            selectedDate = cellDate;
            renderCalendar(currentDate);
        });
        
        calendarGrid.appendChild(cell);
    }
    
    // 남은 칸 계산 (6주 = 42칸)
    const totalCells = 42;
    const usedCells = adjustedFirstDay + daysInMonth;
    const emptyCellsAtEnd = totalCells - usedCells;

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
        // 월요일(1)부터 시작하므로 일요일(0)은 7번째
        if(dayOfWeek===0) cell.classList.add('sunday'); 
        if(dayOfWeek===6) cell.classList.add('saturday'); 

        if(todayKey===dateKey) cell.classList.add('today');
        if(dateToKey(selectedDate)===dateKey) cell.classList.add('selected');

        // 드래그 오버 이벤트
        cell.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            if (!cell.classList.contains('empty') && !cell.classList.contains('header')) {
                cell.style.background = '#d1ecf1';
            }
        });
        
        cell.addEventListener('dragleave', () => {
            cell.style.background = '';
        });
        
        cell.addEventListener('drop', (e) => {
            e.preventDefault();
            cell.style.background = '';
            
            if (draggedTodo && !cell.classList.contains('empty') && !cell.classList.contains('header')) {
                const toDateKey = cell.dataset.date;
                const { fromDateKey, index, todo } = draggedTodo;
                
                // 원래 날짜에서 제거
                todosData[fromDateKey].splice(index, 1);
                if (todosData[fromDateKey].length === 0) {
                    delete todosData[fromDateKey];
                }
                
                // 새 날짜에 추가
                if (!todosData[toDateKey]) todosData[toDateKey] = [];
                todosData[toDateKey].push(todo);
                
                saveToStorage('todos', todosData);
                renderCalendar(currentDate);
                hideTooltip();
                draggedTodo = null;
            }
        });

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
                // 카테고리별 점 표시
                const categories = [...new Set(todosData[dateKey].map(t => t.category))];
                const dotsContainer = document.createElement('div');
                dotsContainer.className = 'category-dots';
                
                categories.slice(0, 3).forEach(cat => {
                    const dot = document.createElement('div');
                    dot.className = `category-dot ${cat}`;
                    dotsContainer.appendChild(dot);
                });
                
                cell.appendChild(dotsContainer);
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
    
    // 다음 달 날짜 표시
    const nextMonth = month === 11 ? 0 : month + 1;
    const nextYear = month === 11 ? year + 1 : year;
    
    for(let i = 1; i <= emptyCellsAtEnd; i++){
        const cell = document.createElement('div');
        cell.className = 'day-cell other-month';
        cell.textContent = i;
        
        const cellDate = new Date(nextYear, nextMonth, i);
        const dateKey = dateToKey(cellDate);
        cell.dataset.date = dateKey;
        
        cell.addEventListener('click', () => {
            currentDate = new Date(nextYear, nextMonth, 1);
            selectedDate = cellDate;
            renderCalendar(currentDate);
        });
        
        calendarGrid.appendChild(cell);
    }
    
    renderHabits();
}

// 전역 클릭 이벤트
document.addEventListener('click', (e) => {
    if (!e.target.closest('#todo-tooltip') && 
        !e.target.closest('#add-todo-modal') &&
        !e.target.closest('.day-cell')) {
        hideTooltip();
    }
});

// 동기화 기능
syncBtn.addEventListener('click', () => {
    syncModal.style.display = 'flex';
});

closeSyncBtn.addEventListener('click', () => {
    syncModal.style.display = 'none';
});

window.addEventListener('click', e => {
    if (e.target == syncModal) {
        syncModal.style.display = 'none';
    }
});

// 내보내기
exportBtn.addEventListener('click', () => {
    const data = {
        todos: todosData,
        habits: habitsData,
        theme: currentTheme,
        exportDate: new Date().toISOString(),
        version: '1.0'
    };
    
    const dataStr = JSON.stringify(data, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    // 모바일/데스크톱 모두 지원
    const link = document.createElement('a');
    link.href = url;
    link.download = `todo-calendar-backup-${new Date().toISOString().split('T')[0]}.json`;
    
    // iOS Safari 지원
    if (navigator.userAgent.match(/iPhone|iPad|iPod/i)) {
        link.target = '_blank';
    }
    
    document.body.appendChild(link);
    link.click();
    
    setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }, 100);
    
    alert('데이터를 내보냈습니다!\n다운로드 폴더를 확인하세요.');
});

// 가져오기
importBtn.addEventListener('click', () => {
    importFile.click();
});

importFile.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
        try {
            const data = JSON.parse(event.target.result);
            
            if (!data.todos || !data.version) {
                alert('올바른 백업 파일이 아닙니다.');
                return;
            }
            
            if (confirm('현재 데이터를 덮어쓰시겠습니까?\n기존 데이터는 삭제됩니다!')) {
                todosData = data.todos || {};
                habitsData = data.habits || [];
                currentTheme = data.theme || 'brown';
                
                saveToStorage('todos', todosData);
                saveToStorage('habits', habitsData);
                saveToStorage('theme', currentTheme);
                
                document.body.classList.remove('white','black','pink','brown','sky','yellow','green');
                document.body.classList.add(currentTheme);
                
                updateActiveTheme();
                renderCalendar(currentDate);
                renderHabits();
                syncModal.style.display = 'none';
                
                alert('데이터를 가져왔습니다!');
                setTimeout(() => location.reload(), 500);
            }
        } catch (error) {
            alert('파일을 읽는 중 오류가 발생했습니다.\n' + error.message);
            console.error(error);
        }
        
        importFile.value = '';
    };
    
    reader.onerror = () => {
        alert('파일을 읽을 수 없습니다.');
        importFile.value = '';
    };
    
    reader.readAsText(file);
});

// 테마 버튼
document.body.classList.add(currentTheme);

// 현재 테마 버튼 표시
function updateActiveTheme() {
    const activeBtn = themeSelector.querySelector('.theme-btn.active');
    activeBtn.dataset.theme = currentTheme;
    activeBtn.className = `theme-btn active ${currentTheme}`;
    
    // 테마별 스타일 직접 적용
    const themeColors = {
        'white': 'linear-gradient(135deg, #ffffff 0%, #f0f0f0 100%)',
        'black': 'linear-gradient(135deg, #3a3a3a 0%, #1f1f1f 100%)',
        'pink': 'linear-gradient(135deg, #f5d5e5 0%, #e8c4d8 100%)',
        'brown': 'linear-gradient(135deg, #c9b8a8 0%, #a8958a 100%)',
        'sky': 'linear-gradient(135deg, #a8d8ea 0%, #7cb8d4 100%)',
        'yellow': 'linear-gradient(135deg, #ffe082 0%, #ffd54f 100%)',
        'green': 'linear-gradient(135deg, #aed581 0%, #9ccc65 100%)'
    };
    
    activeBtn.style.background = themeColors[currentTheme];
}

updateActiveTheme();

// 테마 선택기 토글
themeSelector.addEventListener('click', (e) => {
    if (e.target.closest('.theme-btn') && !e.target.closest('.theme-options')) {
        const isOpen = themeOptions.style.display === 'flex';
        themeOptions.style.display = isOpen ? 'none' : 'flex';
    }
});

// 테마 선택
themeBtns.forEach(btn=>{
    btn.addEventListener('click',(e)=>{
        e.stopPropagation();
        const theme = btn.dataset.theme;
        document.body.classList.remove('white','black','pink','brown','sky','yellow','green');
        document.body.classList.add(theme);
        currentTheme = theme;
        saveToStorage('theme', theme);
        updateActiveTheme();
        themeOptions.style.display = 'none';
        renderCalendar(currentDate); 
    });
});

// 테마 옵션 외부 클릭시 닫기
document.addEventListener('click', (e) => {
    if (!e.target.closest('#theme-selector')) {
        themeOptions.style.display = 'none';
    }
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

// 날짜 선택기
currentMonthYear.addEventListener('click', () => {
    pickerDate = new Date(currentDate);
    renderDatePicker();
    datePickerModal.style.display = 'flex';
});

document.getElementById('prev-year').addEventListener('click', () => {
    pickerDate.setFullYear(pickerDate.getFullYear() - 1);
    renderDatePicker();
});

document.getElementById('prev-picker-month').addEventListener('click', () => {
    pickerDate.setMonth(pickerDate.getMonth() - 1);
    renderDatePicker();
});

document.getElementById('next-picker-month').addEventListener('click', () => {
    pickerDate.setMonth(pickerDate.getMonth() + 1);
    renderDatePicker();
});

document.getElementById('next-year').addEventListener('click', () => {
    pickerDate.setFullYear(pickerDate.getFullYear() + 1);
    renderDatePicker();
});

closePickerBtn.addEventListener('click', () => {
    datePickerModal.style.display = 'none';
});

window.addEventListener('click', e => {
    if (e.target == datePickerModal) {
        datePickerModal.style.display = 'none';
    }
});

// 반복 일정 체크박스
const repeatOptions = document.getElementById('repeat-options');
todoRepeatCheckbox.addEventListener('change', (e) => {
    repeatOptions.style.display = e.target.checked ? 'block' : 'none';
});

// 모달
addTodoBtn.addEventListener('click',()=>{
    editingTodo = null;
    modalTitle.textContent = '할 일 추가';
    modal.style.display='flex'; 
    todoDateInput.value=dateToKey(selectedDate);
    todoTextInput.value='';
    todoMemoInput.value='';
    todoCategorySelect.value='etc';
    todoPrioritySelect.value='none';
    todoRepeatCheckbox.checked = false;
    repeatOptions.style.display = 'none';
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
    const category=todoCategorySelect.value;
    const prio=todoPrioritySelect.value;
    const isRepeat = todoRepeatCheckbox.checked;
    const repeatType = repeatTypeSelect.value;
    
    if(!dateVal || textVal===''){ 
        alert('날짜와 제목을 입력해주세요.'); 
        return; 
    }

    if (editingTodo) {
        const { dateKey, index } = editingTodo;
        todosData[dateKey][index] = {
            ...todosData[dateKey][index],
            text: textVal,
            memo: memoVal,
            category: category,
            priority: prio
        };
        saveToStorage('todos', todosData);
        modal.style.display='none';
        editingTodo = null;
        
        renderCalendar(currentDate);
        showTooltip(dateKey);
    } else {
        if (isRepeat) {
            // 습관으로 추가
            const newHabit = {
                text: textVal,
                category: category,
                repeatType: repeatType,
                completedDates: []
            };
            
            habitsData.push(newHabit);
            saveToStorage('habits', habitsData);
            modal.style.display='none';
            
            renderHabits();
            renderCalendar(currentDate);
        } else {
            // 일반 할 일로 추가
            const newTodo = {
                text: textVal,
                memo: memoVal,
                category: category,
                priority: prio,
                completed: false
            };
            
            if(!todosData[dateVal]) todosData[dateVal]=[];
            todosData[dateVal].push(newTodo);
            
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
    }
});

// 초기 실행
renderCalendar(currentDate);
