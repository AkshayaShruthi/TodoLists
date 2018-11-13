var cacheName = 'ToDo-1.3';
var dataCacheName = 'ToDo-userData-1';
var filesToCache = [
    '/images/checkBox.png',
    '/images/checkedBox.png',
    '/images/delete.jpg',
    '/images/home.png',
    '/images/icon.png',
    '/images/leftPull.png',
    '/images/plus.png',
    '/images/profile.png',
    '/images/refresh.png',
    '/images/tick.png',
    '/images/tilesTheme.png',
    '/images/trashbin.jpg',
    '/',
    '/index.html',
    '/scripts/common.js',
    '/scripts/mainpage.js',
    '/scripts/todo.js',
    '/styles/themes/common.css',
    '/shell/login.html',
    '/home.html',
    '/shell/noTodos.html',
    
  ];

self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(cacheName).then(function(cache) {
      return cache.addAll(filesToCache);
    })
  );
});

self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keyList) {
      return Promise.all(keyList.map(function(key) {
        if (key !== cacheName && key!==dataCacheName) {
          return caches.delete(key);
        }
      }));
    })
  );
  return self.clients.claim();
  });


  self.addEventListener('fetch', function(e) {
    if(filesToCache.includes(e.request)) {
      e.respondWith(
        caches.match(e.request).then(function(response) {
          return response || fetch(e.request);
        })
      );
    } else {
      e.respondWith(
        caches.match(e.request).then(function(response) {
          return response || fetch(e.request);
        })
      );
    }
    
  });
