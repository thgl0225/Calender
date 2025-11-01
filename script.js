const calendarGrid = document.getElementById('calendar-grid');
const calendarContainer = document.querySelector('.calendar-container'); // 캘린더 컨테이너 추가
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
    todoTooltip.dataset.date = ''; 
    // 팝업이 닫힐 때, 컨테이너의 position:relative 해제 (CSS에서 이미 처리했으므로 주석 처리)
    // calendarContainer.style.position = '';
}

/**
 * 특정 날짜의 투두리스트를 팝업에 렌더링하고 중앙에 표시합니다.
 * @param {string} dateKey - 'YYYY-MM-DD' 형식의 날짜 키
 */
function showTooltip(dateKey) {
    const todos = loadTodos();
    let dayTodos = todos[dateKey] || [];
    
    // 팝업이 이미 같은 날짜로 열려 있다면 닫기 (토글 기능)
    if (todoTooltip.classList.contains('visible') && todoTooltip.dataset.date === dateKey) {
        hideTooltip();
        return;
    }

    // 팝업 제목을 날짜만 간단하게 표시 (YYYY-MM-DD 형식)
    // 날짜 키에서 연도-월-일 정보만 사용
    todoTooltip.innerHTML = `<h5>${dateKey} <button id="close-tooltip-btn" style="float:right; border:none; background:none; cursor:pointer; color:#888;">✖</button></h5>`;
    todoTooltip.dataset.date = dateKey;

    // 할 일 정렬 (우선순위 높은 순)
    dayTodos.sort((a,b) => getPriorityOrder(b.priority) - getPriorityOrder(a.priority));


    // 할 일이 없을 경우, 빈칸으로 표시
    if (dayTodos.length > 0) {
        const ul = document.createElement('ul');
        
        dayTodos.forEach((todo, index) => {
            const li = document.createElement('li');
            
            const infoDiv = document.createElement('div');
            infoDiv.className = 'todo-info';

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.checked = todo.completed;
            
            const textSpan = document.createElement('span');
            textSpan.textContent = todo.text;
            textSpan.className = 'todo-text'; 
            if (todo.completed) textSpan.classList.add('completed');
            
            const prioritySpan = document.createElement('span');
            prioritySpan.className = 'priority';
            prioritySpan.textContent = todo.priority === 'high' ? '⭐⭐⭐' : todo.priority === 'medium' ? '⭐⭐' : '⭐';

            // --- 체크박스 클릭 이벤트 리스너 (팝업 유지) ---
            checkbox.addEventListener('change', (e) => {
                // 1. 데이터 업데이트 및 저장
                todos[dateKey][index].completed = e.target.checked;
                saveTodos(todos);
                
                // 2. UI만 직접 업데이트 (팝업 닫힘 방지)
                if (e.target.checked) {
                    textSpan.classList.add('completed');
                } else {
                    textSpan.classList.remove('completed');
                }
                
                // 3. 캘린더 점 업데이트를 위해 리렌더링 (팝업은 계속 떠있음)
                renderCalendar(currentDate); 
            });


            // --- 삭제 버튼 추가 ---
            const deleteBtn = document.createElement('button');
            deleteBtn.textContent = '✖';
            deleteBtn.style.color = 'red';
            deleteBtn.style.padding = '0';
            deleteBtn.style.fontSize = '0.9em';
            
            // 삭제 버튼 클릭 이벤트 리스너 (삭제 후 팝업 갱신)
            deleteBtn.addEventListener('click', () => {
                todos[dateKey].splice(index, 1);
                
                // 배열이 비었으면 키 삭제
                if (todos[dateKey].length === 0) {
                    delete todos[dateKey];
                }
                
                saveTodos(todos);
                
                // 삭제 후 팝업 내용 및 캘린더 업데이트 (재정렬 포함)
                showTooltip(dateKey); // 재귀 호출하여 업데이트
                renderCalendar(currentDate); 
            });

            infoDiv.appendChild(checkbox);
            infoDiv.appendChild(textSpan);
            infoDiv.appendChild(prioritySpan);

            li.appendChild(infoDiv);
            li.appendChild(deleteBtn);
            ul.appendChild(li);
        });
        todoTooltip.appendChild(ul);
    }
    
    // 팝업 닫기 버튼 이벤트 연결
    document.getElementById('close-tooltip-btn').addEventListener('click', hideTooltip);

    // 팝업을 표시하고 보이게 설정
    // CSS에서 position: absolute, top: 50%, left: 50%, transform: translate(-50%, -50%)를 사용하여
    // 캘린더 컨테이너 중앙에 위치하도록 이미 처리했습니다.
    todoTooltip.style.display = 'block';
    todoTooltip.classList.add('visible');
}


