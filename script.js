// Photo Gallery Widget
(function() {
  // State
  let photos = [];
  let selectedPhoto = null;
  let galleryTitle = 'Photo Gallery';

  // DOM Elements
  const galleryTitleEl = document.getElementById('gallery-title');
  const editTitleBtn = document.getElementById('edit-title-btn');
  const titleEditForm = document.getElementById('title-edit-form');
  const titleInput = document.getElementById('title-input');
  const saveTitleBtn = document.getElementById('save-title-btn');
  const uploadBtn = document.getElementById('upload-btn');
  const fileInput = document.getElementById('file-input');
  const emptyState = document.getElementById('empty-state');
  const galleryGrid = document.getElementById('gallery-grid');
  const modal = document.getElementById('modal');
  const closeModalBtn = document.getElementById('close-modal');
  const modalImage = document.getElementById('modal-image');
  const modalCaption = document.getElementById('modal-caption');
  const modalLikeBtn = document.getElementById('modal-like-btn');
  const modalLikesCount = document.getElementById('modal-likes-count');
  const modalDeleteBtn = document.getElementById('modal-delete-btn');

  // Initialize
  function init() {
    loadFromStorage();
    renderGallery();
    bindEvents();
  }

  // Load data from localStorage
  function loadFromStorage() {
    const savedPhotos = localStorage.getItem('gallery-photos');
    if (savedPhotos) {
      photos = JSON.parse(savedPhotos);
    }
    const savedTitle = localStorage.getItem('gallery-title');
    if (savedTitle) {
      galleryTitle = savedTitle;
      galleryTitleEl.textContent = galleryTitle;
    }
  }

  // Save photos to localStorage
  function savePhotos() {
    localStorage.setItem('gallery-photos', JSON.stringify(photos));
  }

  // Bind event listeners
  function bindEvents() {
    // Title editing
    editTitleBtn.addEventListener('click', startEditingTitle);
    saveTitleBtn.addEventListener('click', saveTitle);
    titleInput.addEventListener('keydown', handleTitleKeyDown);
    titleInput.addEventListener('blur', saveTitle);

    // Upload
    uploadBtn.addEventListener('click', () => fileInput.click());
    emptyState.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', handleFileSelect);

    // Modal
    closeModalBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });
    modalCaption.addEventListener('input', handleCaptionChange);
    modalLikeBtn.addEventListener('click', handleModalLike);
    modalDeleteBtn.addEventListener('click', handleModalDelete);

    // Keyboard
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !modal.classList.contains('hidden')) {
        closeModal();
      }
    });
  }

  // Title editing functions
  function startEditingTitle() {
    titleInput.value = galleryTitle;
    galleryTitleEl.classList.add('hidden');
    editTitleBtn.classList.add('hidden');
    titleEditForm.classList.remove('hidden');
    titleInput.focus();
  }

  function saveTitle() {
    const newTitle = titleInput.value.trim() || 'Photo Gallery';
    galleryTitle = newTitle;
    galleryTitleEl.textContent = galleryTitle;
    localStorage.setItem('gallery-title', galleryTitle);
    
    titleEditForm.classList.add('hidden');
    galleryTitleEl.classList.remove('hidden');
    editTitleBtn.classList.remove('hidden');
  }

  function handleTitleKeyDown(e) {
    if (e.key === 'Enter') {
      saveTitle();
    } else if (e.key === 'Escape') {
      titleEditForm.classList.add('hidden');
      galleryTitleEl.classList.remove('hidden');
      editTitleBtn.classList.remove('hidden');
    }
  }

  // File upload
  function handleFileSelect(e) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const newPhoto = {
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          src: event.target.result,
          caption: '',
          likes: 0
        };
        photos.push(newPhoto);
        savePhotos();
        renderGallery();
      };
      reader.readAsDataURL(file);
    });

    fileInput.value = '';
  }

  // Render gallery
  function renderGallery() {
    if (photos.length === 0) {
      emptyState.classList.remove('hidden');
      galleryGrid.classList.add('hidden');
      return;
    }

    emptyState.classList.add('hidden');
    galleryGrid.classList.remove('hidden');

    galleryGrid.innerHTML = photos.map((photo) => `
      <div class="photo-card" data-id="${photo.id}">
        <img src="${photo.src}" alt="${photo.caption || 'Gallery photo'}">
        <div class="photo-caption-overlay">
          <p>${photo.caption ? truncateCaption(photo.caption) : 'No caption'}</p>
        </div>
        <button class="like-btn ${photo.likes > 0 ? 'liked' : ''}" data-id="${photo.id}">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="heart-icon">
            <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>
          </svg>
          <span>${photo.likes}</span>
        </button>
      </div>
    `).join('');

    // Bind photo card events
    galleryGrid.querySelectorAll('.photo-card').forEach((card) => {
      card.addEventListener('click', (e) => {
        if (!e.target.closest('.like-btn')) {
          const photoId = card.dataset.id;
          openModal(photoId);
        }
      });
    });

    // Bind like button events
    galleryGrid.querySelectorAll('.like-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const photoId = btn.dataset.id;
        handleLike(photoId);
      });
    });
  }

  // Truncate caption
  function truncateCaption(caption, maxLength = 40) {
    if (caption.length <= maxLength) return caption;
    return caption.slice(0, maxLength) + '...';
  }

  // Like functionality
  function handleLike(photoId) {
    const photo = photos.find(p => p.id === photoId);
    if (photo) {
      photo.likes += 1;
      savePhotos();
      renderGallery();
      
      if (selectedPhoto && selectedPhoto.id === photoId) {
        selectedPhoto.likes = photo.likes;
        updateModalLikes();
      }
    }
  }

  // Modal functions
  function openModal(photoId) {
    const photo = photos.find(p => p.id === photoId);
    if (!photo) return;

    selectedPhoto = photo;
    modalImage.src = photo.src;
    modalImage.alt = photo.caption || 'Photo preview';
    modalCaption.value = photo.caption;
    updateModalLikes();
    
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    modal.classList.add('hidden');
    selectedPhoto = null;
    document.body.style.overflow = '';
  }

  function updateModalLikes() {
    if (!selectedPhoto) return;
    modalLikesCount.textContent = `${selectedPhoto.likes} likes`;
    if (selectedPhoto.likes > 0) {
      modalLikeBtn.classList.add('liked');
    } else {
      modalLikeBtn.classList.remove('liked');
    }
  }

  function handleCaptionChange(e) {
    if (!selectedPhoto) return;
    const caption = e.target.value.slice(0, 60);
    selectedPhoto.caption = caption;
    
    const photo = photos.find(p => p.id === selectedPhoto.id);
    if (photo) {
      photo.caption = caption;
      savePhotos();
      renderGallery();
    }
  }

  function handleModalLike() {
    if (!selectedPhoto) return;
    handleLike(selectedPhoto.id);
  }

  function handleModalDelete() {
    if (!selectedPhoto) return;
    photos = photos.filter(p => p.id !== selectedPhoto.id);
    savePhotos();
    closeModal();
    renderGallery();
  }

  // Start the app
  init();
})();
