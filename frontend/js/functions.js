// ---------- Shopping cart ----------
let cartCount = 0
const cartCountEl = document.getElementById('cartCount')

document.querySelectorAll('.add-cart').forEach((btn) => {
  btn.addEventListener('click', (e) => {
    e.preventDefault()
    cartCount++
    cartCountEl.textContent = cartCount
    btn.classList.add('added')
    setTimeout(() => btn.classList.remove('added'), 1200)
  })
})

// ---------- Newsletter subscription ----------
const newsletterForm = document.getElementById('newsletterForm')
const newsletterFeedback = document.getElementById('newsletterFeedback')

newsletterForm.addEventListener('submit', (e) => {
  e.preventDefault()
  const email = document.getElementById('newsletterEmail').value.trim()

  if (email) {
    newsletterFeedback.textContent = 'Welcome to Velora! Check your inbox for a confirmation.'
    document.getElementById('newsletterEmail').value = ''
    setTimeout(() => { newsletterFeedback.textContent = '' }, 4000)
  }
})