// --- 캘린더 생성 기능 ---
function renderCalendar(date){
    calendarGrid.innerHTML='';

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
    const today=new Date();
    today.setHours(0,0,0,0);
    const todayKey=dateToKey(today);

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

        // 🌟 테마별 색상 적용을 위한 'today' 클래스 추가
        if(todayKey===dateKey) cell.classList.add('today');
        
        if(dateToKey(selectedDate)===dateKey) cell.classList.add('selected');

        // 할 일 표시 점 (하나라도 미완료가 있으면 점 표시)
        if(todos[dateKey] && todos[dateKey].length > 0){
             // 미완료 할 일이 있는지 확인
            const hasIncomplete = todos[dateKey].some(todo => !todo.completed);
            if (hasIncomplete) {
                const dot=document.createElement('div');
                dot.className='todo-dot';
                cell.appendChild(dot);
            }
        }

        // --- 날짜 클릭 이벤트 (선택 및 팝업 토글) ---
        cell.addEventListener('click',()=>{
            // 1. 기존 선택 하이라이트 제거
            document.querySelectorAll('.day-cell.selected').forEach(c=>c.classList.remove('selected'));
            
            // 2. 새 날짜 선택 및 업데이트
            cell.classList.add('selected');
            selectedDate=cellDate; 
            
            // 3. 팝업 토글 로직
            if (!cell.classList.contains('empty')) {
                 showTooltip(dateKey); // 팝업 토글
            }
        });
        
        calendarGrid.appendChild(cell);
    }
}


// --- 전역 클릭 이벤트 (팝업 닫기) ---
document.addEventListener('click', (e) => {
    // 팝업, 모달, 날짜 셀 어디에도 속하지 않는 곳을 클릭했을 때 팝업 닫기
    if (!e.target.closest('#todo-tooltip') && 
        !e.target.closest('#add-todo-modal') &&
        !e.target.closest('.day-cell')) {
        hideTooltip();
    }
});


// --- 이벤트 리스너 ---

// 테마 버튼
document.body.classList.add(loadTheme()); 
themeBtns.forEach(btn=>{
    btn.addEventListener('click',()=>{
        const theme = btn.dataset.theme;
        document.body.classList.remove('default','cute','calm','mono');
        document.body.classList.add(theme);
        saveTheme(theme);
        
        // 테마 변경 시 캘린더 리렌더링 (오늘 날짜 색상 적용을 위해)
        renderCalendar(currentDate); 
    });
});

// 달력 이동
document.getElementById('prev-month').addEventListener('click',()=>{
    currentDate.setMonth(currentDate.getMonth()-1);
    renderCalendar(currentDate);
    hideTooltip(); // 달 이동 시 팝업 닫기
});
document.getElementById('next-month').addEventListener('click',()=>{
    currentDate.setMonth(currentDate.getMonth()+1);
    renderCalendar(currentDate);
    hideTooltip(); // 달 이동 시 팝업 닫기
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
    
    const [y, m] = dateVal.split('-').map(Number);
    // 현재 달력과 저장된 날짜가 같으면 리렌더링
    if (y === currentDate.getFullYear() && m === currentDate.getMonth() + 1) {
        renderCalendar(currentDate);
        // 저장한 날짜가 선택된 날짜와 같으면 팝업 갱신
        if (dateVal === dateToKey(selectedDate)) {
             showTooltip(dateVal);
        }
    }
});


// --- 초기 실행 ---
renderCalendar(currentDate);
