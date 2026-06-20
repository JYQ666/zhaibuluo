/**
 * 定制衣柜案例展示 — 主逻辑文件
 * 功能：数据加载、滚动动画、轮播、灯箱、搜索过滤
 */

// ============================================
// 全局状态
// ============================================
let appData = null;
let currentCommunity = null;
let featuredSwiper = null;
let caseSwipers = [];
let lightboxState = {
  isOpen: false,
  images: [],
  currentIndex: 0
};

// ============================================
// 初始化
// ============================================
document.addEventListener('DOMContentLoaded', async () => {
  // 显示加载动画
  showLoading();
  
  try {
    // 加载数据
    await loadData();
    
    // 渲染页面
    renderHero();
    renderFeatured();
    renderCommunity();
    renderFooter();
    
    // 初始化交互
    initScrollAnimations();
    initLightbox();
    initNavigation();
    
    // 隐藏加载动画
    hideLoading();
    
    // 触发 Hero 动画
    setTimeout(() => {
      document.querySelector('.hero')?.classList.add('is-loaded');
    }, 100);
    
  } catch (error) {
    console.error('初始化失败:', error);
    hideLoading();
    showError('数据加载失败，请刷新页面重试');
  }
});

// ============================================
// 数据加载
// ============================================
async function loadData() {
  try {
    const response = await fetch('./data/cases.json');
    if (!response.ok) throw new Error('Failed to fetch data');
    appData = await response.json();
  } catch (error) {
    console.warn('无法加载外部数据，使用默认数据');
    // 使用内联默认数据（用于演示）
    appData = {
      brand: {
        logo: '',
        name: '臻品定制',
        slogan: '为每个家庭，定制专属收纳空间'
      },
      wechat_qrcode: '',
      communities: [
        {
          id: 'community-001',
          name: '翡翠湖畔',
          cases: [
            {
              id: 'case-001',
              title: '翡翠湖畔 3栋 1201室',
              featured: true,
              images: [
                'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=1200&q=80',
                'https://images.unsplash.com/photo-1595428774223-ef52624120d2?auto=format&fit=crop&w=1200&q=80',
                'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?auto=format&fit=crop&w=1200&q=80'
              ]
            },
            {
              id: 'case-002',
              title: '翡翠湖畔 5栋 803室',
              featured: true,
              images: [
                'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=1200&q=80',
                'https://images.unsplash.com/photo-1595428774223-ef52624120d2?auto=format&fit=crop&w=1200&q=80'
              ]
            }
          ]
        },
        {
          id: 'community-002',
          name: '万科金域华府',
          cases: [
            {
              id: 'case-003',
              title: '万科金域华府 12栋 1502室',
              featured: true,
              images: [
                'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=1200&q=80',
                'https://images.unsplash.com/photo-1595428774223-ef52624120d2?auto=format&fit=crop&w=1200&q=80',
                'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?auto=format&fit=crop&w=1200&q=80'
              ]
            }
          ]
        }
      ]
    };
  }
}

// ============================================
// 渲染：Hero Section
// ============================================
function renderHero() {
  const hero = document.getElementById('hero');
  if (!hero || !appData) return;
  
  const { brand } = appData;
  
  // 使用第一张精选案例图作为背景
  const featuredImages = getFeaturedImages();
  const bgImage = featuredImages[0] || '';
  
  hero.innerHTML = `
    <div class="hero__bg">
      <img src="${bgImage}" alt="品牌展示图" loading="eager">
    </div>
    <div class="hero__content">
      <div class="hero__logo">
        ${brand.logo ? `<img src="${brand.logo}" alt="${brand.name}">` : getBrandInitial(brand.name)}
      </div>
      <div class="hero__brand">${brand.name}</div>
      <h1 class="hero__title">${brand.slogan}</h1>
    </div>
    <div class="hero__scroll">
      <svg viewBox="0 0 24 40" fill="none" stroke="currentColor" stroke-width="2">
        <rect x="6" y="4" width="12" height="24" rx="6"/>
        <line x1="12" y1="10" x2="12" y2="16"/>
        <polyline points="8 32 12 36 16 32"/>
      </svg>
    </div>
  `;
}

