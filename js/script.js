    // ключ: 'YYYY-MM-DD' -> массив событий
    const events = {
      "2025-08-22": [
        { time: "10:00", title: "Планёрка", location: "Конф. комната", desc: "Итоги недели" }
      ],
      "2025-08-21": [
        { time: "13:00", title: "Демо релиза", location: "Zoom", desc: "Показ фич" }
      ],
      "2025-08-21": [
        { time: "10:00", title: "Совещание по релизу", location: "Конференц-зал 2", desc: "Обсуждаем план выката" },
        { time: "15:30", title: "Звонок с клиентом", location: "Zoom", desc: "Демка новой фичи" }
      ]
    };

    // ====== Локализация ======
    const MONTHS = ["Январь","Февраль","Март","Апрель","Май","Июнь","Июль","Август","Сентябрь","Октябрь","Ноябрь","Декабрь"];
    const MONTHS_SHORT = ["Янв","Фев","Мар","Апр","Май","Июн","Июл","Авг","Сен","Окт","Ноя","Дек"];
    const WEEKDAYS = ["Пн","Вт","Ср","Чт","Пт","Сб","Вс"];

    const fmtFull = new Intl.DateTimeFormat("ru-RU", { day:"numeric", month:"long", year:"numeric" });

    const pad = (n) => String(n).padStart(2, "0");
    const keyFromDate = (d) => d.getFullYear() + "-" + pad(d.getMonth()+1) + "-" + pad(d.getDate());
    const mondayIndex = (jsDay) => (jsDay + 6) % 7;
    const isSameDay = (a,b) => a.getFullYear()===b.getFullYear() && a.getMonth()===b.getMonth() && a.getDate()===b.getDate();

    const sortByTime = (arr) => [...arr].sort((a,b)=>{
      const ta = (a.time||"99:99").split(":").map(Number);
      const tb = (b.time||"99:99").split(":").map(Number);
      return (ta[0]*60+ta[1]) - (tb[0]*60+tb[1]);
    });

    const today = new Date();
    let state = {
      y: today.getFullYear(),
      m: today.getMonth(),
      selected: new Date(today.getFullYear(), today.getMonth(), today.getDate())
    };

    // ====== ЭЛЕМЕНТЫ ======
    const elYear = document.getElementById("yearLabel");
    const elMonths = document.getElementById("monthsList");
    const elMonthName = document.getElementById("monthName");
    const elWeekdays = document.getElementById("weekdays");
    const elDays = document.getElementById("daysGrid");
    const elSelLabel = document.getElementById("selectedDateLabel");
    const elEvents = document.getElementById("eventsPanel");

    // ====== РЕНДЕР МЕСЯЦЕВ В САЙДБАРЕ ======
    function renderMonths(){
      elMonths.innerHTML = "";
      MONTHS.forEach((name, idx)=>{
        const li = document.createElement("li");
        li.textContent = name;
        li.dataset.month = idx;
        if(idx === state.m) li.classList.add("active");
        
        // Подсветка текущего месяца текущего года (более светлая, чем выбранный)
        if(state.y === today.getFullYear() && idx === today.getMonth()){
          li.classList.add("current-year-month");
        }
li.addEventListener("click", ()=>{
          state.m = idx;
          // скорректируем выбранный день, если он больше кол-ва дней в новом месяце
          const last = new Date(state.y, state.m+1, 0).getDate();
          state.selected.setMonth(state.m);
          if(state.selected.getDate() > last) state.selected.setDate(last);
          updateAll();
        });
        elMonths.appendChild(li);
      });
    }

    // ====== РЕНДЕР ДНЕЙ НЕДЕЛИ ======
    function renderWeekdays(){
      elWeekdays.innerHTML = "";
      WEEKDAYS.forEach(w => {
        const div = document.createElement("div");
        div.style.textAlign = "center";
        div.textContent = w;
        elWeekdays.appendChild(div);
      });
    }

    // ====== РЕНДЕР КАЛЕНДАРЯ ======
    function renderCalendar(){
      const { y, m } = state;
      elYear.textContent = y;
      elMonthName.textContent = MONTHS[m].toUpperCase();

      // обновить активный месяц в сайдбаре
      elMonths.querySelectorAll("li").forEach((li,i)=>{
        li.classList.toggle("active", i===m);
      });

      elDays.innerHTML = "";

      const first = new Date(y, m, 1);
      const startIdx = mondayIndex(first.getDay()); // 0..6 (Пн..Вс)
      const daysInMonth = new Date(y, m+1, 0).getDate();

      // пустые ячейки до первого дня
      for(let i=0;i<startIdx;i++){
        const empty = document.createElement("div");
        empty.className = "day empty";
        elDays.appendChild(empty);
      }

      // сами дни месяца
      for(let d=1; d<=daysInMonth; d++){
        const date = new Date(y, m, d);
        const cell = document.createElement("button");
        cell.className = "day";
        cell.textContent = d;

        // выходные
        const wday = mondayIndex(date.getDay());
        if(wday >= 5) cell.classList.add("weekend");

        // сегодня
        if(isSameDay(date, today)) cell.classList.add("today");

        // выбранный
        if(isSameDay(date, state.selected)) cell.classList.add("picked");

        // события
        const key = keyFromDate(date);
        if((events[key]||[]).length > 0) cell.classList.add("special");

        cell.addEventListener("click", ()=>{
          state.selected = new Date(date);
          renderCalendar();
          renderSelected();
          if (window.matchMedia("(max-width: 900px)").matches) {
            document.querySelector(".info").scrollIntoView({behavior:"smooth"});
          }
        });

        elDays.appendChild(cell);
      }

      // добиваем сетку до кратности 7 (эстетика)
      const rem = (startIdx + daysInMonth) % 7;
      if(rem !== 0){
        for(let i=0;i<7-rem;i++){
          const empty = document.createElement("div");
          empty.className = "day empty";
          elDays.appendChild(empty);
        }
      }
    }

    // ====== РЕНДЕР ПРАВОЙ ПАНЕЛИ ======
    function renderSelected(){
      const d = state.selected;
      const parts = fmtFull.formatToParts(d).reduce((acc, p)=>{ acc[p.type]=p.value; return acc; },{});
      // Пример: "16 июля 2024 г." -> "ИЮЛЬ 16, 2024"
      const monthUpper = MONTHS[d.getMonth()].toUpperCase();
      elSelLabel.textContent = `${monthUpper} ${parts.day}, ${parts.year}`;

      const key = keyFromDate(d);
      const list = events[key] ? sortByTime(events[key]) : [];

      elEvents.innerHTML = "";
      if(list.length === 0){
        const card = document.createElement("div");
        card.className = "info-card";
        const t = document.createElement("div");
        t.className = "info-card-title";
        t.textContent = "На этот день событий не запланировано";
        const m = document.createElement("div");
        m.className = "muted";
        m.textContent = "";
        card.appendChild(t); card.appendChild(m);
        elEvents.appendChild(card);
        return;
      }

      list.forEach(ev=>{
        const card = document.createElement("div");
        card.className = "info-card";
        const title = document.createElement("div");
        title.className = "info-card-title";
        title.textContent = (ev.time ? ev.time + " • " : "") + (ev.title || "Событие");
        const meta = document.createElement("div");
        meta.className = "muted";
        meta.textContent = [ev.location, ev.desc].filter(Boolean).join(" • ");
        card.appendChild(title); card.appendChild(meta);
        elEvents.appendChild(card);
      });
    }

    // ====== НАВИГАЦИЯ ======
    function prevYear(){ state.y -= 1; snapSelectedIntoMonth(); updateAll(); }
    function nextYear(){ state.y += 1; snapSelectedIntoMonth(); updateAll(); }

    function snapSelectedIntoMonth(){
      const last = new Date(state.y, state.m+1, 0).getDate();
      if(state.selected.getFullYear()!==state.y || state.selected.getMonth()!==state.m){
        state.selected = new Date(state.y, state.m, Math.min(state.selected.getDate(), last));
      }
    }

    document.querySelectorAll(".year-btn").forEach(btn => {
      const act = btn.dataset.action;
      btn.addEventListener("click", ({shiftKey})=>{
        if(act==="prevYear") prevYear();
        else if(act==="nextYear") nextYear();
      });
    });

    // ====== API ======
    window.CalendarAPI = {
      addEvent(dateKey, eventObj){
        if(!events[dateKey]) events[dateKey] = [];
        events[dateKey].push(eventObj);
        if(keyFromDate(state.selected) === dateKey) renderSelected();
        renderCalendar();
      },
      removeEvents(dateKey){ delete events[dateKey]; renderCalendar(); if(keyFromDate(state.selected)===dateKey) renderSelected(); },
      getEvents(dateKey){ return (events[dateKey]||[]).slice(); },
      goto(y, m /*0..11*/){ state.y = y; state.m = m; snapSelectedIntoMonth(); updateAll(); },
      select(dateKey){ const [Y,M,D] = dateKey.split("-").map(Number); state.selected = new Date(Y, M-1, D); updateAll(); }
    };

    function updateAll(){ renderMonths(); renderCalendar(); renderSelected(); }

    // init
    renderMonths();
    renderWeekdays();
    renderCalendar();
    renderSelected();
