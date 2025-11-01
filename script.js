const calendarGrid = document.getElementById('calendar-grid');
const currentMonthYear = document.getElementById('current-month-year');
const addTodoBtn = document.getElementById('add-todo-btn');
const modal = document.getElementById('add-todo-modal');
const closeBtn = document.querySelector('.close-btn');
const todoDateInput = document.getElementById('todo-date');
const todoTextInput = document.getElementById('todo-text');
const todoPrioritySelect = document.getElementById('todo-priority');
const saveTodoBtn = document.getElementById('save-todo-btn');
const themeBtns = document.querySelectorAll('.theme-btn');
const todoTooltip = document.getElementById('todo-tooltip'); 

let currentDate = new Date();
let selectedDate = new Date();
selectedDate.setHours(0,0,0,0);

// --- 유틸리티 함수 ---
function dateToKey(date){ 
    const y=date.getFullYear(), m=date.getMonth()+1, d=date.getDate();
    return `${y}-${m<10?'0':''}${m}-${d<10?'0':''}${d}`;
}
function loadTodos(){ return JSON.parse(localStorage.getItem('todos'))||{}; }
function saveTodos(todos){ localStorage.setItem('todos', JSON.stringify(todos)); }
function loadTheme(){ return localStorage.getItem('theme') || 'default'; }
function saveTheme(theme){ localStorage.setItem('theme', theme); }
function getPriorityOrder(prio) { 
    const order = { high: 3, medium: 2, low: 1 };
    return order[prio] || 0;
}


// --- 툴팁 표시 및 숨기기 함수 ---
function hideTooltip() {
    todoTooltip.style.display = 'none';
    todoTooltip.classList.remove('visible');
}

/**
 * 특정 날짜의 투두리스트를 팝업에 렌더링하고 위치를 조정합니다.
 * @param {string} dateKey - 'YYYY-MM-DD' 형식의 날짜 키
 * @param {HTMLElement} targetElement - 날짜 셀 요소 (기준 위치)
 */
function showTooltip(dateKey, targetElement) {
    const todos = loadTodos();
    let dayTodos = todos[dateKey] || [];
    
    // 중요도 순서로 정렬: high > medium > low
    dayTodos.sort((a,b) => getPriorityOrder(b.priority) - getPriorityOrder(a.priority));

    todoTooltip.innerHTML = `<h5>${dateKey}의 할 일</h5>`;
    
    if (dayTodos.length === 0) {
        // 투두가 없는 경우, Tooltip을 숨기고 캘린더 리렌더링 (점 제거)
        hideTooltip(); 
        renderCalendar(currentDate); 
        return; 
    }
    
    const ul = document.createElement('ul');
    dayTodos.forEach((todo, index) => {
        const li = document.createElement('li');
        
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = todo.completed;
        
        // 체크박스 클릭 이벤트 리스너
        checkbox.addEventListener('change', (e) => {
            todos[dateKey][index].completed = e.target.checked;
            saveTodos(todos);
            showTooltip(dateKey, targetElement); // 팝업 내용 갱신
        });

        const textSpan = document.createElement('span');
        textSpan.textContent = todo.text;
        if (todo.completed) textSpan.classList.add('completed');
        
        const prioritySpan = document.createElement('span');
        prioritySpan.className = 'priority';
        prioritySpan.textContent = todo.priority === 'high' ? '⭐⭐⭐' : todo.priority === 'medium' ? '⭐⭐' : '⭐';

        // --- 삭제 버튼 추가 ---
        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = '✖';
        deleteBtn.style.background = 'none';
        deleteBtn.style.border = 'none';
        deleteBtn.style.color = '#ccc';
        deleteBtn.style.cursor = 'pointer';
        deleteBtn.style.marginLeft = '5px';
        deleteBtn.style.fontSize = '0.8em';
        
        // 삭제 버튼 클릭 이벤트 리스너
        deleteBtn.addEventListener('click', () => {
            // 해당 인덱스의 투두 항목 제거
            todos[dateKey].splice(index, 1);
            saveTodos(todos);
            
            // 삭제 후 팝업 내용 및 캘린더 업데이트
            showTooltip(dateKey, targetElement);
            renderCalendar(currentDate); 
        });


        li.appendChild(checkbox);
        li.appendChild(textSpan);
        li.appendChild(prioritySpan);
        li.appendChild(deleteBtn);
        ul.appendChild(li);
    });
    todoTooltip.appendChild(ul);
    
    // 툴팁 위치 계산 (이전과 동일한 로직)
    const rect = targetElement.getBoundingClientRect();
    const containerRect = document.getElementById('widget-container').getBoundingClientRect();
    
    // 팝업이 위로 튀어나가지 않도록 위치 조정 로직
    todoTooltip.style.display = 'block';
    const tooltipHeight = todoTooltip.offsetHeight || 150; 
    const newTop = rect.top - containerRect.top - tooltipHeight - 10;
    
    let tooltipLeft = rect.left - containerRect.left + rect.width / 2 - todoTooltip.offsetWidth / 2;
    if (tooltipLeft < 0) {
        tooltipLeft = 5; 
    } else if (tooltipLeft + todoTooltip.offsetWidth > containerRect.width) {
        tooltipLeft = containerRect.width - todoTooltip.offsetWidth - 5; 
    }
    todoTooltip.style.left = `${tooltipLeft}px`;

    if (newTop < 0) {
        // 위젯 상단을 넘어서면, 날짜 셀 아래에 표시
        todoTooltip.style.top = `${rect.bottom - containerRect.top + 5}px`;
    } else {
        // 충분한 공간이 있다면, 날짜 셀 위에 표시
        todoTooltip.style.top = `${newTop}px`;
    }

    todoTooltip.classList.add('visible');
}


