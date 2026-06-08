(function(){
  const teamSelect = document.getElementById('teamSelect');
  const darkToggle = document.getElementById('darkToggle');
  const printBtn = document.getElementById('printBtn');
  const compactToggle = document.getElementById('compactToggle');
  const selectAll = document.getElementById('selectAll');
  const rowSelects = document.querySelectorAll('.row-select');
  const playerRows = document.querySelectorAll('.player-row');
  const bulkActions = document.getElementById('bulkActions');
  const selectedCount = document.getElementById('selectedCount');
  const bulkExport = document.getElementById('bulkExport');
  const bulkEdit = document.getElementById('bulkEdit');
  const bulkDelete = document.getElementById('bulkDelete');
  const root = document.documentElement;

  const TEAM_KEY = 'prototype-team';
  const DARK_KEY = 'prototype-dark';
  const COMPACT_KEY = 'prototype-compact';

  const teams = ['default', 'mi', 'csk', 'rcb', 'kkr'];

  // ===== Theme Management =====
  function applyTeam(team){
    if(team && team !== 'default'){
      root.setAttribute('data-team', team);
    } else {
      root.removeAttribute('data-team');
    }
    localStorage.setItem(TEAM_KEY, team);
  }

  function setDark(enabled){
    if(enabled){
      root.classList.add('dark');
      darkToggle.innerText = 'Light';
      darkToggle.setAttribute('aria-pressed','true');
    } else {
      root.classList.remove('dark');
      darkToggle.innerText = 'Dark';
      darkToggle.setAttribute('aria-pressed','false');
    }
    localStorage.setItem(DARK_KEY, enabled? '1' : '0');
  }

  function setCompact(enabled){
    if(enabled){
      document.body.classList.add('compact');
      compactToggle.classList.add('active');
      compactToggle.innerText = 'Expanded';
    } else {
      document.body.classList.remove('compact');
      compactToggle.classList.remove('active');
      compactToggle.innerText = 'Compact';
    }
    localStorage.setItem(COMPACT_KEY, enabled? '1' : '0');
  }

  // ===== Multi-Select Management =====
  function updateBulkActions(){
    const selected = Array.from(rowSelects).filter(cb => cb.checked);
    const hasSelection = selected.length > 0;
    
    bulkActions.style.display = hasSelection ? 'flex' : 'none';
    selectedCount.innerText = selected.length;
    selectAll.indeterminate = hasSelection && selected.length < rowSelects.length;
    selectAll.checked = selected.length === rowSelects.length;
    
    // Highlight selected rows
    playerRows.forEach((row, idx) => {
      if(rowSelects[idx].checked){
        row.classList.add('selected');
      } else {
        row.classList.remove('selected');
      }
    });
  }

  selectAll.addEventListener('change', (e) => {
    rowSelects.forEach(cb => cb.checked = e.target.checked);
    updateBulkActions();
  });

  rowSelects.forEach(cb => {
    cb.addEventListener('change', updateBulkActions);
  });

  // ===== Bulk Actions =====
  bulkExport.addEventListener('click', () => {
    const selected = Array.from(rowSelects)
      .map((cb, idx) => cb.checked ? playerRows[idx].dataset.id : null)
      .filter(Boolean);
    alert(`Export selected: ${selected.join(', ')}`);
  });

  bulkEdit.addEventListener('click', () => {
    const selected = Array.from(rowSelects)
      .map((cb, idx) => cb.checked ? playerRows[idx].dataset.id : null)
      .filter(Boolean);
    alert(`Edit selected: ${selected.join(', ')}`);
  });

  bulkDelete.addEventListener('click', () => {
    const selected = Array.from(rowSelects)
      .map((cb, idx) => cb.checked ? playerRows[idx].dataset.id : null)
      .filter(Boolean);
    if(confirm(`Delete ${selected.length} player(s)?`)){
      alert(`Deleted: ${selected.join(', ')}`);
      // In real app, would call API and remove rows
    }
  });

  // ===== Init from Storage =====
  (function init(){
    const savedTeam = localStorage.getItem(TEAM_KEY) || 'default';
    teamSelect.value = savedTeam;
    applyTeam(savedTeam);

    const savedDark = localStorage.getItem(DARK_KEY) === '1';
    setDark(savedDark);

    const savedCompact = localStorage.getItem(COMPACT_KEY) === '1';
    setCompact(savedCompact);
  })();

  // ===== Event Listeners =====
  teamSelect.addEventListener('change', (e) => applyTeam(e.target.value));

  darkToggle.addEventListener('click', () => {
    const isDark = root.classList.contains('dark');
    setDark(!isDark);
  });

  compactToggle.addEventListener('click', () => {
    const isCompact = document.body.classList.contains('compact');
    setCompact(!isCompact);
  });

  printBtn.addEventListener('click', () => window.print());

  // ===== Keyboard Shortcuts =====
  document.addEventListener('keydown', (e) => {
    if(e.target.tagName === 'INPUT') return; // Don't interfere with input focus
    if((e.key === 'D' || e.key === 'd') && e.ctrlKey){
      e.preventDefault();
      const isDark = root.classList.contains('dark');
      setDark(!isDark);
    }
    if((e.key === 'C' || e.key === 'c') && e.ctrlKey){
      e.preventDefault();
      const isCompact = document.body.classList.contains('compact');
      setCompact(!isCompact);
    }
  });
})();
