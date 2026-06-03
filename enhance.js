/* ============================================================
   enhance.js — Luliy Blog · 高性能极简主义架构脚本 v3
   ============================================================ */
(function () {
  'use strict';

  const LuliyBlog = {
    init() {
      this.initProgressBar();
      this.optimizeLayout();
      
      // 检测是否为文章详情页
      if (document.getElementById('postBody')) {
        this.initPostPage();
      }
    },

    // 1. 顶部极简高性能滚动进度条
    initProgressBar() {
      const bar = document.createElement('div');
      bar.className = 'top-progress-bar';
      document.body.appendChild(bar);

      window.addEventListener('scroll', () => {
        const doc = document.documentElement;
        const top = doc.scrollTop || document.body.scrollTop;
        const height = doc.scrollHeight - doc.clientHeight;
        const scrolled = height > 0 ? (top / height) * 100 : 0;
        bar.style.width = scrolled + '%';
      }, { passive: true });
    },

    // 2. 移除冗余结构，修正长标语引起的空白
    optimizeLayout() {
      const subTitle = document.querySelector('.subTitle');
      if (subTitle && subTitle.textContent.length > 15) {
        subTitle.style.fontSize = '14px';
        subTitle.style.opacity = '0.8';
      }
    },

    // 3. 文章页核心功能组
    initPostPage() {
      this.injectMetaStats();
      this.buildCollapsibleTOC();
    },

    // 4. 精准去重：字数与阅读时长统计（彻底解决显示两次的Bug）
    injectMetaStats() {
      // 严格防重载守卫
      if (document.getElementById('luliy-unique-stats')) return;

      const postBody = document.getElementById('postBody');
      const postTitle = document.querySelector('.postTitle');
      if (!postBody || !postTitle) return;

      const text = postBody.innerText || '';
      // 过滤空白字符精准统计字数
      const cleanText = text.replace(/[\s\r\n]+/g, '');
      const wordCount = cleanText.length;
      const readTime = Math.ceil(wordCount / 400) || 1; // 估算 400 字/分钟

      const statsContainer = document.createElement('div');
      statsContainer.id = 'luliy-unique-stats';
      statsContainer.style.cssText = 'font-size:13px; color:#57606a; margin: 8px 0 16px 0; display:flex; gap:14px;';
      statsContainer.innerHTML = `<span>📝 ${wordCount} 字</span><span>⏱️ ${readTime} 分钟阅读</span>`;

      // 安全插入到文章标题正下方
      postTitle.parentNode.insertBefore(statsContainer, postTitle.nextSibling);
    },

    // 5. 悬浮微型可折叠目录架构
    buildCollapsibleTOC() {
      const postBody = document.getElementById('postBody');
      const headers = postBody.querySelectorAll('h1, h2, h3');
      if (headers.length === 0) return;

      // 创建折叠式组件根节点
      const container = document.createElement('div');
      container.className = 'luliy-toc-container';

      const toggle = document.createElement('div');
      toggle.className = 'luliy-toc-toggle';
      toggle.innerHTML = '📋';
      toggle.title = '查看目录';

      const content = document.createElement('div');
      content.className = 'luliy-toc-content';

      const ul = document.createElement('ul');
      headers.forEach((header, index) => {
        if (!header.id) {
          header.id = 'luliy-anchor-' + index;
        }
        const li = document.createElement('li');
        // 根据多级标题实施轻量缩进
        if (header.tagName === 'H3') li.style.paddingLeft = '12px';
        if (header.tagName === 'H1') li.style.fontWeight = 'bold';

        const a = document.createElement('a');
        a.href = '#' + header.id;
        a.textContent = header.textContent.replace('#', '').trim();
        
        // 点击后自动收起面板
        a.addEventListener('click', () => {
          container.classList.remove('is-open');
        });

        li.appendChild(a);
        ul.appendChild(li);
      });

      content.appendChild(ul);
      container.appendChild(toggle);
      container.appendChild(content);
      document.body.appendChild(container);

      // 事件监听：点击图标切换展开状态
      toggle.addEventListener('click', (e) => {
        e.stopPropagation();
        container.classList.toggle('is-open');
      });

      // 点击外部区域自动流式收起
      document.addEventListener('click', () => {
        container.classList.remove('is-open');
      });
      container.addEventListener('click', (e) => {
        e.stopPropagation();
      });
    }
  };

  // 确保DOM就绪后用最快速度渲染
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => LuliyBlog.init());
  } else {
    LuliyBlog.init();
  }
})();
