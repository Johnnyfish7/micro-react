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

// import { createElement, render } from './micro-react'

// const handleChange = (e) => {
//   renderer(e.target.value)
// }

// const container = document.querySelector('#root')

// const renderer = (value) => {
//   const element = createElement(
//     'div',
//     null,
//     createElement('input', {
//       value: value,
//       oninput: (e) => {
//         handleChange(e)
//       },
//     }),
//     createElement('h2', null, value),
//   )

//   render(element, container)
// }

// renderer('Hello')

// 函数式
// import { createElement, render } from './micro-react'

// const container = document.querySelector('#root')
// const Test = (props) => {
//   return createElement('h1', null, props.name, createElement('h2', null, 999))
// }
// const App = (props) => {
//   return createElement(
//     'h1',
//     null,
//     'Hello',
//     props.name,
//     createElement('h2', null, 999),
//     createElement(Test, { name: 'Test' }, null),
//   )
// }

// const element = createElement(App, { name: 'Kelvin' }, null)
// render(element, container)

// hook
import { createElement, render, useState } from './micro-react'
const container = document.querySelector('#root')

const Counter = () => {
  const [state, setState] = useState(1)

  return createElement(
    'h1',
    {
      style: {
        color: 'red',
      },
    },
    state,

    createElement(
      'button',
      { onclick: () => setState((prev) => prev + 1) },
      '增加',
    ),
    createElement(
      'button',
      { onclick: () => setState((prev) => prev - 1) },
      '减少',
    ),
  )
}
const element = createElement(Counter)

render(element, container)
