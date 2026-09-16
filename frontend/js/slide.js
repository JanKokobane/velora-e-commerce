// =============================================
// Velora — Hero slideshow + mobile menu + cart + newsletter
// =============================================

const slides = [
  {
    eyebrow: 'Smart shopping starts here',
    title: 'Exclusive deals',
    accent: 'on every product',
    description: 'Save big with thoughtful pieces, limited drops, and up to 50% off.',
    button: 'Shop Now',
  },
  {
    eyebrow: 'Your everyday, upgraded',
    title: 'Fresh arrivals',
    accent: 'for modern living',
    description: 'Meet the new season collection built around comfort, quality, and ease.',
    button: 'Explore arrivals',
  },
  {
    eyebrow: 'Good style, better value',
    title: 'Hot discounts',
    accent: 'while they last',
    description: 'The pieces everyone is saving are here for a limited time only.',
    button: 'Grab the deal',
  },
]

// ---------- Mobile hamburger menu ----------
const menuButton = document.querySelector('.menu-button')
const header = document.querySelector('.site-header')

menuButton.addEventListener('click', () => {
  const isOpen = header.classList.toggle('menu-open')
  menuButton.setAttribute('aria-expanded', String(isOpen))
  menuButton.setAttribute('aria-label', isOpen ? 'Close menu' : 'Open menu')
})

document.querySelectorAll('.mobile-nav a').forEach((link) => {
  link.addEventListener('click', () => {
    header.classList.remove('menu-open')
    menuButton.setAttribute('aria-expanded', 'false')
    menuButton.setAttribute('aria-label', 'Open menu')
  })
})

// ---------- Hero slideshow ----------
let currentSlide = 0
let slideTimer

function updateSlide(nextIndex) {
  const content = document.querySelector('.hero-content')
  content.classList.add('is-changing')

  setTimeout(() => {
    currentSlide = (nextIndex + slides.length) % slides.length
    const slide = slides[currentSlide]

    document.getElementById('heroEyebrow').textContent = slide.eyebrow
    document.getElementById('heroTitle').firstChild.textContent = slide.title
    document.getElementById('heroAccent').textContent = slide.accent
    document.getElementById('heroDescription').textContent = slide.description
    document.getElementById('heroButton').firstChild.textContent = slide.button
    document.getElementById('slideCurrent').textContent = '0' + (currentSlide + 1)

    document.querySelectorAll('.dot').forEach((dot, index) => {
      dot.classList.toggle('active', index === currentSlide)
    })

    content.classList.remove('is-changing')
  }, 350)
}

function restartTimer() {
  clearInterval(slideTimer)
  slideTimer = setInterval(() => updateSlide(currentSlide + 1), 6000)
}

document.getElementById('nextSlide').addEventListener('click', () => {
  updateSlide(currentSlide + 1)
  restartTimer()
})

document.getElementById('previousSlide').addEventListener('click', () => {
  updateSlide(currentSlide - 1)
  restartTimer()
})

document.querySelectorAll('.dot').forEach((dot, index) => {
  dot.addEventListener('click', () => {
    updateSlide(index)
    restartTimer()
  })
})

restartTimer()


