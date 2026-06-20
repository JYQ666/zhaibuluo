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
  const response = await fetch('./data/cases.json');
  if (!response.ok) throw new Error('Failed to fetch data');
  appData = await response.json();
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
      <img src="${escapeHtml(bgImage)}" alt="品牌展示图" loading="eager" onerror="this.style.display='none'">
    </div>
    <div class="hero__content">
      <div class="hero__logo">
        ${brand.logo ? `<img src="${escapeHtml(brand.logo)}" alt="${escapeHtml(brand.name)}" onerror="this.style.display='none';this.parentElement.textContent='${escapeHtml(getBrandInitial(brand.name))}'">` : escapeHtml(getBrandInitial(brand.name))}
      </div>
      <h1 class="hero__title">${escapeHtml(brand.name)}</h1>
      <p class="hero__subtitle">${escapeHtml(brand.slogan)}</p>
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
          <img src="${escapeHtml(item.case.images[0])}" alt="${escapeHtml(item.case.title)}" loading="lazy" onerror="this.style.opacity=0.3">
        </div>
        <div class="featured__info">
          <h3 class="featured__community">${escapeHtml(community?.name || '')}</h3>
          <div class="featured__meta">
            <span>${escapeHtml(item.case.title)}</span>
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
      <div class="featured__chapter">精选案例</div>
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
    <div class="featured__progress" role="slider" aria-label="案例进度" tabindex="0">
      <div class="featured__progress-bar"></div>
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
           data-community-id="${escapeHtml(c.id)}">
        ${representativeImage ? `
          <div class="community__card-image">
            <img src="${escapeHtml(representativeImage)}" alt="${escapeHtml(c.name)}" loading="lazy" onerror="this.parentElement.style.display='none'">
          </div>
        ` : ''}
        <div class="community__card-info">
          <div class="community__card-name">${escapeHtml(c.name)}</div>
          <div class="community__card-count">${caseCount} 个案例</div>
        </div>
      </div>
    `;
  }).join('');
  
  community.innerHTML = `
    <div class="container">
      <div class="community__header reveal">
        <div class="community__chapter">按小区浏览</div>
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
        <img src="${escapeHtml(img)}" alt="${escapeHtml(c.title)}" loading="lazy" data-src="${escapeHtml(img)}" onerror="this.style.opacity=0.3">
      </div>
    `).join('');
    
    return `
      <div class="case-item" data-case-id="${escapeHtml(c.id)}">
        <h3 class="case-item__title">${escapeHtml(c.title)}</h3>
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
        <h2 class="cases__community-name">${escapeHtml(community.name)}</h2>
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
            ${brand.logo ? `<img src="${escapeHtml(brand.logo)}" alt="${escapeHtml(brand.name)}" onerror="this.style.display='none';this.parentElement.textContent='${escapeHtml(getBrandInitial(brand.name))}'">` : escapeHtml(getBrandInitial(brand.name))}
          </div>
          <div class="footer__name">${escapeHtml(brand.name)}</div>
          <p class="footer__slogan">${escapeHtml(brand.slogan)}</p>
        </div>
        <div class="footer__contact">
          <div class="footer__qrcode">
            ${wechat_qrcode ? `<img src="${escapeHtml(wechat_qrcode)}" alt="微信二维码" onerror="this.style.display='none'">` : '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#999;font-size:0.8rem;">二维码</div>'}
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
  if (totalSlides <= 1) {
    // 单张也需要触发进入动画
    if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
      initFeaturedEnterAnimation();
    }
    // 单张也绑定点击进灯箱
    document.querySelectorAll('.featured__image').forEach((imgContainer, index) => {
      imgContainer.addEventListener('click', () => {
        const featuredCases = getFeaturedCases();
        const images = featuredCases[index]?.case.images || [];
        openLightbox(images, 0);
      });
    });
    return;
  }
  
  let currentIndex = 0;
  const track = document.querySelector('.featured__track');
  const dots = document.querySelectorAll('.featured__dot');
  const prevBtn = document.querySelector('.featured__arrow--prev');
  const nextBtn = document.querySelector('.featured__arrow--next');
  const slides = document.querySelectorAll('.featured__slide');
  const progressBar = document.querySelector('.featured__progress-bar');
  
  const hasGSAP = typeof gsap !== 'undefined';
  
  function goToSlide(index, animate = true) {
    if (index < 0) index = totalSlides - 1;
    if (index >= totalSlides) index = 0;
    if (index === currentIndex && animate) return;
    
    const direction = index > currentIndex || (currentIndex === totalSlides - 1 && index === 0) ? 1 : -1;
    currentIndex = index;
    
    // 移动 track（spec: 案例切换图片从右侧滑入 0.5s）
    if (hasGSAP && animate) {
      gsap.to(track, {
        xPercent: -currentIndex * 100,
        duration: 0.5,
        ease: 'power2.out'
      });
    } else {
      track.style.transform = `translateX(-${currentIndex * 100}%)`;
    }
    
    // 更新 dots
    dots.forEach((dot, i) => {
      dot.classList.toggle('is-active', i === currentIndex);
    });
    
    // 更新 active slide + 文字淡入（spec: 文字淡入 0.4s, delay 0.1s）
    slides.forEach((slide, i) => {
      const isActive = i === currentIndex;
      slide.classList.toggle('is-active', isActive);
      
      if (isActive && hasGSAP && animate) {
        const info = slide.querySelector('.featured__info');
        if (info) {
          gsap.fromTo(info,
            { opacity: 0, x: 20 * direction },
            { opacity: 1, x: 0, duration: 0.4, delay: 0.1, ease: 'power2.out' }
          );
        }
      }
    });
    
    // 更新进度条
    if (progressBar) {
      const progress = (currentIndex + 1) / totalSlides * 100;
      if (hasGSAP) {
        gsap.to(progressBar, { width: `${progress}%`, duration: 0.3, ease: 'power2.out' });
      } else {
        progressBar.style.width = `${progress}%`;
      }
    }
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
  
  // 进度条拖拽（spec: 底部进度条拖拽）
  const progressTrack = document.querySelector('.featured__progress');
  if (progressTrack) {
    let isDragging = false;
    
    const handleProgressDrag = (clientX) => {
      const rect = progressTrack.getBoundingClientRect();
      const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      const newIndex = Math.round(ratio * (totalSlides - 1));
      if (newIndex !== currentIndex) {
        goToSlide(newIndex);
      }
    };
    
    progressTrack.addEventListener('mousedown', (e) => {
      isDragging = true;
      handleProgressDrag(e.clientX);
    });
    
    document.addEventListener('mousemove', (e) => {
      if (isDragging) handleProgressDrag(e.clientX);
    });
    
    document.addEventListener('mouseup', () => {
      isDragging = false;
    });
    
    // 触摸拖拽
    progressTrack.addEventListener('touchstart', (e) => {
      isDragging = true;
      handleProgressDrag(e.touches[0].clientX);
    }, { passive: true });
    
    progressTrack.addEventListener('touchmove', (e) => {
      if (isDragging) handleProgressDrag(e.touches[0].clientX);
    }, { passive: true });
    
    progressTrack.addEventListener('touchend', () => {
      isDragging = false;
    }, { passive: true });
  }
  
  // 点击图片进入灯箱
  document.querySelectorAll('.featured__image').forEach((imgContainer, index) => {
    imgContainer.addEventListener('click', () => {
      const featuredCases = getFeaturedCases();
      const images = featuredCases[index]?.case.images || [];
      openLightbox(images, 0);
    });
  });
  
  // 使用 ScrollTrigger 触发首次进入动画
  if (hasGSAP && typeof ScrollTrigger !== 'undefined') {
    initFeaturedEnterAnimation();
  }
}

