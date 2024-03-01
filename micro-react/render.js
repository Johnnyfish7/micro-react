function createDOM(fiber) {
  // 创建父节点
  const dom =
    fiber.type == 'TEXT_ELEMENT'
      ? document.createTextNode('')
      : document.createElement(fiber.type)

  // 赋值属性
  Object.keys(fiber.props)
    .filter((key) => key !== 'children')
    .forEach((key) => (dom[key] = fiber.props[key]))

  return dom
}

// 开始渲染
function render(element, container) {
  console.log('%c render1 ------> ', 'color:#0f0;', container)
  // Root Fiber
  wipRoot = {
    dom: container,
    props: {
      children: [element],
    },
    child: null,
    alternate: currentRoot,
  }
  nextUnitOfWork = wipRoot
  deletion = []
}

// 渲染Root
// Commit Phase  fiber tree 生成完成 一次commit 进行渲染
function commitRoot() {
  console.log('%c commitRoot ------> ', 'color:#0f0;', wipRoot.child)
  deletion.forEach(commitWork)
  commitWork(wipRoot.child)
  // 记录当前fiber tree
  currentRoot = wipRoot
  wipRoot = null
}

// 渲染fiber  fiber 对应着具体的 虚拟jsdom
function commitWork(fiber) {
  console.log(
    '%c commitWork ------> ',
    'color:#0f0;',
    fiber,
    fiber && fiber.type,
  )
  if (!fiber) {
    return
  }
  let domParentFiber = fiber.parent
  while (!domParentFiber.dom) {
    domParentFiber = domParentFiber.parent
  }
  const domParent = domParentFiber.dom

  if (fiber.effectTag === 'PLACEMENT' && fiber.dom) {
    domParent.append(fiber.dom)
  } else if (fiber.effectTag === 'DELETION' && fiber.dom) {
    // domParent.removeChild(fiber.dom)
    commitDeletion(fiber, domParent)
  } else if (fiber.effectTag === 'UPDATE' && fiber.dom) {
    updateDom(fiber.dom, fiber.alternate.props, fiber.props)
  }

  // 如果还有则继续
  fiber.child && commitWork(fiber.child)
  fiber.sibling && commitWork(fiber.sibling)
}

function commitDeletion(fiber, domParent) {
  if (fiber.dom) {
    domParent.removeChild(fiber.dom)
  } else {
    // 向下寻找最近的dom 因为函数没有dom
    commitDeletion(fiber.child, domParent)
  }
}

const isProperty = (key) => key !== 'children' && !isEvent(key)
const isNew = (prev, next) => (key) => prev[key] !== next[key]
const isGone = (prev, next) => (key) => !(key in next)
const isEvent = (key) => key.startsWith('on')

function updateDom(dom, prevProps, nextProps) {
  // 事件相关
  // 删除已经没有的 或者 变化的事件处理函数
  Object.keys(prevProps)
    .filter(isEvent)
    .filter((key) => isGone(key) || isNew(key))
    .forEach((key) => {
      const eventType = key.toLowerCase().substring(2)
      dom.removeEventListener(eventType, prevProps[key])
    })

  // 添加新的或者变化的事件处理函数
  Object.keys(prevProps)
    .filter(isEvent)
    .filter(isNew)
    .forEach((key) => {
      const eventType = key.toLowerCase().substring(2)
      dom.addEventListener(eventType, nextProps[key])
    })

  // 删除已经没有的props
  Object.keys(prevProps)
    .filter(isProperty)
    .filter(isGone)
    .forEach((key) => (dom[key] = ''))

  // set new props
  Object.keys(nextProps)
    .filter(isProperty)
    .filter(isNew)
    .forEach((key) => (dom[key] = nextProps[key]))
}

let nextUnitOfWork = null
let wipRoot = null
let currentRoot = null // 用于保存上次的fiberTree
let deletion = null

// 调度 workUnit片段
function workLoop(deadline) {
  // shouldYield 表示线程繁忙，应该中断渲染
  let shouldYield = false
  while (nextUnitOfWork && !shouldYield) {
    nextUnitOfWork = performUnitOfWork(nextUnitOfWork)
    // 检查线程是否繁忙
    shouldYield = deadline.timeRemaining() < 1
  }
  // 重新请求
  requestIdleCallback(workLoop)

  if (!nextUnitOfWork && wipRoot) {
    // fiber tree 生成完成之后才进行commit
    commitRoot()
  }
}

