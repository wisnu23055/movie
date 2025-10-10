const { SUPABASE_URL, SUPABASE_ANON_KEY, OMDB_API_KEY } = window.CONFIG;

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const dom = {
  // Auth elements
  authSection: document.getElementById('authSection'),
  loginForm: document.getElementById('loginForm'),
  userInfo: document.getElementById('userInfo'),
  emailInput: document.getElementById('emailInput'),
  passwordInput: document.getElementById('passwordInput'),
  loginBtn: document.getElementById('loginBtn'),
  registerBtn: document.getElementById('registerBtn'),
  logoutBtn: document.getElementById('logoutBtn'),
  userEmail: document.getElementById('userEmail'),
  authMessage: document.getElementById('authMessage'),
  confirmationMessage: document.getElementById('confirmationMessage'),
  resendBtn: document.getElementById('resendBtn'),
  
  // Main app elements
  mainContent: document.getElementById('mainContent'),
  searchForm: document.getElementById('searchForm'),
  searchInput: document.getElementById('searchInput'),
  resultsList: document.getElementById('resultsList'),
  watchlist: document.getElementById('watchlist')
};

let currentUser = null;
let pendingConfirmationEmail = null;

// Utility function untuk menampilkan pesan
function showAuthMessage(message, type = 'info') {
  console.log('Showing auth message:', message, type);
  if (dom.authMessage) {
    dom.authMessage.textContent = message;
    dom.authMessage.className = `auth-message ${type}`;
    dom.authMessage.style.display = 'block';
    
    // Auto hide after 5 seconds
    setTimeout(() => {
      dom.authMessage.style.display = 'none';
    }, 5000);
  }
}

function hideAuthMessage() {
  if (dom.authMessage) {
    dom.authMessage.style.display = 'none';
  }
}

function showConfirmationMessage(email) {
  console.log('Showing confirmation message for:', email);
  pendingConfirmationEmail = email;
  if (dom.confirmationMessage) {
    dom.confirmationMessage.style.display = 'block';
  }
}

function hideConfirmationMessage() {
  pendingConfirmationEmail = null;
  if (dom.confirmationMessage) {
    dom.confirmationMessage.style.display = 'none';
  }
}

// Auth functions
async function handleLogin() {
  console.log('Login button clicked');
  
  try {
    const email = dom.emailInput?.value?.trim();
    const password = dom.passwordInput?.value;
    
    console.log('Login attempt with email:', email);
    
    if (!email || !password) {
      showAuthMessage('Email dan password harus diisi', 'error');
      return;
    }
    
    hideAuthMessage();
    
    if (dom.loginBtn) {
      dom.loginBtn.textContent = 'Loading...';
      dom.loginBtn.disabled = true;
    }
    
    console.log('Calling supabase.auth.signInWithPassword...');
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    console.log('Login response:', { data, error });
    
    if (dom.loginBtn) {
      dom.loginBtn.textContent = 'Login';
      dom.loginBtn.disabled = false;
    }
    
    if (error) {
      console.error('Login error:', error);
      if (error.message.includes('Email not confirmed')) {
        showAuthMessage('Email belum dikonfirmasi. Silakan cek inbox email Anda.', 'error');
        showConfirmationMessage(email);
      } else if (error.message.includes('Invalid login credentials')) {
        showAuthMessage('Email atau password salah', 'error');
      } else {
        showAuthMessage('Login gagal: ' + error.message, 'error');
      }
    } else {
      showAuthMessage('Login berhasil!', 'success');
      hideConfirmationMessage();
      if (dom.emailInput) dom.emailInput.value = '';
      if (dom.passwordInput) dom.passwordInput.value = '';
    }
  } catch (err) {
    console.error('Unexpected error in handleLogin:', err);
    showAuthMessage('Terjadi kesalahan: ' + err.message, 'error');
    if (dom.loginBtn) {
      dom.loginBtn.textContent = 'Login';
      dom.loginBtn.disabled = false;
    }
  }
}