// ============================================
// 渲染：Featured Section
// ============================================
function renderFeatured() {
  const featured = document.getElementById('featured');
  if (!featured || !appData) return;
  
  const featuredCases = getFeaturedCases();
  if (featuredCases.length === 0) {
    featured.style.display = 'none';
    return;
  }
  
  const slides = featuredCases.map((item, index) => {
    const community = findCommunityByCase(item.case.id);
    return `
      <div class="featured__slide ${index === 0 ? 'is-active' : ''}" data-index="${index}">
        <div class="featured__image">
          <img src="${item.case.images[0]}" alt="${item.case.title}" loading="lazy">
        </div>
        <div class="featured__info">
          <h3 class="featured__community">${community?.name || ''}</h3>
          <div class="featured__meta">
            <span>${item.case.title}</span>
          </div>
          <p class="featured__highlight">精心定制，每一寸空间都恰到好处。</p>
          <div class="featured__count">${item.case.images.length} 张效果图</div>
        </div>
      </div>
    `;
  }).join('');
  
  const dots = featuredCases.map((_, i) => `
    <span class="featured__dot ${i === 0 ? 'is-active' : ''}" data-index="${i}"></span>
  `).join('');
  
  featured.innerHTML = `
    <div class="featured__header reveal">
      <div class="featured__label">精选案例</div>
      <h2 class="featured__title">空间改造的艺术</h2>
    </div>
    <div class="featured__track-wrapper">
      <div class="featured__track">
        ${slides}
      </div>
    </div>
    <div class="featured__nav">
      <button class="featured__arrow featured__arrow--prev" aria-label="上一个">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="15 18 9 12 15 6"/>
        </svg>
      </button>
      <div class="featured__dots">
        ${dots}
      </div>
      <button class="featured__arrow featured__arrow--next" aria-label="下一个">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="9 18 15 12 9 6"/>
        </svg>
      </button>
    </div>
  `;
  
  // 初始化精选案例轮播
  initFeaturedCarousel(featuredCases.length);
}

// ============================================
// 渲染：Community Section
// ============================================
function renderCommunity() {
  const community = document.getElementById('community');
  if (!community || !appData) return;
  
  const communities = appData.communities || [];
  
  const cards = communities.map(c => {
    const caseCount = c.cases.length;
    const isLarge = caseCount >= 5;
    const representativeImage = c.cases[0]?.images[0] || '';
    
    return `
      <div class="community__card ${isLarge ? 'community__card--large' : ''} ${!representativeImage ? 'community__card--small' : ''}" 
           data-community-id="${c.id}">
        ${representativeImage ? `
          <div class="community__card-image">
            <img src="${representativeImage}" alt="${c.name}" loading="lazy">
          </div>
        ` : ''}
        <div class="community__card-info">
          <div class="community__card-name">${c.name}</div>
          <div class="community__card-count">${caseCount} 个案例</div>
        </div>
      </div>
    `;
  }).join('');
  
  community.innerHTML = `
    <div class="container">
      <div class="community__header reveal">
        <div class="community__label">按小区浏览</div>
        <h2 class="community__title">找到您的小区</h2>
        <div class="community__search">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"/>
            <line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input type="text" id="community-search" placeholder="搜索小区名称...">
        </div>
      </div>
      <div class="community__grid" id="community-grid">
        ${cards}
      </div>
    </div>
  `;
  
  // 绑定搜索事件
  initCommunitySearch();
  
  // 绑定卡片点击事件
  initCommunityCards();
}

// ============================================
// 渲染：Cases Section (点击小区后显示)
// ============================================
function renderCases(communityId) {
  const casesSection = document.getElementById('cases');
  if (!casesSection || !appData) return;
  
  const community = appData.communities.find(c => c.id === communityId);
  if (!community) return;
  
  currentCommunity = community;
  
  const caseItems = community.cases.map((c, index) => {
    const slides = c.images.map(img => `
      <div class="swiper-slide">
        <img src="${img}" alt="${c.title}" loading="lazy" data-src="${img}">
      </div>
    `).join('');
    
    return `
      <div class="case-item" data-case-id="${c.id}">
        <h3 class="case-item__title">${c.title}</h3>
        <div class="case-item__swiper swiper" data-case-index="${index}">
          <div class="swiper-wrapper">
            ${slides}
          </div>
          <div class="swiper-button-next"></div>
          <div class="swiper-button-prev"></div>
          <div class="swiper-pagination"></div>
        </div>
      </div>
    `;
  }).join('');
  
  casesSection.innerHTML = `
    <div class="container">
      <div class="cases__header">
        <h2 class="cases__community-name">${community.name}</h2>
        <button class="cases__back" id="cases-back">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
          返回小区列表
        </button>
      </div>
      <div class="cases__list">
        ${caseItems}
      </div>
    </div>
  `;
  
  // 初始化 Swiper
  initCaseSwipers();
  
  // 绑定返回按钮
  document.getElementById('cases-back')?.addEventListener('click', () => {
    casesSection.style.display = 'none';
    document.getElementById('community')?.scrollIntoView({ behavior: 'smooth' });
    currentCommunity = null;
  });
  
  // 显示 cases section
  casesSection.style.display = 'block';
  
  // 滚动到 cases section
  setTimeout(() => {
    casesSection.scrollIntoView({ behavior: 'smooth' });
  }, 100);
  
  // 初始化案例项的进入动画
  initCaseItemAnimations();
}