// --- 캘린더 생성 기능 (변경 없음) ---
function renderCalendar(date){
    calendarGrid.innerHTML='';
    hideTooltip(); 

    const month=date.getMonth(), year=date.getFullYear();
    currentMonthYear.textContent=`${year}년 ${month+1}월`;

    const firstDay=new Date(year,month,1).getDay(); 
    const daysInMonth=new Date(year,month+1,0).getDate(); 
    const daysOfWeek=['일','월','화','수','목','금','토'];

    // 1. 요일 헤더 생성
    daysOfWeek.forEach(day=>{
        const h=document.createElement('div');
        h.className='day-cell header';
        h.textContent=day;
        calendarGrid.appendChild(h);
    });

    // 2. 빈 칸 생성
    for(let i=0;i<firstDay;i++){
        const e=document.createElement('div');
        e.className='day-cell empty';
        calendarGrid.appendChild(e);
    }

    const todos=loadTodos();
    const todayKey=dateToKey(new Date());

    // 3. 실제 날짜 셀 생성
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

        // 할 일 표시 점
        if(todos[dateKey] && todos[dateKey].length>0){
            const dot=document.createElement('div');
            dot.className='todo-dot';
            cell.appendChild(dot);
        }

        // --- 마우스 이벤트 리스너 (Tooltip) ---
        cell.addEventListener('mouseenter', () => {
            if (!cell.classList.contains('empty') && todos[dateKey] && todos[dateKey].length > 0) {
                showTooltip(dateKey, cell);
            }
        });
        cell.addEventListener('mouseleave', (e) => {
            if (!e.relatedTarget || e.relatedTarget.closest('#todo-tooltip') !== todoTooltip) {
                setTimeout(hideTooltip, 100);
            }
        });

        // 날짜 클릭 이벤트 (선택 하이라이트 유지 및 툴팁 재표시)
        cell.addEventListener('click',()=>{
            document.querySelectorAll('.day-cell.selected').forEach(c=>c.classList.remove('selected'));
            cell.classList.add('selected');
            selectedDate=cellDate; 
            
            if (!cell.classList.contains('empty') && todos[dateKey] && todos[dateKey].length > 0) {
                 showTooltip(dateKey, cell);
            } else {
                 hideTooltip();
            }
        });
        
        calendarGrid.appendChild(cell);
    }
}

// 툴팁 위에 마우스가 올라가면 툴팁 유지
todoTooltip.addEventListener('mouseleave', hideTooltip);


// --- 이벤트 리스너 ---

// 테마 버튼 (변경 없음)
document.body.classList.add(loadTheme()); 
themeBtns.forEach(btn=>{
    btn.addEventListener('click',()=>{
        const theme = btn.dataset.theme;
        document.body.classList.remove('default','cute','calm','mono');
        document.body.classList.add(theme);
        saveTheme(theme);
        renderCalendar(currentDate); 
    });
});

// 달력 이동 (변경 없음)
document.getElementById('prev-month').addEventListener('click',()=>{
    currentDate.setMonth(currentDate.getMonth()-1);
    renderCalendar(currentDate);
});
document.getElementById('next-month').addEventListener('click',()=>{
    currentDate.setMonth(currentDate.getMonth()+1);
    renderCalendar(currentDate);
});

// 모달 관련 (변경 없음)
addTodoBtn.addEventListener('click',()=>{
    modal.style.display='flex'; 
    todoDateInput.value=dateToKey(selectedDate);
    todoTextInput.value='';
    todoPrioritySelect.value='medium';
});
closeBtn.addEventListener('click',()=>modal.style.display='none');
window.addEventListener('click',e=>{if(e.target==modal) modal.style.display='none';});

// 할 일 저장 (변경 없음)
saveTodoBtn.addEventListener('click',()=>{
    const dateVal=todoDateInput.value;
    const textVal=todoTextInput.value.trim();
    const prio=todoPrioritySelect.value;
    if(!dateVal || textVal===''){ alert('날짜와 내용을 입력해주세요.'); return; }

    const todos=loadTodos();
    if(!todos[dateVal]) todos[dateVal]=[];
    todos[dateVal].push({text:textVal,priority:prio,completed:false});
    saveTodos(todos);
    modal.style.display='none';
    
    const [y, m] = dateVal.split('-');
    if (Number(y) === currentDate.getFullYear() && Number(m) === currentDate.getMonth() + 1) {
        renderCalendar(currentDate);
    }
});


// --- 초기 실행 ---
renderCalendar(currentDate);