async function handleRegister() {
  console.log('Register button clicked');
  
  try {
    const email = dom.emailInput?.value?.trim();
    const password = dom.passwordInput?.value;
    
    console.log('Register attempt with email:', email);
    
    if (!email || !password) {
      showAuthMessage('Email dan password harus diisi', 'error');
      return;
    }
    
    if (password.length < 6) {
      showAuthMessage('Password minimal 6 karakter', 'error');
      return;
    }
    
    // Validasi email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      showAuthMessage('Format email tidak valid', 'error');
      return;
    }
    
    hideAuthMessage();
    
    if (dom.registerBtn) {
      dom.registerBtn.textContent = 'Loading...';
      dom.registerBtn.disabled = true;
    }
    
    console.log('Calling supabase.auth.signUp...');
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}${window.location.pathname}`,
        // Atau jika di root: emailRedirectTo: `${window.location.origin}/index.html`,
        data: {
          app_name: 'Movie Watchlist'
        }
      }
    });
    
    console.log('Register response:', { data, error });
    
    if (dom.registerBtn) {
      dom.registerBtn.textContent = 'Register';
      dom.registerBtn.disabled = false;
    }
    
    if (error) {
      console.error('Register error:', error);
      if (error.message.includes('User already registered')) {
        showAuthMessage('Email sudah terdaftar. Silakan login atau gunakan email lain.', 'error');
      } else {
        showAuthMessage('Register gagal: ' + error.message, 'error');
      }
    } else {
      showAuthMessage('Register berhasil! Email konfirmasi telah dikirim.', 'success');
      showConfirmationMessage(email);
      if (dom.emailInput) dom.emailInput.value = '';
      if (dom.passwordInput) dom.passwordInput.value = '';
    }
  } catch (err) {
    console.error('Unexpected error in handleRegister:', err);
    showAuthMessage('Terjadi kesalahan: ' + err.message, 'error');
    if (dom.registerBtn) {
      dom.registerBtn.textContent = 'Register';
      dom.registerBtn.disabled = false;
    }
  }
}

async function handleResendConfirmation() {
  console.log('Resend button clicked');
  
  if (!pendingConfirmationEmail) return;
  
  try {
    if (dom.resendBtn) {
      dom.resendBtn.textContent = 'Mengirim...';
      dom.resendBtn.disabled = true;
    }
    
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: pendingConfirmationEmail,
      options: {
        emailRedirectTo: window.location.origin
      }
    });
    
    if (dom.resendBtn) {
      dom.resendBtn.textContent = 'Kirim ulang';
      dom.resendBtn.disabled = false;
    }
    
    if (error) {
      console.error('Resend error:', error);
      showAuthMessage('Gagal mengirim ulang email: ' + error.message, 'error');
    } else {
      showAuthMessage('Email konfirmasi berhasil dikirim ulang!', 'success');
    }
  } catch (err) {
    console.error('Unexpected error in handleResendConfirmation:', err);
    showAuthMessage('Terjadi kesalahan: ' + err.message, 'error');
    if (dom.resendBtn) {
      dom.resendBtn.textContent = 'Kirim ulang';
      dom.resendBtn.disabled = false;
    }
  }
}

async function handleLogout() {
  console.log('Logout button clicked');
  
  try {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Logout error:', error);
      showAuthMessage('Logout gagal: ' + error.message, 'error');
    } else {
      showAuthMessage('Logout berhasil!', 'success');
      hideConfirmationMessage();
    }
  } catch (err) {
    console.error('Unexpected error in handleLogout:', err);
    showAuthMessage('Terjadi kesalahan: ' + err.message, 'error');
  }
}

function updateAuthUI(user) {
  console.log('Updating auth UI for user:', user);
  
  const heroSection = document.getElementById('heroSection');
  const featuredSection = document.getElementById('featuredSection');
  
  if (user) {
    currentUser = user;
    if (dom.loginForm) dom.loginForm.style.display = 'none';
    if (dom.userInfo) dom.userInfo.style.display = 'flex';
    if (dom.userEmail) dom.userEmail.textContent = user.email;
    if (dom.mainContent) dom.mainContent.style.display = 'block';
    
    // Hide hero and featured sections when logged in
    if (heroSection) heroSection.style.display = 'none';
    if (featuredSection) featuredSection.style.display = 'none';
    
    hideConfirmationMessage();
    loadWatchlist();
  } else {
    currentUser = null;
    if (dom.loginForm) dom.loginForm.style.display = 'flex';
    if (dom.userInfo) dom.userInfo.style.display = 'none';
    if (dom.mainContent) dom.mainContent.style.display = 'none';
    
    // Show hero and featured sections when logged out
    if (heroSection) heroSection.style.display = 'block';
    if (featuredSection) featuredSection.style.display = 'block';
  }
}

// OMDB API functions
async function searchOMDB(query) {
  try {
    const url = `https://www.omdbapi.com/?apikey=${OMDB_API_KEY}&s=${encodeURIComponent(query)}&type=movie`;
    const res = await fetch(url);
    const data = await res.json();
    
    if (data.Response === "True") {
      return data.Search || [];
    } else {
      console.error('OMDB Error:', data.Error);
      return [];
    }
  } catch (error) {
    console.error('Search error:', error);
    return [];
  }
}

