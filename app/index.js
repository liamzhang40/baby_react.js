function Component(props) {
  this.props = props;
}

Component.prototype.setState = function(newState) {
  this._pendingState = Object.assign({}, this.state, newState);
  this.updateComponent();
}
Component.prototype.render = function() {}
Component.prototype.updateComponent = function() {
  // when state updates
  const prevState = this.state;
  const prevRenderedElement = this._currentElement;

  if (this._pendingState !== prevState) {
    this.state = this._pendingState;
  }

  this._pendingState = null;
  const nextRenderedElement = this.render();

  this._currentElement = nextRenderedElement;

  update(prevRenderedElement, nextRenderedElement, this._parentNode);
}

/**
 * 
 * @param {*} tag  
 * @param {*} config 
 * @param {*} children 
 */
function createElement(tag, config, children) {
  if (typeof tag === 'function') {
    return createVComponent(tag, config);
  }

  return createVElement(tag, config, children);
}

function createVElement(tag, config, children = null) {
  const { className, style } = config;
  
  return {
    tag,
    props: {
      children,
    },
    className,
    style,
    dom: null,
  }
}

function createVComponent(tag, props) {
  return {
    tag,
    props,
    dom: null,
  }
}

function mount(input, parentDOMNode) {
  if (typeof input === 'string' || typeof input === 'number') {
    return mountVText(input, parentDOMNode);
  } else if (typeof input.tag === 'function') {
    return mountVComponent(input, parentDOMNode);
  } else if (typeof input.tag === 'string') {
    return mountVElement(input, parentDOMNode);
  }
}

function mountVText(vText, parentDOMNode) {
  parentDOMNode.textContent = vText;

  return vText;
}

function mountVElement(vElement, parentDOMNode) {
  const {tag, className, props, style} = vElement;

  const domNode = document.createElement(tag);

  vElement.dom = domNode;

  if (props.children) {
    props.children.forEach(child => {
      mount(child, domNode);
    })
  }

  if (className !== undefined) {
    domNode.className = className;
  }

  if (style !== undefined) {
    Object.keys(style).forEach(sKey => domNode.style[sKey] = style[sKey]);
  }

  parentDOMNode.appendChild(domNode);
  return domNode;
}

function mountVComponent(vComponent, parentDOMNode) {
  const { tag, props } = vComponent;

  const Component = tag;
  const instance = new Component(props);

  const nextRenderedElement = instance.render();

  instance._currentElement = nextRenderedElement;

  instance._parentNode = parentDOMNode;

  const dom = mount(nextRenderedElement, parentDOMNode);

  vComponent._instance = instance;
  vComponent.dom = dom;

  // parentDOMNode.appendChild(dom);

  return dom;
}

function update(prevElement, nextElement, parentDOMNode) {
  if (prevElement.tag === nextElement.tag) {
    if (typeof prevElement === 'string' || prevElement === 'number') {
      updateVText(prevElement, nextElement, parentDOMNode)
    } else if (typeof prevElement.tag === 'string') {
      updateVElement(prevElement, nextElement);
    } else if (typeof prevElement.tag === 'function') {
      updateVComponent(prevElement, nextElement)
    }
  }
}

function updateVText(prevText, nextText, parentDOM) {
  if (prevText !== nextText) {
    parentDOM.firstChild.nodeValue = nextText;
  }
}

function updateVElement(prevElement, nextElement) {
  const prevDOM = prevElement.dom;

  nextElement.dom = prevDOM;

  const nextStyle = nextElement.style;
  if (prevElement.style !== nextStyle) {
    Object.keys(nextStyle).forEach((s) => nextElement.dom.style[s] = nextStyle[s])
  }

  if (nextElement.props.children) {
    updateChildren(prevElement.props.children, nextElement.props.children, nextElement.dom)
  }
}

function updateVComponent(prevComponent, nextComponent) {
  // when props updates
  const prevProps = prevComponent.props;
  const nextProps = nextComponent.props;

  // if props update
  nextComponent.dom = prevComponent.dom;
  nextComponent._instance = prevComponent._instance;
  prevComponent._instance.props = nextProps;

  const prevRenderedElement = prevComponent._instance._currentElement;
  const nextRenderedElement = nextComponent._instance.render();

  nextComponent._instance._currentElement = nextRenderedElement;

  update(prevRenderedElement, nextRenderedElement, nextComponent._instance._parentNode);
}

function updateChildren(prevChildren, nextChildren, parentDOMNode) {
  for (let i = 0; i < nextChildren.length; i++) {
    update(prevChildren[i], nextChildren[i], parentDOMNode);
  }
}

class NestedApp extends Component {
  constructor(props) {
    super(props);
  }

  render() {
    return createElement('h1', {
      style: {
        color: '#' + Math.floor(Math.random() * 16777215).toString(16)
      }
    }, [`The count from parent is: ${this.props.counter}`])
  }
}

class App extends Component {
  constructor() {
    super();
    this.state = {
      counter: 1
    }
    setInterval(() => {
      if (this.state.counter <= 10) {
        this.setState({
          counter: this.state.counter + 1
        })
      }
    }, 500);
  }

  render() {
    const {
      counter
    } = this.state;
    //background color stolen from: https://www.paulirish.com/2009/random-hex-color-code-snippets/
    return createElement('div', {
      style: {
        height: `${10 * counter}px`,
        background: '#' + Math.floor(Math.random() * 16777215).toString(16)
      }
    }, [
      `the counter is ${counter}`,
      createElement('h1', {
        style: {
          color: '#' + Math.floor(Math.random() * 16777215).toString(16)
        }
      }, [`${'BOOM! '.repeat(counter)}`]),
      createElement(NestedApp, {
        counter: counter
      })
    ]);
  }
}

const root = document.body;

mount(createElement(App), root);