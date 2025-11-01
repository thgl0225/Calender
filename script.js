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

function dateToKey(date){
    const y=date.getFullYear(), m=date.getMonth()+1, d=date.getDate();
    return `${y}-${m<10?'0':''+m}-${d<10?'0':''+d}`;
}
function loadTodos(){ return JSON.parse(localStorage.getItem('todos'))||{}; }
function saveTodos(todos){ localStorage.setItem('todos', JSON.stringify(todos)); }

function renderCalendar(date){
    calendarGrid.innerHTML='';
    const month=date.getMonth(), year=date.getFullYear();
    currentMonthYear.textContent=`${year}년 ${month+1}월`;

    const firstDay=new Date(year,month,1).getDay();
    const daysInMonth=new Date(year,month+1,0).getDate();
    const daysOfWeek=['일','월','화','수','목','금','토'];

    daysOfWeek.forEach((day,i)=>{
        const h=document.createElement('div');
        h.className='day-cell header';
        h.textContent=day;
        if(i===0) h.classList.add('sunday');
        if(i===6) h.classList.add('saturday');
        calendarGrid.appendChild(h);
    });

    for(let i=0;i<firstDay;i++){
        const e=document.createElement('div');
        e.className='day-cell empty';
        calendarGrid.appendChild(e);
    }

    const todos=loadTodos();

    for(let d=1;d<=daysInMonth;d++){
        const cell=document.createElement('div');
        cell.className='day-cell';
        cell.textContent=d;

        const cellDate=new Date(year,month,d);
        const dateKey=dateToKey(cellDate);
        cell.dataset.date=dateKey;

        const dayOfWeek=cellDate.getDay();
        if(dayOfWeek===0) cell.style.color='red';
        if(dayOfWeek===6) cell.style.color='blue';

        if(dateToKey(new Date())===dateKey) cell.classList.add('today');
        if(dateToKey(selectedDate)===dateKey) cell.classList.add('selected');

        if(todos[dateKey] && todos[dateKey].length>0){
            const dot=document.createElement('div');
            dot.className='todo-dot';
            cell.appendChild(dot);
        }

        cell.addEventListener('click',()=>{
            document.querySelectorAll('.day-cell.selected').forEach(c=>c.classList.remove('selected'));
            cell.classList.add('selected');
            selectedDate=new Date(year,month,d);
            selectedDate.setHours(0,0,0,0);
            renderTodos();
        });

        calendarGrid.appendChild(cell);
    }
}

function renderTodos(){
    const todoList=document.getElementById('todo-list');
    const todoTitle=document.getElementById('todo-title');
    const todos=loadTodos();
    const dateKey=dateToKey(selectedDate);
    const dayTodos=todos[dateKey] || [];

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

        li.appendChild(checkbox);
        li.appendChild(textSpan);
        li.appendChild(prioritySpan);
        todoList.appendChild(li);
    });
}

addTodoBtn.addEventListener('click',()=>{
    modal.style.display='flex';
    todoDateInput.value=dateToKey(selectedDate);
    todoTextInput.value='';
    todoPrioritySelect.value='medium';
});
closeBtn.addEventListener('click',()=>modal.style.display='none');
window.addEventListener('click',e=>{if(e.target==modal) modal.style.display='none';});
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
    renderCalendar(currentDate);
    renderTodos();
});

themeBtns.forEach(btn=>{
    btn.addEventListener('click',()=>{
        document.body.classList.remove('default','cute','calm','mono');
        document.body.classList.add(btn.dataset.theme);
    });
});

document.getElementById('prev-month').addEventListener('click',()=>{
    currentDate.setMonth(currentDate.getMonth()-1);
    renderCalendar(currentDate);
});
document.getElementById('next-month').addEventListener('click',()=>{
    currentDate.setMonth(currentDate.getMonth()+1);
    renderCalendar(currentDate);
});

// 초기 실행
renderCalendar(currentDate);
renderTodos();