function renderResults(items = []) {
  if (!dom.resultsList) return;
  
  dom.resultsList.innerHTML = '';
  
  if (!items.length) {
    dom.resultsList.innerHTML = '<li class="empty">Tidak ada hasil ditemukan</li>';
    return;
  }
  
  items.forEach(item => {
    const li = document.createElement('li');
    li.className = 'movie';
    
    // Buat placeholder dengan judul film jika poster N/A
    let posterUrl;
    if (item.Poster && item.Poster !== 'N/A') {
      posterUrl = item.Poster;
    } else {
      posterUrl = `https://via.placeholder.com/80x120/333/fff?text=${encodeURIComponent(item.Title.substring(0, 20))}`;
    }
    
    li.innerHTML = `
      <img src="${posterUrl}" 
           alt="${item.Title}" 
           onerror="this.onerror=null; this.src='https://via.placeholder.com/80x120/444/fff?text=${encodeURIComponent(item.Title.substring(0, 15))}';"
           loading="lazy" />
      <div class="meta">
        <h3>${item.Title}</h3>
        <p>${item.Year}</p>
        <div class="actions">
          <button data-imdb="${item.imdbID}" data-title="${item.Title}" data-year="${item.Year}" data-poster="${item.Poster}" class="add">
            Tambah ke Watchlist
          </button>
          <a href="https://www.imdb.com/title/${item.imdbID}" target="_blank" rel="noopener">IMDB</a>
        </div>
      </div>
    `;
    dom.resultsList.appendChild(li);
  });
}

function renderWatchlist(items = []) {
  if (!dom.watchlist) return;
  
  dom.watchlist.innerHTML = '';
  
  if (!items.length) {
    dom.watchlist.innerHTML = '<li class="empty">Watchlist kosong. Cari dan tambahkan film!</li>';
    return;
  }
  
  items.forEach(item => {
    const li = document.createElement('li');
    li.className = 'movie';
    
    // Buat placeholder dengan judul film jika poster N/A
    let posterUrl;
    if (item.poster && item.poster !== 'N/A') {
      posterUrl = item.poster;
    } else {
      posterUrl = `https://via.placeholder.com/80x120/333/fff?text=${encodeURIComponent(item.title.substring(0, 20))}`;
    }
    
    li.innerHTML = `
      <img src="${posterUrl}" 
           alt="${item.title}" 
           onerror="this.onerror=null; this.src='https://via.placeholder.com/80x120/444/fff?text=${encodeURIComponent(item.title.substring(0, 15))}';"
           loading="lazy" />
      <div class="meta">
        <h3>${item.title}</h3>
        <p>${item.year}</p>
        <div class="actions">
          <button data-id="${item.id}" class="remove">Hapus</button>
          <a href="https://www.imdb.com/title/${item.imdb_id}" target="_blank" rel="noopener">IMDB</a>
        </div>
      </div>
    `;
    dom.watchlist.appendChild(li);
  });
}