// ============================================
// 渲染：Footer
// ============================================
function renderFooter() {
  const footer = document.getElementById('footer');
  if (!footer || !appData) return;
  
  const { brand, wechat_qrcode } = appData;
  
  footer.innerHTML = `
    <div class="container">
      <div class="footer__inner">
        <div class="footer__brand">
          <div class="footer__logo">
            ${brand.logo ? `<img src="${brand.logo}" alt="${brand.name}">` : getBrandInitial(brand.name)}
          </div>
          <div class="footer__name">${brand.name}</div>
          <p class="footer__slogan">${brand.slogan}</p>
        </div>
        <div class="footer__contact">
          <div class="footer__qrcode">
            ${wechat_qrcode ? `<img src="${wechat_qrcode}" alt="微信二维码">` : '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#999;font-size:0.8rem;">二维码</div>'}
          </div>
          <div class="footer__label">扫码添加微信</div>
        </div>
      </div>
    </div>
  `;
}

// ============================================
// 精选案例轮播
// ============================================
function initFeaturedCarousel(totalSlides) {
  let currentIndex = 0;
  const track = document.querySelector('.featured__track');
  const dots = document.querySelectorAll('.featured__dot');
  const prevBtn = document.querySelector('.featured__arrow--prev');
  const nextBtn = document.querySelector('.featured__arrow--next');
  
  function goToSlide(index) {
    if (index < 0) index = totalSlides - 1;
    if (index >= totalSlides) index = 0;
    currentIndex = index;
    
    track.style.transform = `translateX(-${currentIndex * 100}vw)`;
    
    // 更新 dots
    dots.forEach((dot, i) => {
      dot.classList.toggle('is-active', i === currentIndex);
    });
    
    // 更新 active slide
    document.querySelectorAll('.featured__slide').forEach((slide, i) => {
      slide.classList.toggle('is-active', i === currentIndex);
    });
  }
  
  // 绑定按钮事件
  prevBtn?.addEventListener('click', () => goToSlide(currentIndex - 1));
  nextBtn?.addEventListener('click', () => goToSlide(currentIndex + 1));
  
  // 绑定 dots 事件
  dots.forEach((dot, i) => {
    dot.addEventListener('click', () => goToSlide(i));
  });
  
  // 鼠标滚轮横向滚动
  const wrapper = document.querySelector('.featured__track-wrapper');
  let isScrolling = false;
  
  wrapper?.addEventListener('wheel', (e) => {
    if (isScrolling) return;
    
    const delta = e.deltaY || e.deltaX;
    if (Math.abs(delta) > 30) {
      isScrolling = true;
      if (delta > 0) {
        goToSlide(currentIndex + 1);
      } else {
        goToSlide(currentIndex - 1);
      }
      setTimeout(() => { isScrolling = false; }, 600);
    }
  }, { passive: true });
  
  // 触摸滑动支持
  let touchStartX = 0;
  let touchEndX = 0;
  
  wrapper?.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].screenX;
  }, { passive: true });
  
  wrapper?.addEventListener('touchend', (e) => {
    touchEndX = e.changedTouches[0].screenX;
    const diff = touchStartX - touchEndX;
    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        goToSlide(currentIndex + 1);
      } else {
        goToSlide(currentIndex - 1);
      }
    }
  }, { passive: true });
  
  // 点击图片进入灯箱
  document.querySelectorAll('.featured__image').forEach((imgContainer, index) => {
    imgContainer.addEventListener('click', () => {
      const featuredCases = getFeaturedCases();
      const images = featuredCases[index]?.case.images || [];
      openLightbox(images, 0);
    });
  });
}