// 请求在空闲时执行渲染
requestIdleCallback(workLoop)

// 执行一个渲染任务单元，并返回新的任务
function performUnitOfWork(fiber) {
  console.log('%c performUnitOfWork2 ------> ', 'color:#0f0;')
  const isFunctionComponent = fiber.type instanceof Function

  if (isFunctionComponent) {
    updateFunctionComponent(fiber)
  } else {
    updateHostComponent(fiber)
  }

  // 如果有child，就返回child fiber
  if (fiber.child) {
    return fiber.child
  }
  // 没有就优先返回兄弟，向上查找
  // 如果没有，就不返回，返回值为undefined
  let nextFiber = fiber
  while (nextFiber) {
    // 有sibling
    if (nextFiber.sibling) {
      return nextFiber.sibling
    }
    // 向上查找
    nextFiber = nextFiber.parent
  }
}

// 处理非函数组件
function updateHostComponent(fiber) {
  console.log('%c updateHostComponent3 ------> ', 'color:#0f0;', fiber)
  // 新建DOM元素
  if (!fiber.dom) {
    fiber.dom = createDOM(fiber)
  }
  // 给children创建fiber
  const elements = fiber.props.children
  // diff
  reconcileChildren(fiber, elements)
}

let wipFiber = null
let hookIndex = null
// 处理函数组件
function updateFunctionComponent(fiber) {
  console.log('%c updateFunctionComponent3 ------> ', 'color:#0f0;', fiber)

  wipFiber = fiber
  hookIndex = 0
  wipFiber.hooks = []
  const children = [fiber.type(fiber.props)]
  // diff
  reconcileChildren(fiber, children)
}

function useState(init) {
  console.log('%c useState ------> ', 'color:#0f0;')
  const oldHook =
    wipFiber.alternate &&
    wipFiber.alternate.hooks &&
    wipFiber.alternate.hooks[hookIndex]

  const hook = {
    state: oldHook ? oldHook.state : init,
    queue: [],
  }

  const actions = oldHook ? oldHook.queue : []
  actions.forEach((action) => {
    hook.state = action(hook.state)
  })

  const setState = (action) => {
    hook.queue.push(action)

    // 重新设定wipRoot，触发渲染更新
    // 重新render
    wipRoot = {
      dom: currentRoot.dom,
      props: currentRoot.props,
      alternate: currentRoot,
    }
    nextUnitOfWork = wipRoot
    deletion = []
  }

  wipFiber.hooks.push(hook)
  hookIndex++
  return [hook.state, setState]
}

// diff 并且 打上标签  同一层级的去比较
function reconcileChildren(wipFiber, elements) {
  console.log('%c reconcileChildren4 ------> ', 'color:#0f0;')
  console.log('%c elements ------> ', 'color:#0f0;', elements)
  let index = 0
  let oldFiber = wipFiber.alternate && wipFiber.alternate.child

  console.log('%c oldFiber ------> ', 'colo:#0f0;', oldFiber)
  let prevSibling = null
  let newFiber = null

  while (index < elements.length || oldFiber) {
    console.log('%c while ------> ', 'color:#0f0;')
    const element = elements[index]
    console.log('%c element ------> ', 'color:#0f0;', element)
    const sameType = element && oldFiber && element.type === oldFiber.type

    if (sameType) {
      console.log('%c update ------> ', 'color:#0f0;')
      // update
      newFiber = {
        type: oldFiber.type,
        props: element.props,
        dom: oldFiber.dom,
        parent: wipFiber,
        alternate: oldFiber,
        effectTag: 'UPDATE',
      }
    }

    if (element && !sameType) {
      console.log('%c create ------> ', 'color:#0f0;')
      // create
      newFiber = {
        type: element.type,
        props: element.props,
        dom: null,
        parent: wipFiber,
        alternate: null,
        effectTag: 'PLACEMENT',
      }
    }

    if (oldFiber && !sameType) {
      console.log('%c delete ------> ', 'color:#0f0;')
      // delete
      oldFiber.effectTag = 'DELETION'
      deletion.push(oldFiber)
    }

    if (oldFiber) {
      oldFiber = oldFiber.sibling
    }

    // 第一个child才可以作为child，其他的就是sibling
    if (index === 0) {
      wipFiber.child = newFiber
    } else {
      prevSibling.sibling = newFiber
    }

    // 用来连接fiber关系  sibling
    prevSibling = newFiber

    index++
  }
}

export { render, useState }