// Supabase functions
async function addToWatchlist(imdbId, title, year, poster) {
  if (!currentUser) return;
  
  try {
    const { data, error } = await supabase
      .from('watchlist')
      .insert({
        user_id: currentUser.id,
        imdb_id: imdbId,
        title: title,
        year: year,
        poster: poster
      })
      .select();
    
    if (error) {
      if (error.code === '23505') { // Unique constraint violation
        throw new Error('Film sudah ada di watchlist');
      }
      throw error;
    }
    
    await loadWatchlist();
    return true;
  } catch (error) {
    console.error('Add to watchlist error:', error);
    alert('Gagal menambah ke watchlist: ' + error.message);
    return false;
  }
}

async function loadWatchlist() {
  if (!currentUser || !dom.watchlist) return;
  
  try {
    const { data, error } = await supabase
      .from('watchlist')
      .select('*')
      .eq('user_id', currentUser.id)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    renderWatchlist(data || []);
  } catch (error) {
    console.error('Load watchlist error:', error);
    dom.watchlist.innerHTML = '<li class="error">Gagal memuat watchlist</li>';
  }
}

function renderWatchlist(items = []) {
  if (!dom.watchlist) return;
  
  dom.watchlist.innerHTML = '';
  
  if (!items.length) {
    dom.watchlist.innerHTML = '<li class="empty">Watchlist kosong. Cari dan tambahkan film!</li>';
    return;
  }
  
  items.forEach(item => {
    const li = document.createElement('li');
    li.className = 'movie';
    
    // Buat placeholder dengan judul film jika poster N/A
    let posterUrl;
    if (item.poster && item.poster !== 'N/A') {
      posterUrl = item.poster;
    } else {
      posterUrl = `https://via.placeholder.com/80x120/333/fff?text=${encodeURIComponent(item.title.substring(0, 20))}`;
    }
    
    li.innerHTML = `
      <img src="${posterUrl}" 
           alt="${item.title}" 
           onerror="this.onerror=null; this.src='https://via.placeholder.com/80x120/444/fff?text=${encodeURIComponent(item.title.substring(0, 15))}';"
           loading="lazy" />
      <div class="meta">
        <h3>${item.title}</h3>
        <p>${item.year}</p>
        <div class="actions">
          <button data-id="${item.id}" class="remove">Hapus</button>
          <a href="https://www.imdb.com/title/${item.imdb_id}" target="_blank" rel="noopener">IMDB</a>
        </div>
      </div>
    `;
    dom.watchlist.appendChild(li);
  });
}

async function removeFromWatchlist(id) {
  if (!currentUser) return;
  
  try {
    const { error } = await supabase
      .from('watchlist')
      .delete()
      .eq('id', id)
      .eq('user_id', currentUser.id);
    
    if (error) throw error;
    
    await loadWatchlist();
  } catch (error) {
    console.error('Remove from watchlist error:', error);
    alert('Gagal menghapus dari watchlist: ' + error.message);
  }
}

// Featured Movies functionality - UPDATE: Tambah lebih banyak film dan ambil 8
const featuredMovies = [
  'Avengers: Endgame',
  'The Dark Knight',
  'Inception',
  'Interstellar',
  'The Godfather',
  'Pulp Fiction',
  'The Shawshank Redemption',
  'Forrest Gump',
  'The Matrix',
  'Titanic',
  'Avatar',
  'Joker',
  'Spider-Man: No Way Home',
  'Top Gun: Maverick',
  'Sore: Wife from the Future',
  'Parasite',
  'The Lord of the Rings: The Return of the King',
  '500 Days of Summer',
  'Avengers: Endgame',
  '5 cm'
];