// ============================================
// 案例 Swiper 初始化
// ============================================
function initCaseSwipers() {
  // 销毁旧的 Swiper 实例
  caseSwipers.forEach(s => s.destroy?.());
  caseSwipers = [];
  
  // 检查 Swiper 是否加载
  if (typeof Swiper === 'undefined') {
    console.warn('Swiper.js 未加载，使用简单轮播');
    initSimpleCarousel();
    return;
  }
  
  document.querySelectorAll('.case-item__swiper').forEach((el, index) => {
    const swiper = new Swiper(el, {
      slidesPerView: 1,
      loop: true,
      navigation: {
        nextEl: '.swiper-button-next',
        prevEl: '.swiper-button-prev',
      },
      pagination: {
        el: '.swiper-pagination',
        clickable: true,
      },
      on: {
        click: function(swiper) {
          const caseData = currentCommunity?.cases[index];
          if (caseData) {
            const realIndex = swiper.realIndex;
            openLightbox(caseData.images, realIndex);
          }
        }
      }
    });
    caseSwipers.push(swiper);
  });
}

// 简单轮播（Swiper 未加载时的降级方案）
function initSimpleCarousel() {
  document.querySelectorAll('.case-item__swiper').forEach((swiperEl) => {
    const slides = swiperEl.querySelectorAll('.swiper-slide');
    let currentIndex = 0;
    
    const nextBtn = swiperEl.querySelector('.swiper-button-next');
    const prevBtn = swiperEl.querySelector('.swiper-button-prev');
    
    function updateSlides() {
      slides.forEach((slide, i) => {
        slide.style.display = i === currentIndex ? 'flex' : 'none';
      });
    }
    
    nextBtn?.addEventListener('click', () => {
      currentIndex = (currentIndex + 1) % slides.length;
      updateSlides();
    });
    
    prevBtn?.addEventListener('click', () => {
      currentIndex = (currentIndex - 1 + slides.length) % slides.length;
      updateSlides();
    });
    
    updateSlides();
    
    // 点击切换灯箱
    slides.forEach((slide, i) => {
      slide.addEventListener('click', () => {
        const caseIndex = parseInt(swiperEl.dataset.caseIndex);
        const caseData = currentCommunity?.cases[caseIndex];
        if (caseData) {
          openLightbox(caseData.images, i);
        }
      });
    });
  });
}

// ============================================
// 小区搜索
// ============================================
function initCommunitySearch() {
  const searchInput = document.getElementById('community-search');
  const grid = document.getElementById('community-grid');
  
  searchInput?.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase().trim();
    const cards = grid?.querySelectorAll('.community__card');
    
    cards?.forEach(card => {
      const name = card.querySelector('.community__card-name')?.textContent.toLowerCase() || '';
      const isVisible = name.includes(query);
      card.style.display = isVisible ? '' : 'none';
    });
    
    // 显示空状态
    const visibleCards = grid?.querySelectorAll('.community__card[style=""], .community__card:not([style])');
    const emptyEl = grid?.querySelector('.community__empty');
    
    if (visibleCards?.length === 0 && !emptyEl) {
      grid?.insertAdjacentHTML('beforeend', `
        <div class="community__empty">未找到匹配的小区</div>
      `);
    } else if (visibleCards?.length > 0 && emptyEl) {
      emptyEl.remove();
    }
  });
}

// ============================================
// 小区卡片点击
// ============================================
function initCommunityCards() {
  document.querySelectorAll('.community__card').forEach(card => {
    card.addEventListener('click', () => {
      const communityId = card.dataset.communityId;
      if (communityId) {
        renderCases(communityId);
      }
    });
  });
}

// ============================================
// 灯箱
// ============================================
function initLightbox() {
  // 创建灯箱 DOM
  const lightbox = document.createElement('div');
  lightbox.className = 'lightbox';
  lightbox.id = 'lightbox';
  lightbox.innerHTML = `
    <button class="lightbox__close" aria-label="关闭">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="24" height="24">
        <line x1="18" y1="6" x2="6" y2="18"/>
        <line x1="6" y1="6" x2="18" y2="18"/>
      </svg>
    </button>
    <button class="lightbox__nav lightbox__nav--prev" aria-label="上一张">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="24" height="24">
        <polyline points="15 18 9 12 15 6"/>
      </svg>
    </button>
    <img class="lightbox__image" src="" alt="">
    <button class="lightbox__nav lightbox__nav--next" aria-label="下一张">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="24" height="24">
        <polyline points="9 18 15 12 9 6"/>
      </svg>
    </button>
    <div class="lightbox__counter"></div>
  `;
  document.body.appendChild(lightbox);
  
  // 绑定事件
  lightbox.querySelector('.lightbox__close')?.addEventListener('click', closeLightbox);
  lightbox.querySelector('.lightbox__nav--prev')?.addEventListener('click', () => navigateLightbox(-1));
  lightbox.querySelector('.lightbox__nav--next')?.addEventListener('click', () => navigateLightbox(1));
  
  // 点击背景关闭
  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) closeLightbox();
  });
  
  // 键盘事件
  document.addEventListener('keydown', (e) => {
    if (!lightboxState.isOpen) return;
    
    switch (e.key) {
      case 'Escape':
        closeLightbox();
        break;
      case 'ArrowLeft':
        navigateLightbox(-1);
        break;
      case 'ArrowRight':
        navigateLightbox(1);
        break;
    }
  });
}

