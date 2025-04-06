
const API_KEY = 'AIzaSyC9GDI966bO1QI_J4yENCDbyuvmpb2-UeM';
const CHANNEL_ID = 'UC1HzczR6Ct-mPEDmb1lgb-w';
const videosPerLoad = 12;
let nextPageToken = '';
let isLoading = false;
let searchQuery = '';

const videoGrid = document.querySelector('.video-grid');
const loadingSpinner = document.querySelector('.loading-spinner');
const searchInput = document.getElementById('search-input');
const searchBtn = document.getElementById('search-btn');
const subscriberCounter = document.querySelector('.counter');

document.addEventListener('DOMContentLoaded', () => {
    setupModal();
    setupInfiniteScroll();
    loadChannelStats();
    loadVideos();
    
    searchBtn.addEventListener('click', () => {
        searchQuery = searchInput.value.trim();
        videoGrid.innerHTML = '';
        nextPageToken = '';
        loadVideos();
    });
    
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            searchQuery = searchInput.value.trim();
            videoGrid.innerHTML = '';
            nextPageToken = '';
            loadVideos();
        }
    });
});

async function loadChannelStats() {
    try {
        const response = await fetch(`https://www.googleapis.com/youtube/v3/channels?key=${API_KEY}&id=${CHANNEL_ID}&part=statistics`);
        const data = await response.json();
        
        if (data.items && data.items.length > 0) {
            const subs = parseInt(data.items[0].statistics.subscriberCount);
            animateCounter(subs);
        }
    } catch (error) {
        console.error('Error loading channel stats:', error);
        subscriberCounter.textContent = '124K';
    }
}

function animateCounter(target) {
    const duration = 2000;
    const start = 0;
    const increment = target / (duration / 16);
    let current = start;
    
    const updateCounter = () => {
        current += increment;
        if (current < target) {
            subscriberCounter.textContent = Math.floor(current).toLocaleString();
            requestAnimationFrame(updateCounter);
        } else {
            subscriberCounter.textContent = target.toLocaleString();
        }
    };
    
    updateCounter();
}

async function loadVideos() {
    if (isLoading) return;
    
    isLoading = true;
    loadingSpinner.style.display = 'flex';
    
    try {
        let url = `https://www.googleapis.com/youtube/v3/search?key=${API_KEY}&channelId=${CHANNEL_ID}&part=snippet,id&order=date&maxResults=${videosPerLoad}`;
        
        if (nextPageToken) {
            url += `&pageToken=${nextPageToken}`;
        }
        
        if (searchQuery) {
            url += `&q=${encodeURIComponent(searchQuery)}`;
        }
        
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.items && data.items.length > 0) {
            nextPageToken = data.nextPageToken || '';
            
            const videoItems = data.items.filter(item => item.id.kind === 'youtube#video');
            
            if (videoItems.length === 0 && videoGrid.children.length === 0) {
                showNoResults();
            } else {
                videoItems.forEach((video, index) => {
                    createVideoCard({
                        id: video.id.videoId,
                        title: video.snippet.title,
                        description: video.snippet.description,
                        thumbnail: video.snippet.thumbnails.high.url,
                        date: formatDate(video.snippet.publishedAt)
                    }, index);
                });
            }
        } else if (videoGrid.children.length === 0) {
            showNoResults();
        }
    } catch (error) {
        console.error('Error loading videos:', error);
        if (videoGrid.children.length === 0) {
            showNoResults();
        }
    } finally {
        isLoading = false;
        loadingSpinner.style.display = 'none';
    }
}

function formatDate(publishedAt) {
    const date = new Date(publishedAt);
    const now = new Date();
    const diffInDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    
    if (diffInDays < 1) return 'Today';
    if (diffInDays < 2) return 'Yesterday';
    if (diffInDays < 7) return `${diffInDays} days ago`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
    if (diffInDays < 365) return `${Math.floor(diffInDays / 30)} months ago`;
    return `${Math.floor(diffInDays / 365)} years ago`;
}

function createVideoCard(video, index) {
    const videoCard = document.createElement('div');
    videoCard.className = 'video-card';
    videoCard.style.animationDelay = `${index * 0.1}s`;
    videoCard.style.opacity = '0';
    
    videoCard.innerHTML = `
        <div class="thumbnail">
            <img src="${video.thumbnail}" alt="${video.title}" loading="lazy">
        </div>
        <div class="video-info">
            <h3 class="video-title">${video.title}</h3>
            <p class="video-meta">${video.date}</p>
        </div>
    `;
    
    videoCard.addEventListener('click', () => openModal(video));
    videoGrid.appendChild(videoCard);
    
    setTimeout(() => {
        videoCard.style.opacity = '1';
        videoCard.style.transform = 'translateY(0)';
    }, 50);
}

function showNoResults() {
    videoGrid.innerHTML = `
        <div class="no-results">
            <i class="fas fa-video-slash" style="font-size: 40px; margin-bottom: 15px;"></i>
            <p>No videos found${searchQuery ? ` for "${searchQuery}"` : ''}</p>
        </div>
    `;
}

function setupInfiniteScroll() {
    window.addEventListener('scroll', () => {
        if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 500) {
            loadVideos();
        }
    });
}

function setupModal() {
    const modal = document.querySelector('.video-modal');
    const closeModal = document.querySelector('.close-modal');
    const videoPlayer = document.querySelector('.video-player');
    
    closeModal.addEventListener('click', () => {
        modal.style.display = 'none';
        videoPlayer.innerHTML = '';
    });
    
    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
            videoPlayer.innerHTML = '';
        }
    });
}

function openModal(video) {
    const modal = document.querySelector('.video-modal');
    const videoPlayer = document.querySelector('.video-player');
    const videoDetails = document.querySelector('.video-details');
    
    videoPlayer.innerHTML = `
        <div class="player-overlay"></div>
        <iframe src="https://www.youtube.com/embed/${video.id}?autoplay=1" 
                frameborder="0" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                allowfullscreen></iframe>
    `;
    
    videoDetails.innerHTML = `
        <h2>${video.title}</h2>
        <div class="video-description">${video.description}</div>
    `;
    
    modal.style.display = 'block';
    
    modal.querySelector('.modal-content').classList.add('animate-in');
    setTimeout(() => {
        modal.querySelector('.modal-content').classList.remove('animate-in');
    }, 600);
}

document.addEventListener('mousemove', (e) => {
    const cards = document.querySelectorAll('.video-card');
    cards.forEach(card => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        card.style.setProperty('--mouse-x', `${x}px`);
        card.style.setProperty('--mouse-y', `${y}px`);
    });
});