async function loadFeaturedMovies() {
  const featuredContainer = document.getElementById('featuredMovies');
  if (!featuredContainer) return;
  
  try {
    // Get random 8 movies from our list (changed from 6 to 8)
    const randomMovies = featuredMovies.sort(() => 0.5 - Math.random()).slice(0, 8);
    const moviePromises = randomMovies.map(async (title) => {
      try {
        const url = `https://www.omdbapi.com/?apikey=${OMDB_API_KEY}&t=${encodeURIComponent(title)}`;
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.Response === "True") {
          return data;
        }
        return null;
      } catch (error) {
        console.error(`Error fetching ${title}:`, error);
        return null;
      }
    });
    
    const movies = await Promise.all(moviePromises);
    const validMovies = movies.filter(movie => movie !== null);
    
    if (validMovies.length > 0) {
      renderFeaturedMovies(validMovies);
    } else {
      featuredContainer.innerHTML = '<p class="error">Gagal memuat film populer</p>';
    }
  } catch (error) {
    console.error('Error loading featured movies:', error);
    featuredContainer.innerHTML = '<p class="error">Gagal memuat film populer</p>';
  }
}

function renderFeaturedMovies(movies) {
  const featuredContainer = document.getElementById('featuredMovies');
  if (!featuredContainer) return;
  
  featuredContainer.innerHTML = '';
  
  movies.forEach(movie => {
    const movieCard = document.createElement('div');
    movieCard.className = 'featured-movie';
    
    // Handle poster URL
    let posterUrl = movie.Poster;
    if (!posterUrl || posterUrl === 'N/A') {
      posterUrl = `https://via.placeholder.com/300x450/333/fff?text=${encodeURIComponent(movie.Title.substring(0, 20))}`;
    }
    
    // Calculate star rating from IMDB rating
    const rating = parseFloat(movie.imdbRating);
    const stars = Math.round(rating / 2);
    const starDisplay = '★'.repeat(stars) + '☆'.repeat(5 - stars);
    
    movieCard.innerHTML = `
      <img src="${posterUrl}" 
           alt="${movie.Title}"
           onerror="this.onerror=null; this.src='https://via.placeholder.com/300x450/333/fff?text=${encodeURIComponent(movie.Title.substring(0, 15))}';" />
      <div class="featured-movie-info">
        <h3>${movie.Title}</h3>
        <p>${movie.Year} • ${movie.Genre}</p>
        <div class="featured-movie-rating">
          <span class="stars">${starDisplay}</span>
          <span class="rating-text">${movie.imdbRating}/10</span>
        </div>
      </div>
    `;
    
    featuredContainer.appendChild(movieCard);
  });
}