function openLightbox(images, startIndex = 0) {
  const lightbox = document.getElementById('lightbox');
  if (!lightbox) return;
  
  lightboxState = {
    isOpen: true,
    images: images,
    currentIndex: startIndex
  };
  
  updateLightboxImage();
  lightbox.classList.add('is-open');
  document.body.style.overflow = 'hidden';
}

function closeLightbox() {
  const lightbox = document.getElementById('lightbox');
  if (!lightbox) return;
  
  lightboxState.isOpen = false;
  lightbox.classList.remove('is-open');
  document.body.style.overflow = '';
}

function navigateLightbox(direction) {
  const newIndex = lightboxState.currentIndex + direction;
  if (newIndex < 0 || newIndex >= lightboxState.images.length) return;
  
  lightboxState.currentIndex = newIndex;
  updateLightboxImage();
}

function updateLightboxImage() {
  const lightbox = document.getElementById('lightbox');
  if (!lightbox) return;
  
  const img = lightbox.querySelector('.lightbox__image');
  const counter = lightbox.querySelector('.lightbox__counter');
  
  if (img) {
    img.src = lightboxState.images[lightboxState.currentIndex];
  }
  
  if (counter) {
    counter.textContent = `${lightboxState.currentIndex + 1} / ${lightboxState.images.length}`;
  }
}

// ============================================
// 滚动动画
// ============================================
function initScrollAnimations() {
  // Intersection Observer for reveal animations
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
      }
    });
  }, {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  });
  
  // 观察所有 reveal 元素
  document.querySelectorAll('.reveal').forEach(el => {
    observer.observe(el);
  });
}

function initCaseItemAnimations() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
      }
    });
  }, {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  });
  
  document.querySelectorAll('.case-item').forEach(el => {
    observer.observe(el);
  });
}

// ============================================
// 导航
// ============================================
function initNavigation() {
  // 平滑滚动到锚点
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      const targetId = anchor.getAttribute('href').slice(1);
      const target = document.getElementById(targetId);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });
}

// ============================================
// 辅助函数
// ============================================
function getFeaturedCases() {
  if (!appData) return [];
  
  const featured = [];
  appData.communities.forEach(community => {
    community.cases.forEach(c => {
      if (c.featured) {
        featured.push({ community, case: c });
      }
    });
  });
  return featured;
}

function getFeaturedImages() {
  const featuredCases = getFeaturedCases();
  const images = [];
  featuredCases.forEach(item => {
    if (item.case.images[0]) {
      images.push(item.case.images[0]);
    }
  });
  return images;
}

function findCommunityByCase(caseId) {
  if (!appData) return null;
  return appData.communities.find(c => 
    c.cases.some(caseItem => caseItem.id === caseId)
  );
}

function getBrandInitial(name) {
  return name ? name.charAt(0) : '品';
}

// ============================================
// Loading & Error
// ============================================
function showLoading() {
  let overlay = document.querySelector('.loading-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.className = 'loading-overlay';
    overlay.innerHTML = '<div class="loading-spinner"></div>';
    document.body.appendChild(overlay);
  }
  overlay.classList.remove('is-hidden');
}

function hideLoading() {
  const overlay = document.querySelector('.loading-overlay');
  overlay?.classList.add('is-hidden');
}

function showError(message) {
  const errorEl = document.createElement('div');
  errorEl.style.cssText = `
    position: fixed;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: #dc2626;
    color: white;
    padding: 12px 24px;
    border-radius: 8px;
    z-index: 9999;
    font-size: 14px;
  `;
  errorEl.textContent = message;
  document.body.appendChild(errorEl);
  
  setTimeout(() => {
    errorEl.remove();
  }, 3000);
}
