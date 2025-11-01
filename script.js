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

// --- 캘린더 생성 기능 ---
function renderCalendar(date){
    calendarGrid.innerHTML='';
    const month=date.getMonth(), year=date.getFullYear();
    currentMonthYear.textContent=`${year}년 ${month+1}월`;

    // 1일의 요일 (0:일 ~ 6:토)
    const firstDay=new Date(year,month,1).getDay(); 
    // 이번 달의 총 일수
    const daysInMonth=new Date(year,month+1,0).getDate(); 
    const daysOfWeek=['일','월','화','수','목','금','토'];

    // 1. 요일 헤더 생성
    daysOfWeek.forEach((day,i)=>{
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

        // Date 객체를 생성하고 시간을 0으로 설정하여 날짜만 정확히 반영
        const cellDate=new Date(year,month,d);
        cellDate.setHours(0,0,0,0);
        const dateKey=dateToKey(cellDate);
        cell.dataset.date=dateKey;

        // 요일을 가져와 주말 색상 클래스 추가
        const dayOfWeek=cellDate.getDay();
        if(dayOfWeek===0) cell.classList.add('sunday'); // 일요일 (빨간색)
        if(dayOfWeek===6) cell.classList.add('saturday'); // 토요일 (파란색)

        if(todayKey===dateKey) cell.classList.add('today');
        if(dateToKey(selectedDate)===dateKey) cell.classList.add('selected');

        // 할 일 표시 점
        if(todos[dateKey] && todos[dateKey].length>0){
            const dot=document.createElement('div');
            dot.className='todo-dot';
            cell.appendChild(dot);
        }

        // 날짜 클릭 이벤트
        cell.addEventListener('click',()=>{
            document.querySelectorAll('.day-cell.selected').forEach(c=>c.classList.remove('selected'));
            cell.classList.add('selected');
            
            // 날짜만 정확히 업데이트 (시간대 문제 방지)
            selectedDate=cellDate; 
            renderTodos();
        });

        calendarGrid.appendChild(cell);
    }
}

// --- 투두리스트 렌더링 기능 ---
function renderTodos(){
    const todoList=document.getElementById('todo-list');
    const todoTitle=document.getElementById('todo-title');
    const todos=loadTodos();
    const dateKey=dateToKey(selectedDate);
    // 중요도: high > medium > low 순으로 정렬
    const dayTodos=todos[dateKey] ? todos[dateKey].sort((a,b) => {
        const order = { high: 3, medium: 2, low: 1 };
        return order[b.priority] - order[a.priority];
    }) : [];

    todoTitle.textContent=`${dateKey}의 할 일`;
    todoList.innerHTML='';

    if(dayTodos.length===0){
        todoList.innerHTML='<li>선택된 날짜에 할 일이 없습니다.</li>';
        return;
    }

    dayTodos.forEach(todo=>{
        const li=document.createElement('li');
        
        const checkbox=document.createElement('input');
        checkbox.type='checkbox';
        checkbox.checked=todo.completed;
        checkbox.addEventListener('change',()=>{
            todo.completed=checkbox.checked;
            saveTodos(todos);
            renderTodos();
        });

        const textSpan=document.createElement('span');
        textSpan.textContent=todo.text;
        if(todo.completed) textSpan.classList.add('completed');

        const prioritySpan=document.createElement('span');
        prioritySpan.textContent=todo.priority==='high'?'⭐⭐⭐':todo.priority==='medium'?'⭐⭐':'⭐';
        prioritySpan.style.marginLeft='5px';
        prioritySpan.style.flexShrink='0'; // 중요도가 줄어들지 않도록

        li.appendChild(checkbox);
        li.appendChild(textSpan);
        li.appendChild(prioritySpan);
        todoList.appendChild(li);
    });
}

// --- 이벤트 리스너 ---

// 테마 버튼
themeBtns.forEach(btn=>{
    btn.addEventListener('click',()=>{
        const theme = btn.dataset.theme;
        document.body.classList.remove('default','cute','calm','mono');
        document.body.classList.add(theme);
        saveTheme(theme); // 테마 저장
        renderCalendar(currentDate); // dot 색상 업데이트 위해 캘린더 리렌더링
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
    modal.style.display='flex'; // flex로 변경
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
    
    // 할 일이 추가된 날짜가 현재 달에 있다면 캘린더와 투두 리렌더링
    const [y, m] = dateVal.split('-');
    if (Number(y) === currentDate.getFullYear() && Number(m) === currentDate.getMonth() + 1) {
        renderCalendar(currentDate);
        if(dateVal === dateToKey(selectedDate)) {
            renderTodos();
        }
    }
});


// --- 초기 실행 ---
// 저장된 테마 로드
document.body.classList.add(loadTheme()); 
renderCalendar(currentDate);
renderTodos();
