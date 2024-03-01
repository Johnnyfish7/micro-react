// concurrent mode
// 并行 同时进行的

// import { createElement, render } from './micro-react'

// const element = createElement(
//   'h1',
//   { id: 'title' },
//   'Hello React',
//   createElement('a', { href: 'https://bilibili.com' }, 'Click Me!'),
// )

// const container = document.querySelector('#root')

// render(element, container)

// console.log(element)

import { createElement, render } from './micro-react'

const handleChange = (e) => {
  renderer(e.target.value)
}

const container = document.querySelector('#root')

const renderer = (value) => {
  const element = createElement(
    'div',
    null,
    createElement('input', {
      value: value,
      oninput: (e) => {
        handleChange(e)
      },
    }),
    createElement('h2', null, value),
  )

  render(element, container)
}

renderer('Hello')