// Event listeners - dengan error handling
try {
  console.log('Setting up event listeners...');
  
  if (dom.loginBtn) {
    dom.loginBtn.addEventListener('click', handleLogin);
    console.log('Login button event listener added');
  } else {
    console.error('Login button not found!');
  }
  
  if (dom.registerBtn) {
    dom.registerBtn.addEventListener('click', handleRegister);
    console.log('Register button event listener added');
  } else {
    console.error('Register button not found!');
  }
  
  if (dom.logoutBtn) {
    dom.logoutBtn.addEventListener('click', handleLogout);
    console.log('Logout button event listener added');
  }
  
  if (dom.resendBtn) {
    dom.resendBtn.addEventListener('click', handleResendConfirmation);
    console.log('Resend button event listener added');
  }

  // Handle Enter key for auth
  if (dom.emailInput) {
    dom.emailInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        dom.passwordInput?.focus();
      }
    });
  }

  if (dom.passwordInput) {
    dom.passwordInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        handleLogin();
      }
    });
  }

  if (dom.searchForm) {
    dom.searchForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const query = dom.searchInput?.value?.trim();
      
      if (!query) return;
      
      if (dom.resultsList) {
        dom.resultsList.innerHTML = '<li class="loading">Mencari film...</li>';
      }
      
      const results = await searchOMDB(query);
      renderResults(results);
    });
  }

  if (dom.resultsList) {
    dom.resultsList.addEventListener('click', async (e) => {
      if (e.target.matches('button.add')) {
        const btn = e.target;
        const imdbId = btn.dataset.imdb;
        const title = btn.dataset.title;
        const year = btn.dataset.year;
        const poster = btn.dataset.poster;
        
        btn.textContent = 'Menambahkan...';
        btn.disabled = true;
        
        const success = await addToWatchlist(imdbId, title, year, poster);
        
        if (success) {
          btn.textContent = 'Ditambahkan!';
          setTimeout(() => {
            btn.textContent = 'Tambah ke Watchlist';
            btn.disabled = false;
          }, 2000);
        } else {
          btn.textContent = 'Tambah ke Watchlist';
          btn.disabled = false;
        }
      }
    });
  }

  if (dom.watchlist) {
    dom.watchlist.addEventListener('click', async (e) => {
      if (e.target.matches('button.remove')) {
        const id = e.target.dataset.id;
        
        if (!confirm('Hapus film ini dari watchlist?')) return;
        
        await removeFromWatchlist(id);
      }
    });
  }

  console.log('Event listeners setup complete');
  
} catch (err) {
  console.error('Error setting up event listeners:', err);
}

// Auth state listener
try {
  supabase.auth.onAuthStateChange((event, session) => {
    console.log('Auth state changed:', event, session?.user?.email);
    
    // Handle email confirmation
    if (event === 'SIGNED_IN' && session?.user) {
      showAuthMessage('Email berhasil dikonfirmasi! Anda sudah login.', 'success');
    }
    
    updateAuthUI(session?.user || null);
  });
  
  console.log('Auth state listener setup complete');
} catch (err) {
  console.error('Error setting up auth state listener:', err);
}

// Handle email confirmation from URL
async function handleEmailConfirmation() {
  // Cek apakah ada token di URL (dari email confirmation)
  const hashParams = new URLSearchParams(window.location.hash.substring(1));
  const accessToken = hashParams.get('access_token');
  const type = hashParams.get('type');
  
  if (accessToken && type === 'signup') {
    console.log('Email confirmation detected');
    
    try {
      // Set session dengan token dari URL
      const { data, error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: hashParams.get('refresh_token')
      });
      
      if (error) throw error;
      
      // Bersihkan URL dari token
      window.history.replaceState({}, document.title, window.location.pathname);
      
      // Show success message
      showAuthMessage('Email berhasil dikonfirmasi! Anda sekarang bisa menggunakan aplikasi.', 'success');
      
      // Update UI
      updateAuthUI(data.user);
      
      // Auto scroll ke main content
      setTimeout(() => {
        document.getElementById('mainContent')?.scrollIntoView({ behavior: 'smooth' });
      }, 1000);
      
    } catch (err) {
      console.error('Email confirmation error:', err);
      showAuthMessage('Konfirmasi email gagal. Silakan coba login.', 'error');
    }
  }
}

// Initialize app - update to load featured movies
(async function init() {
  try {
    console.log('Initializing app...');
    
    // Handle email confirmation terlebih dahulu
    await handleEmailConfirmation();
    
    const { data: { session } } = await supabase.auth.getSession();
    console.log('Initial session:', session);
    updateAuthUI(session?.user || null);
    
    // Load featured movies only if not logged in
    if (!session?.user) {
      await loadFeaturedMovies();
    }
    
    console.log('App initialization complete');
  } catch (err) {
    console.error('Error during app initialization:', err);
  }
})();