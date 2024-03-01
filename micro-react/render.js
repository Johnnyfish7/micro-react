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
  console.log('%c render ------> ', 'color:#0f0;', container)
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
  deletion.forEach(commitWork)
  commitWork(wipRoot.child)
  // 记录当前fiber tree
  currentRoot = wipRoot
  wipRoot = null
}

// 渲染fiber
function commitWork(fiber) {
  if (!fiber) {
    return
  }
  const domParent = fiber.parent.dom

  if (fiber.effectTag === 'PLACEMENT' && fiber.dom) {
    domParent.append(fiber.dom)
  } else if (fiber.effectTag === 'DELETION' && fiber.dom) {
    domParent.removeChild(fiber.dom)
  } else if (fiber.effectTag === 'UPDATE' && fiber.dom) {
    updateDom(fiber.dom, fiber.alternate.props, fiber.props)
  }
  commitWork(fiber.child)
  commitWork(fiber.sibling)
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
  // 新建DOM元素
  if (!fiber.dom) {
    fiber.dom = createDOM(fiber)
  }

  // 给children创建fiber
  const elements = fiber.props.children
  // diff
  reconcileChildren(fiber, elements)
  // 构建fiber tree
  // let prevSibling = null
  // for (let i = 0; i < elements.length; i++) {
  //   const newFiber = {
  //     type: elements[i].type,
  //     props: elements[i].props,
  //     parent: fiber,
  //     child: null,
  //     sibling: null,
  //     dom: null,
  //   }
  // }

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

// diff
function reconcileChildren(wipFiber, elements) {
  console.log('%c reconcileChildren ------> ', 'color:#0f0;')
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
export default render
