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
const todoTooltip = document.getElementById('todo-tooltip'); // Tooltip 요소 추가

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
function getPriorityOrder(prio) { // 중요도 순서 함수
    const order = { high: 3, medium: 2, low: 1 };
    return order[prio] || 0;
}


// --- 툴팁 표시 및 숨기기 함수 ---
function hideTooltip() {
    todoTooltip.style.display = 'none';
    todoTooltip.classList.remove('visible');
}

function showTooltip(dateKey, targetElement) {
    const todos = loadTodos();
    // 중요도 순서로 정렬: high > medium > low
    const dayTodos = todos[dateKey] ? todos[dateKey].sort((a,b) => getPriorityOrder(b.priority) - getPriorityOrder(a.priority)) : [];

    todoTooltip.innerHTML = `<h5>${dateKey}의 할 일</h5>`;
    
    if (dayTodos.length === 0) {
        todoTooltip.innerHTML += '<ul><li>할 일이 없습니다.</li></ul>';
    } else {
        const ul = document.createElement('ul');
        dayTodos.forEach((todo, index) => {
            const li = document.createElement('li');
            
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.checked = todo.completed;
            
            // 툴팁 내 체크박스 클릭 이벤트 리스너: 상태 변경 및 저장
            checkbox.addEventListener('change', (e) => {
                // 원본 todos 객체를 수정
                todos[dateKey][index].completed = e.target.checked;
                saveTodos(todos);
                
                // UI 업데이트
                const textSpan = li.querySelector('span:not(.priority)');
                if (e.target.checked) {
                    textSpan.classList.add('completed');
                } else {
                    textSpan.classList.remove('completed');
                }
            });

            const textSpan = document.createElement('span');
            textSpan.textContent = todo.text;
            if (todo.completed) textSpan.classList.add('completed');
            
            const prioritySpan = document.createElement('span');
            prioritySpan.className = 'priority';
            prioritySpan.textContent = todo.priority === 'high' ? '⭐⭐⭐' : todo.priority === 'medium' ? '⭐⭐' : '⭐';

            li.appendChild(checkbox);
            li.appendChild(textSpan);
            li.appendChild(prioritySpan);
            ul.appendChild(li);
        });
        todoTooltip.appendChild(ul);
    }
    
    // 툴팁 위치 계산 (날짜 셀 위에 띄우기)
    const rect = targetElement.getBoundingClientRect();
    const containerRect = document.getElementById('widget-container').getBoundingClientRect();
    
    // Tooltip을 위젯 컨테이너 기준으로 배치
    todoTooltip.style.left = `${rect.left - containerRect.left + rect.width / 2}px`;
    todoTooltip.style.top = `${rect.top - containerRect.top - todoTooltip.offsetHeight - 10}px`; // 날짜 셀 위쪽으로 띄우기 (간격 10px)

    // 만약 툴팁이 컨테이너 밖으로 나간다면 (왼쪽) 위치 조정
    let tooltipLeft = rect.left - containerRect.left + rect.width / 2 - todoTooltip.offsetWidth / 2;
    if (tooltipLeft < 0) {
        tooltipLeft = 5; // 왼쪽에서 5px 간격
    } else if (tooltipLeft + todoTooltip.offsetWidth > containerRect.width) {
        tooltipLeft = containerRect.width - todoTooltip.offsetWidth - 5; // 오른쪽에서 5px 간격
    }

    todoTooltip.style.left = `${tooltipLeft}px`;
    todoTooltip.style.top = `${rect.top - containerRect.top + rect.height + 5}px`; // 날짜 셀 아래로 띄우기
    
    // 팝업이 위로 튀어나가지 않도록 위치 조정 로직 추가
    // 만약 팝업이 위젯 컨테이너 위쪽 경계를 넘어서면, 날짜 셀 아래에 표시
    const tooltipHeight = todoTooltip.offsetHeight || 150; // 예상 높이
    const newTop = rect.top - containerRect.top - tooltipHeight - 10;
    
    if (newTop < 0) {
        // 위젯 상단을 넘어서면, 날짜 셀 아래에 표시
        todoTooltip.style.top = `${rect.bottom - containerRect.top + 5}px`;
    } else {
        // 충분한 공간이 있다면, 날짜 셀 위에 표시
        todoTooltip.style.top = `${newTop}px`;
    }

    todoTooltip.style.display = 'block';
    todoTooltip.classList.add('visible');
}


// --- 캘린더 생성 기능 ---
function renderCalendar(date){
    calendarGrid.innerHTML='';
    hideTooltip(); // 캘린더 리렌더링 시 툴팁 숨기기

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
            // 마우스가 툴팁 자체로 이동하면 툴팁을 유지
            if (!e.relatedTarget || e.relatedTarget.closest('#todo-tooltip') !== todoTooltip) {
                setTimeout(hideTooltip, 100); // 약간의 딜레이 후 숨김
            }
        });

        // 날짜 클릭 이벤트 (선택 하이라이트 유지 및 툴팁 재표시)
        cell.addEventListener('click',()=>{
            document.querySelectorAll('.day-cell.selected').forEach(c=>c.classList.remove('selected'));
            cell.classList.add('selected');
            selectedDate=cellDate; 
            
            // 클릭 시에도 툴팁을 표시 (커서 유지 불필요)
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

// 테마 버튼
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

// 달력 이동
document.getElementById('prev-month').addEventListener('click',()=>{
    currentDate.setMonth(currentDate.getMonth()-1);
    renderCalendar(currentDate);
});
document.getElementById('next-month').addEventListener('click',()=>{
    currentDate.setMonth(currentDate.getMonth()+1);
    renderCalendar(currentDate);
});

// 모달 관련
addTodoBtn.addEventListener('click',()=>{
    modal.style.display='flex'; 
    todoDateInput.value=dateToKey(selectedDate);
    todoTextInput.value='';
    todoPrioritySelect.value='medium';
});
closeBtn.addEventListener('click',()=>modal.style.display='none');
window.addEventListener('click',e=>{if(e.target==modal) modal.style.display='none';});

// 할 일 저장
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
    
    // 할 일이 추가된 날짜가 현재 달에 있다면 캘린더 리렌더링 (점 표시 업데이트)
    const [y, m] = dateVal.split('-');
    if (Number(y) === currentDate.getFullYear() && Number(m) === currentDate.getMonth() + 1) {
        renderCalendar(currentDate);
    }
});


// --- 초기 실행 ---
renderCalendar(currentDate);