// 精选区进入动画（ScrollTrigger 触发）
function initFeaturedEnterAnimation() {
  const featured = document.getElementById('featured');
  if (!featured) return;
  
  // header 进入动画
  const header = featured.querySelector('.featured__header');
  if (header) {
    gsap.fromTo(header,
      { opacity: 0, y: 30 },
      {
        opacity: 1, y: 0, duration: 0.8, ease: 'power2.out',
        scrollTrigger: {
          trigger: featured,
          start: 'top 80%',
          once: true
        }
      }
    );
  }
  
  // 首张 slide 的文字淡入
  const firstSlide = featured.querySelector('.featured__slide.is-active') || featured.querySelector('.featured__slide');
  if (firstSlide) {
    const info = firstSlide.querySelector('.featured__info');
    if (info) {
      gsap.fromTo(info,
        { opacity: 0, y: 20 },
        {
          opacity: 1, y: 0, duration: 0.6, delay: 0.3, ease: 'power2.out',
          scrollTrigger: {
            trigger: featured,
            start: 'top 60%',
            once: true
          }
        }
      );
    }
  }
}

// ============================================
// 案例 Swiper 初始化
// ============================================
function initCaseSwipers() {
  // 彻底销毁旧的 Swiper 实例
  caseSwipers.forEach(s => {
    try { s.destroy(true, true); } catch (e) { console.warn('Swiper destroy failed:', e); }
  });
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
        nextEl: el.querySelector('.swiper-button-next'),
        prevEl: el.querySelector('.swiper-button-prev'),
      },
      pagination: {
        el: el.querySelector('.swiper-pagination'),
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
    
    let visibleCount = 0;
    cards?.forEach(card => {
      const name = card.querySelector('.community__card-name')?.textContent.toLowerCase() || '';
      const isVisible = name.includes(query);
      card.style.display = isVisible ? '' : 'none';
      if (isVisible) visibleCount++;
    });
    
    // 显示/隐藏空状态
    let emptyEl = grid?.querySelector('.community__empty');
    if (visibleCount === 0) {
      if (!emptyEl) {
        grid?.insertAdjacentHTML('beforeend', '<div class="community__empty">未找到匹配的小区</div>');
      }
    } else if (emptyEl) {
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
      case 'Tab':
        // Focus trap：在灯箱内循环焦点
        e.preventDefault();
        const focusable = lightbox.querySelectorAll('button');
        if (focusable.length === 0) break;
        const currentIdx = Array.from(focusable).indexOf(document.activeElement);
        let nextIdx;
        if (e.shiftKey) {
          nextIdx = currentIdx <= 0 ? focusable.length - 1 : currentIdx - 1;
        } else {
          nextIdx = currentIdx >= focusable.length - 1 ? 0 : currentIdx + 1;
        }
        focusable[nextIdx]?.focus();
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
    currentIndex: startIndex,
    previousActiveElement: document.activeElement
  };
  
  updateLightboxImage();
  lightbox.classList.add('is-open');
  document.body.style.overflow = 'hidden';
  
  // Focus trap：将焦点移到关闭按钮
  const closeBtn = lightbox.querySelector('.lightbox__close');
  closeBtn?.focus();
}

function closeLightbox() {
  const lightbox = document.getElementById('lightbox');
  if (!lightbox) return;
  
  lightboxState.isOpen = false;
  lightbox.classList.remove('is-open');
  document.body.style.overflow = '';
  
  // 恢复焦点
  if (lightboxState.previousActiveElement) {
    lightboxState.previousActiveElement.focus?.();
  }
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

/**
 * HTML 转义，防止 XSS
 */
function escapeHtml(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

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
