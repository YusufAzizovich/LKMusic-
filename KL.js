const fileInput = document.getElementById('fileInput');
const audioPlayer = document.getElementById('audioPlayer');
const playlistEl = document.getElementById('playlist');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');

let playlist = [];
let currentIndex = 0;
let db;

// --- Инициализация IndexedDB ---
const request = indexedDB.open('offlineMusicDB', 1);
request.onupgradeneeded = function(event) {
  db = event.target.result;
  const store = db.createObjectStore('tracks', { keyPath: 'id', autoIncrement:true });
  store.createIndex('name', 'name', { unique:false });
};
request.onsuccess = function(event) {
  db = event.target.result;
  loadPlaylist();
};
request.onerror = function(event) {
  console.error('IndexedDB error:', event.target.errorCode);
};

// --- Загрузка плейлиста ---
function loadPlaylist() {
  const transaction = db.transaction(['tracks'], 'readonly');
  const store = transaction.objectStore('tracks');
  const getAll = store.getAll();
  getAll.onsuccess = function() {
    playlist = getAll.result.map(track => ({
      id: track.id,
      name: track.name,
      blob: track.blob,
      url: URL.createObjectURL(track.blob)
    }));
    renderPlaylist();
    if(playlist.length>0){ currentIndex=0; playTrack(); }
  };
}

// --- Сохранение трека в IndexedDB ---
function saveTrack(file) {
  const transaction = db.transaction(['tracks'], 'readwrite');
  const store = transaction.objectStore('tracks');
  store.add({ name:file.name, blob:file });
}

// --- Отрисовка плейлиста ---
function renderPlaylist() {
  playlistEl.innerHTML = '';
  playlist.forEach((track,index)=>{
    const li = document.createElement('li');
    li.textContent = track.name;
    if(index===currentIndex) li.classList.add('active');
    li.addEventListener('click',()=>{ currentIndex=index; playTrack(); });
    playlistEl.appendChild(li);
  });
}

// --- Воспроизведение трека ---
function playTrack(){
  if(playlist.length===0) return;
  const track = playlist[currentIndex];
  audioPlayer.src = track.url;
  audioPlayer.play();
  renderPlaylist();
}

// --- События ---
fileInput.addEventListener('change', function(){
  const files = Array.from(this.files);
  files.forEach(file=>{
    saveTrack(file);
    const objectURL = URL.createObjectURL(file);
    playlist.push({ id:null, name:file.name, blob:file, url:objectURL });
  });
  renderPlaylist();
  if(playlist.length===files.length) currentIndex=0;
  playTrack();
});

prevBtn.addEventListener('click',()=>{ 
  if(playlist.length===0) return; 
  currentIndex=(currentIndex-1+playlist.length)%playlist.length; 
  playTrack(); 
});
nextBtn.addEventListener('click',()=>{ 
  if(playlist.length===0) return; 
  currentIndex=(currentIndex+1)%playlist.length; 
  playTrack(); 
});
audioPlayer.addEventListener('ended',()=>{ 
  currentIndex=(currentIndex+1)%playlist.length; 
  playTrack(); 
});